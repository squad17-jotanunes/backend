import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class ConteudosController {
	// Listar todos os conteúdos
	async listarTodos(c: Context): Promise<Response> {
		try {
			const conteudos = await prisma.conteudo.findMany({
				include: {
					modulo: {
						select: {
							id: true,
							nome: true
						}
					},
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(conteudos);
		} catch (error) {
			console.error('Erro ao listar conteúdos:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar conteúdo por ID
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const conteudo = await prisma.conteudo.findUnique({
				where: { id },
				include: {
					modulo: {
						select: {
							id: true,
							nome: true
						}
					},
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					avaliacoes: {
						select: {
							id: true,
							titulo: true
						}
					}
				}
			});

			if (!conteudo) {
				return c.json({ error: 'Conteúdo não encontrado' }, 404);
			}

			return c.json(conteudo);
		} catch (error) {
			console.error('Erro ao buscar conteúdo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Listar conteúdos por módulo
	async listarPorModulo(c: Context): Promise<Response> {
		try {
			const moduloId = Number(c.req.param('moduloId'));

			// Verificar se o ID do módulo é um número válido
			if (Number.isNaN(moduloId)) {
				return c.json({ error: 'ID de módulo inválido' }, 400);
			}

			// Verificar se o módulo existe
			const modulo = await prisma.modulo.findUnique({
				where: { id: moduloId }
			});

			if (!modulo) {
				return c.json({ error: 'Módulo não encontrado' }, 404);
			}

			const conteudos = await prisma.conteudo.findMany({
				where: { modulo_id: moduloId },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				},
				orderBy: {
					ordem: 'asc'
				}
			});

			return c.json(conteudos);
		} catch (error) {
			console.error('Erro ao listar conteúdos por módulo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar novo conteúdo
	async criar(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Validar dados obrigatórios
			if (
				!dados.modulo_id ||
				!dados.tipo ||
				!dados.titulo ||
				!dados.descricao ||
				!dados.url_video ||
				dados.ordem === undefined
			) {
				return c.json(
					{
						error:
							'Dados incompletos. Forneça módulo, tipo, título, descrição, URL do vídeo e ordem'
					},
					400
				);
			}

			// Verificar se o módulo existe
			const moduloExiste = await prisma.modulo.findUnique({
				where: { id: dados.modulo_id }
			});

			if (!moduloExiste) {
				return c.json({ error: 'Módulo não encontrado' }, 404);
			}

			// Criar o conteúdo
			const novoConteudo = await prisma.conteudo.create({
				data: {
					modulo_id: dados.modulo_id,
					tipo: dados.tipo,
					titulo: dados.titulo,
					descricao: dados.descricao,
					url_video: dados.url_video,
					url_pdf: dados.url_pdf || null,
					ordem: dados.ordem,
					gestor_id: gestorId
				},
				include: {
					modulo: {
						select: {
							id: true,
							nome: true
						}
					},
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(novoConteudo, 201);
		} catch (error) {
			console.error('Erro ao criar conteúdo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar conteúdo existente
	async atualizar(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o conteúdo existe
			const conteudoExiste = await prisma.conteudo.findUnique({
				where: { id }
			});

			if (!conteudoExiste) {
				return c.json({ error: 'Conteúdo não encontrado' }, 404);
			}

			// Se for fornecido um ID de módulo, verificar se o módulo existe
			if (dados.modulo_id) {
				const moduloExiste = await prisma.modulo.findUnique({
					where: { id: dados.modulo_id }
				});

				if (!moduloExiste) {
					return c.json({ error: 'Módulo não encontrado' }, 404);
				}
			}

			// Atualizar o conteúdo
			const conteudoAtualizado = await prisma.conteudo.update({
				where: { id },
				data: {
					modulo_id: dados.modulo_id ?? undefined,
					tipo: dados.tipo ?? undefined,
					titulo: dados.titulo ?? undefined,
					descricao: dados.descricao ?? undefined,
					url_video: dados.url_video ?? undefined,
					url_pdf: dados.url_pdf !== undefined ? dados.url_pdf : undefined,
					ordem: dados.ordem ?? undefined
				},
				include: {
					modulo: {
						select: {
							id: true,
							nome: true
						}
					},
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(conteudoAtualizado);
		} catch (error) {
			console.error('Erro ao atualizar conteúdo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir conteúdo
	async excluir(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o conteúdo existe
			const conteudo = await prisma.conteudo.findUnique({
				where: { id }
			});

			if (!conteudo) {
				return c.json({ error: 'Conteúdo não encontrado' }, 404);
			}

			// Verificar se existem registros relacionados que precisam ser excluídos primeiro
			const conteudoChecks = await prisma.conteudoCheck.count({
				where: { conteudo_id: id }
			});

			const avaliacoes = await prisma.avaliacao.count({
				where: { conteudo_id: id }
			});

			if (conteudoChecks > 0 || avaliacoes > 0) {
				return c.json(
					{
						error:
							'O conteúdo não pode ser excluído porque possui registros associados'
					},
					400
				);
			}

			// Excluir o conteúdo
			await prisma.conteudo.delete({
				where: { id }
			});

			return c.json({ message: 'Conteúdo excluído com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir conteúdo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Marcar conteúdo como assistido por usuário
	async marcarAssistido(c: Context): Promise<Response> {
		try {
			const conteudoId = Number(c.req.param('id'));
			const { id: usuarioId } = c.get('jwtPayload') as { id: number };

			// Verificar se o ID é um número válido
			if (Number.isNaN(conteudoId)) {
				return c.json({ error: 'ID de conteúdo inválido' }, 400);
			}

			// Verificar se o conteúdo existe
			const conteudo = await prisma.conteudo.findUnique({
				where: { id: conteudoId }
			});

			if (!conteudo) {
				return c.json({ error: 'Conteúdo não encontrado' }, 404);
			}

			// Verificar se o conteúdo já foi marcado como assistido
			const conteudoCheck = await prisma.conteudoCheck.findFirst({
				where: {
					conteudo_id: conteudoId,
					usuario_id: usuarioId
				}
			});

			if (conteudoCheck) {
				return c.json({ message: 'Conteúdo já foi marcado como assistido' });
			}

			// Marcar conteúdo como assistido
			const createdConteudoCheck = await prisma.conteudoCheck.create({
				data: {
					conteudo_id: conteudoId,
					usuario_id: usuarioId,
					data_assistido: new Date()
				}
			});

			// Atualizar pontuação do usuário
			await prisma.pontuacao.create({
				data: {
					usuario_id: usuarioId,
					pontos: 10, // Valor padrão para assistir um conteúdo
					referencia_id: createdConteudoCheck.id,
					tipo_evento: 'CONTEUDO_ASSISTIDO',
					descricao: `Conteúdo "${conteudo.titulo}" assistido`,
					data_evento: new Date()
				}
			});

			// Atualizar pontos do usuário
			await prisma.usuario.update({
				where: { id: usuarioId },
				data: {
					pontos: {
						increment: 10 // Incrementar os pontos do usuário
					}
				}
			});

			return c.json({ message: 'Conteúdo marcado como assistido com sucesso' });
		} catch (error) {
			console.error('Erro ao marcar conteúdo como assistido:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

// Exportar uma instância do controller
export const conteudosController = new ConteudosController();
