import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class CertificadosController {
	// Listar todos os certificados (acesso de gestor/admin)
	async listarTodos(c: Context): Promise<Response> {
		try {
			const certificados = await prisma.certificado.findMany({
				include: {
					usuario: {
						select: {
							id: true,
							nome: true,
							matricula: true
						}
					},
					trilha: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(certificados);
		} catch (error) {
			console.error('Erro ao listar certificados:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar certificados de um usuário específico
	async listarPorUsuario(c: Context): Promise<Response> {
		try {
			const usuarioId = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(usuarioId)) {
				return c.json({ error: 'ID de usuário inválido' }, 400);
			}

			// Verificar se o usuário existe
			const usuarioExiste = await prisma.usuario.findUnique({
				where: { id: usuarioId }
			});

			if (!usuarioExiste) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}

			// Buscar certificados do usuário
			const certificados = await prisma.certificado.findMany({
				where: { usuario_id: usuarioId },
				include: {
					trilha: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(certificados);
		} catch (error) {
			console.error('Erro ao buscar certificados do usuário:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar um certificado específico
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Buscar o certificado pelo ID
			const certificado = await prisma.certificado.findUnique({
				where: { id },
				include: {
					usuario: {
						select: {
							id: true,
							nome: true,
							matricula: true,
							setor: true
						}
					},
					trilha: {
						select: {
							id: true,
							nome: true,
							descricao: true
						}
					}
				}
			});

			// Verificar se o certificado existe
			if (!certificado) {
				return c.json({ error: 'Certificado não encontrado' }, 404);
			}

			return c.json(certificado);
		} catch (error) {
			console.error('Erro ao buscar certificado:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Emitir certificado para uma trilha concluída
	async emitir(c: Context): Promise<Response> {
		try {
			const { id: usuarioId } = c.get('jwtPayload') as { id: number };
			const trilhaId = Number(c.req.param('trilhaId'));

			// Verificar se o ID da trilha é um número válido
			if (Number.isNaN(trilhaId)) {
				return c.json({ error: 'ID de trilha inválido' }, 400);
			}

			// Verificar se a trilha existe
			const trilha = await prisma.trilhaAprendizagem.findUnique({
				where: { id: trilhaId }
			});

			if (!trilha) {
				return c.json({ error: 'Trilha não encontrada' }, 404);
			}

			// Verificar se o usuário concluiu a trilha
			const progresso = await prisma.trilhaProgressoUsuario.findFirst({
				where: {
					usuario_id: usuarioId,
					trilha_id: trilhaId,
					finalizado: true
				}
			});

			if (!progresso) {
				return c.json({ error: 'Usuário não concluiu esta trilha ainda' }, 400);
			}

			// Verificar se já existe um certificado para esta trilha/usuário
			const certificadoExistente = await prisma.certificado.findFirst({
				where: {
					usuario_id: usuarioId,
					trilha_id: trilhaId
				}
			});

			if (certificadoExistente) {
				return c.json({
					message: 'Certificado já emitido anteriormente',
					certificado: certificadoExistente
				});
			}

			// Criar o certificado
			const novoCertificado = await prisma.certificado.create({
				data: {
					usuario_id: usuarioId,
					trilha_id: trilhaId,
					data_emissao: new Date()
				}
			});

			// Gerar pontuação adicional pela conquista do certificado
			await prisma.pontuacao.create({
				data: {
					usuario_id: usuarioId,
					tipo_evento: 'CERTIFICADO',
					referencia_id: novoCertificado.id,
					pontos: 100, // Valor significativo por completar uma trilha
					data_evento: new Date(),
					descricao: `Certificado obtido na trilha: ${trilha.nome}`
				}
			});

			// Atualizar pontos do usuário
			await prisma.usuario.update({
				where: { id: usuarioId },
				data: {
					pontos: {
						increment: 100 // Incrementar os pontos do usuário
					}
				}
			});

			// Conceder moedas ao usuário pela obtenção do certificado
			await prisma.moeda.create({
				data: {
					usuario_id: usuarioId,
					tipo_evento: 'CERTIFICADO',
					referencia_id: novoCertificado.id,
					moedas: 50, // Valor significativo de moedas por completar uma trilha
					data_evento: new Date(),
					descricao: `Moedas por certificado na trilha: ${trilha.nome}`
				}
			});

			return c.json(
				{
					message: 'Certificado emitido com sucesso',
					certificado: novoCertificado
				},
				201
			);
		} catch (error) {
			console.error('Erro ao emitir certificado:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Gerar e baixar o PDF do certificado
	async downloadPDF(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const { id: usuarioSolicitante } = c.get('jwtPayload') as { id: number };

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Buscar o certificado com detalhes do usuário e da trilha
			const certificado = await prisma.certificado.findUnique({
				where: { id },
				include: {
					usuario: true,
					trilha: true
				}
			});

			// Verificar se o certificado existe
			if (!certificado) {
				return c.json({ error: 'Certificado não encontrado' }, 404);
			}

			// Verificar se o usuário tem permissão para acessar este certificado
			// (o próprio usuário ou um gestor/admin)
			const usuarioRequerente = await prisma.usuario.findUnique({
				where: { id: usuarioSolicitante }
			});

			if (
				certificado.usuario_id !== usuarioSolicitante &&
				!['gestor', 'admin'].includes(usuarioRequerente?.autoridade || '')
			) {
				return c.json(
					{ error: 'Acesso não autorizado a este certificado' },
					403
				);
			}

			// No futuro, aqui será implementado o código para gerar o PDF
			// Por enquanto, retornamos apenas os dados que seriam usados no PDF
			const dadosCertificado = {
				id: certificado.id,
				nomeCurso: certificado.trilha.nome,
				descricaoCurso: certificado.trilha.descricao,
				nomeCompleto: certificado.usuario.nome,
				matricula: certificado.usuario.matricula,
				setor: certificado.usuario.setor,
				dataEmissao: certificado.data_emissao.toLocaleDateString('pt-BR'),
				codigo: `CERT-${certificado.id.toString().padStart(6, '0')}`
			};

			// Por enquanto retornamos apenas os dados, no futuro retornaremos o arquivo PDF
			return c.json({
				message: 'Dados do certificado para geração de PDF',
				certificado: dadosCertificado
			});
		} catch (error) {
			console.error('Erro ao gerar PDF do certificado:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

export const certificadosController = new CertificadosController();
