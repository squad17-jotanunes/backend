import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class TrilhasController {
	// Listar todas as trilhas de aprendizagem
	async listarTodas(c: Context): Promise<Response> {
		try {
			const trilhas = await prisma.trilhaAprendizagem.findMany({
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					itensTrilha: {
						include: {
							modulo: {
								select: {
									id: true,
									nome: true,
									descricao: true
								}
							}
						},
						orderBy: {
							ordem: 'asc'
						}
					}
				}
			});

			return c.json(trilhas);
		} catch (error) {
			console.error('Erro ao listar trilhas de aprendizagem:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar trilha por ID
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const trilha = await prisma.trilhaAprendizagem.findUnique({
				where: { id },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					itensTrilha: {
						include: {
							modulo: {
								select: {
									id: true,
									nome: true,
									descricao: true,
									conteudos: {
										select: {
											id: true,
											titulo: true,
											tipo: true,
											ordem: true
										},
										orderBy: {
											ordem: 'asc'
										}
									}
								}
							}
						},
						orderBy: {
							ordem: 'asc'
						}
					},
					avaliacao: {
						select: {
							id: true,
							titulo: true
						}
					}
				}
			});

			if (!trilha) {
				return c.json({ error: 'Trilha de aprendizagem não encontrada' }, 404);
			}

			return c.json(trilha);
		} catch (error) {
			console.error('Erro ao buscar trilha de aprendizagem:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar nova trilha de aprendizagem
	async criar(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Validar dados obrigatórios
			if (
				!dados.nome ||
				!dados.descricao ||
				!Array.isArray(dados.modulos) ||
				dados.modulos.length === 0
			) {
				return c.json(
					{
						error:
							'Dados incompletos. Forneça nome, descrição e pelo menos um módulo'
					},
					400
				);
			}

			// Verificar se todos os módulos existem
			const modulosIds = dados.modulos.map(
				(item: { modulo_id: number }) => item.modulo_id
			);
			const modulos = await prisma.modulo.findMany({
				where: {
					id: {
						in: modulosIds
					}
				}
			});

			if (modulos.length !== modulosIds.length) {
				return c.json(
					{ error: 'Um ou mais módulos não foram encontrados' },
					404
				);
			}

			// Criar a trilha de aprendizagem em uma transação
			const novaTrilha = await prisma.$transaction(async (tx) => {
				// Criar a trilha
				const trilha = await tx.trilhaAprendizagem.create({
					data: {
						nome: dados.nome,
						descricao: dados.descricao,
						gestor_id: gestorId
					}
				});

				// Criar os itens da trilha (associação com módulos)
				for (const item of dados.modulos) {
					await tx.itemTrilha.create({
						data: {
							trilha_id: trilha.id,
							modulo_id: item.modulo_id,
							ordem: item.ordem || 1
						}
					});
				}

				// Recuperar a trilha completa
				return await tx.trilhaAprendizagem.findUnique({
					where: { id: trilha.id },
					include: {
						gestor: {
							select: {
								id: true,
								nome: true
							}
						},
						itensTrilha: {
							include: {
								modulo: {
									select: {
										id: true,
										nome: true,
										descricao: true
									}
								}
							},
							orderBy: {
								ordem: 'asc'
							}
						}
					}
				});
			});

			return c.json(novaTrilha, 201);
		} catch (error) {
			console.error('Erro ao criar trilha de aprendizagem:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar trilha existente
	async atualizar(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a trilha existe
			const trilhaExiste = await prisma.trilhaAprendizagem.findUnique({
				where: { id }
			});

			if (!trilhaExiste) {
				return c.json({ error: 'Trilha de aprendizagem não encontrada' }, 404);
			}

			// Atualizar a trilha em uma transação
			const trilhaAtualizada = await prisma.$transaction(async (tx) => {
				// Atualizar campos básicos da trilha
				const trilha = await tx.trilhaAprendizagem.update({
					where: { id },
					data: {
						nome: dados.nome ?? undefined,
						descricao: dados.descricao ?? undefined
					}
				});

				// Se fornecido novos módulos, atualizar a estrutura da trilha
				if (Array.isArray(dados.modulos)) {
					// Remover todos os itens da trilha atuais
					await tx.itemTrilha.deleteMany({
						where: {
							trilha_id: id
						}
					});

					// Verificar se todos os módulos existem
					const modulosIds = dados.modulos.map(
						(item: { modulo_id: number }) => item.modulo_id
					);
					const modulos = await tx.modulo.findMany({
						where: {
							id: {
								in: modulosIds
							}
						}
					});

					if (modulos.length !== modulosIds.length) {
						throw new Error('Um ou mais módulos não foram encontrados');
					}

					// Criar os novos itens da trilha
					for (const item of dados.modulos) {
						await tx.itemTrilha.create({
							data: {
								trilha_id: trilha.id,
								modulo_id: item.modulo_id,
								ordem: item.ordem || 1
							}
						});
					}
				}

				// Recuperar a trilha completa
				return await tx.trilhaAprendizagem.findUnique({
					where: { id: trilha.id },
					include: {
						gestor: {
							select: {
								id: true,
								nome: true
							}
						},
						itensTrilha: {
							include: {
								modulo: {
									select: {
										id: true,
										nome: true,
										descricao: true
									}
								}
							},
							orderBy: {
								ordem: 'asc'
							}
						}
					}
				});
			});

			return c.json(trilhaAtualizada);
		} catch (error) {
			console.error('Erro ao atualizar trilha de aprendizagem:', error);
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir trilha
	async excluir(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a trilha existe
			const trilha = await prisma.trilhaAprendizagem.findUnique({
				where: { id }
			});

			if (!trilha) {
				return c.json({ error: 'Trilha de aprendizagem não encontrada' }, 404);
			}

			// Verificar se existem registros relacionados que precisam ser excluídos primeiro
			const progressos = await prisma.trilhaProgressoUsuario.count({
				where: { trilha_id: id }
			});

			if (progressos > 0) {
				return c.json(
					{
						error:
							'A trilha não pode ser excluída porque possui registros de progresso associados'
					},
					400
				);
			}

			// Excluir a trilha em uma transação
			await prisma.$transaction(async (tx) => {
				// Remover todos os itens da trilha
				await tx.itemTrilha.deleteMany({
					where: {
						trilha_id: id
					}
				});

				// Remover a trilha
				await tx.trilhaAprendizagem.delete({
					where: { id }
				});
			});

			return c.json({ message: 'Trilha de aprendizagem excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir trilha de aprendizagem:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Iniciar trilha para um usuário
	async iniciarTrilha(c: Context): Promise<Response> {
		try {
			const trilhaId = Number(c.req.param('id'));
			const { id: usuarioId } = c.get('jwtPayload') as { id: number };

			// Verificar se o ID é um número válido
			if (Number.isNaN(trilhaId)) {
				return c.json({ error: 'ID de trilha inválido' }, 400);
			}

			// Verificar se a trilha existe
			const trilha = await prisma.trilhaAprendizagem.findUnique({
				where: { id: trilhaId }
			});

			if (!trilha) {
				return c.json({ error: 'Trilha de aprendizagem não encontrada' }, 404);
			}

			// Verificar se o usuário já iniciou esta trilha
			const progressoExistente = await prisma.trilhaProgressoUsuario.findFirst({
				where: {
					trilha_id: trilhaId,
					usuario_id: usuarioId
				}
			});

			if (progressoExistente) {
				return c.json({
					message: 'Você já iniciou esta trilha de aprendizagem anteriormente',
					progresso: progressoExistente
				});
			}

			// Registrar o início da trilha
			const novoProgresso = await prisma.trilhaProgressoUsuario.create({
				data: {
					trilha_id: trilhaId,
					usuario_id: usuarioId,
					data_inicio: new Date(),
					percentual: 0,
					finalizado: false
				}
			});

			return c.json(
				{
					message: 'Trilha de aprendizagem iniciada com sucesso',
					progresso: novoProgresso
				},
				201
			);
		} catch (error) {
			console.error('Erro ao iniciar trilha de aprendizagem:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Obter progresso do usuário em uma trilha
	async obterProgresso(c: Context): Promise<Response> {
		try {
			const trilhaId = Number(c.req.param('id'));
			const { id: usuarioId } = c.get('jwtPayload') as { id: number };

			// Verificar se o ID é um número válido
			if (Number.isNaN(trilhaId)) {
				return c.json({ error: 'ID de trilha inválido' }, 400);
			}

			// Buscar a trilha com seus módulos e conteúdos
			const trilha = await prisma.trilhaAprendizagem.findUnique({
				where: { id: trilhaId },
				include: {
					itensTrilha: {
						include: {
							modulo: {
								include: {
									conteudos: true
								}
							}
						}
					}
				}
			});

			if (!trilha) {
				return c.json({ error: 'Trilha de aprendizagem não encontrada' }, 404);
			}

			// Buscar progresso do usuário na trilha
			const progresso = await prisma.trilhaProgressoUsuario.findFirst({
				where: {
					trilha_id: trilhaId,
					usuario_id: usuarioId
				}
			});

			if (!progresso) {
				return c.json(
					{
						message: 'Você ainda não iniciou esta trilha de aprendizagem',
						progresso: null
					},
					404
				);
			}

			// Calcular o progresso real
			// 1. Contar total de conteúdos na trilha
			let totalConteudos = 0;
			const conteudosIds: number[] = [];

			// Obter todos os IDs de conteúdos que compõem a trilha
			for (const item of trilha.itensTrilha) {
				for (const conteudo of item.modulo.conteudos) {
					totalConteudos++;
					conteudosIds.push(conteudo.id);
				}
			}

			// 2. Contar quantos conteúdos o usuário já assistiu
			const conteudosAssistidos = await prisma.conteudoCheck.count({
				where: {
					usuario_id: usuarioId,
					conteudo_id: {
						in: conteudosIds
					}
				}
			});

			// 3. Calcular porcentagem do progresso
			const porcentagemProgresso =
				totalConteudos > 0
					? Math.round((conteudosAssistidos / totalConteudos) * 100)
					: 0;

			// 4. Atualizar o progresso na base se for diferente
			if (progresso.percentual !== porcentagemProgresso) {
				await prisma.trilhaProgressoUsuario.update({
					where: { id: progresso.id },
					data: { percentual: porcentagemProgresso }
				});
			}

			// 5. Definir status de conclusão se chegou a 100%
			if (porcentagemProgresso === 100 && !progresso.finalizado) {
				// Verificar se existe avaliação associada à trilha
				const avaliacaoTrilha = await prisma.avaliacao.findFirst({
					where: { trilha_id: trilhaId }
				});

				if (avaliacaoTrilha) {
					// Existe avaliação associada, mas aguardando conclusão
					await prisma.trilhaProgressoUsuario.update({
						where: { id: progresso.id },
						data: { finalizado: false }
					});
				} else {
					// Não existe avaliação, marcar como concluído
					await prisma.trilhaProgressoUsuario.update({
						where: { id: progresso.id },
						data: {
							finalizado: true,
							data_finalizacao: new Date()
						}
					});
				}
			}

			// Buscar o progresso atualizado
			const progressoAtualizado =
				await prisma.trilhaProgressoUsuario.findUnique({
					where: { id: progresso.id }
				});

			return c.json({
				progresso: progressoAtualizado,
				detalhes: {
					total_conteudos: totalConteudos,
					conteudos_assistidos: conteudosAssistidos,
					porcentagem: porcentagemProgresso
				}
			});
		} catch (error) {
			console.error('Erro ao obter progresso da trilha:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

// Exportar uma instância do controller
export const trilhasController = new TrilhasController();
