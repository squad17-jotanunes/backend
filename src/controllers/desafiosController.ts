import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class DesafiosController {
	// Listar todos os desafios
	async listarDesafios(c: Context) {
		try {
			const desafios = await prisma.desafio.findMany({
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					desafioEtapas: {
						include: {
							avaliacao: {
								select: {
									id: true,
									titulo: true
								}
							}
						},
						orderBy: {
							ordem: 'asc'
						}
					}
				}
			});

			return c.json({ desafios });
		} catch (error) {
			console.error('Erro ao listar desafios:', error);
			return c.json({ error: 'Erro ao listar desafios' }, 500);
		}
	}

	// Buscar desafio por ID
	async buscarDesafio(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			const desafio = await prisma.desafio.findUnique({
				where: { id },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					desafioEtapas: {
						include: {
							avaliacao: {
								select: {
									id: true,
									titulo: true,
									descricao: true,
									questoes: {
										select: {
											id: true,
											texto: true
										}
									}
								}
							}
						},
						orderBy: {
							ordem: 'asc'
						}
					}
				}
			});

			if (!desafio) {
				return c.json({ error: 'Desafio não encontrado' }, 404);
			}

			return c.json({ desafio });
		} catch (error) {
			console.error('Erro ao buscar desafio:', error);
			return c.json({ error: 'Erro ao buscar desafio' }, 500);
		}
	}

	// Criar novo desafio
	async criarDesafio(c: Context) {
		try {
			const userId = c.get('userId');
			const body = await c.req.json();

			// Validações básicas
			if (!body.nome || !body.descricao) {
				return c.json({ error: 'Nome e descrição são obrigatórios' }, 400);
			}

			// Criar o desafio
			const novoDesafio = await prisma.desafio.create({
				data: {
					nome: body.nome,
					descricao: body.descricao,
					gestor_id: Number(userId)
				}
			});

			return c.json({ desafio: novoDesafio }, 201);
		} catch (error) {
			console.error('Erro ao criar desafio:', error);
			return c.json({ error: 'Erro ao criar desafio' }, 500);
		}
	}

	// Atualizar desafio existente
	async atualizarDesafio(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			const body = await c.req.json();

			// Verificar se o desafio existe
			const desafioExistente = await prisma.desafio.findUnique({
				where: { id }
			});

			if (!desafioExistente) {
				return c.json({ error: 'Desafio não encontrado' }, 404);
			}

			// Atualizar o desafio
			const desafioAtualizado = await prisma.desafio.update({
				where: { id },
				data: {
					nome: body.nome || desafioExistente.nome,
					descricao: body.descricao || desafioExistente.descricao
				}
			});

			return c.json({ desafio: desafioAtualizado });
		} catch (error) {
			console.error('Erro ao atualizar desafio:', error);
			return c.json({ error: 'Erro ao atualizar desafio' }, 500);
		}
	}

	// Excluir desafio
	async excluirDesafio(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			// Verificar se o desafio existe
			const desafioExistente = await prisma.desafio.findUnique({
				where: { id },
				include: {
					desafioEtapas: true
				}
			});

			if (!desafioExistente) {
				return c.json({ error: 'Desafio não encontrado' }, 404);
			}

			// Transação para excluir o desafio e suas etapas (sem excluir as avaliações)
			await prisma.$transaction(async (tx) => {
				// Excluir todas as etapas do desafio
				if (desafioExistente.desafioEtapas.length > 0) {
					await tx.desafioEtapa.deleteMany({
						where: {
							desafio_id: id
						}
					});
				}

				// Excluir o desafio
				await tx.desafio.delete({
					where: { id }
				});
			});

			return c.json({ message: 'Desafio excluído com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir desafio:', error);
			return c.json({ error: 'Erro ao excluir desafio' }, 500);
		}
	}

	// Criar etapa para um desafio
	async criarEtapaDesafio(c: Context) {
		const desafioId = Number(c.req.param('id'));

		if (Number.isNaN(desafioId)) {
			return c.json({ error: 'ID do desafio inválido' }, 400);
		}

		try {
			const body = await c.req.json();

			// Validações básicas
			if (!body.avaliacao_id || !body.ordem) {
				return c.json(
					{ error: 'ID da avaliação e ordem são obrigatórios' },
					400
				);
			}

			// Verificar se o desafio existe
			const desafioExistente = await prisma.desafio.findUnique({
				where: { id: desafioId }
			});

			if (!desafioExistente) {
				return c.json({ error: 'Desafio não encontrado' }, 404);
			}

			// Verificar se a avaliação existe
			const avaliacaoExistente = await prisma.avaliacao.findUnique({
				where: { id: Number(body.avaliacao_id) }
			});

			if (!avaliacaoExistente) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Verificar se já existe uma etapa com a mesma ordem
			const etapaExistenteComOrdem = await prisma.desafioEtapa.findFirst({
				where: {
					desafio_id: desafioId,
					ordem: Number(body.ordem)
				}
			});

			if (etapaExistenteComOrdem) {
				return c.json(
					{ error: 'Já existe uma etapa com esta ordem neste desafio' },
					400
				);
			}

			// Criar a etapa
			const novaEtapa = await prisma.desafioEtapa.create({
				data: {
					desafio_id: desafioId,
					avaliacao_id: Number(body.avaliacao_id),
					ordem: Number(body.ordem)
				},
				include: {
					avaliacao: {
						select: {
							titulo: true,
							descricao: true
						}
					}
				}
			});

			return c.json({ etapa: novaEtapa }, 201);
		} catch (error) {
			console.error('Erro ao criar etapa de desafio:', error);
			return c.json({ error: 'Erro ao criar etapa de desafio' }, 500);
		}
	}

	// Listar etapas de um desafio
	async listarEtapasDesafio(c: Context) {
		const desafioId = Number(c.req.param('id'));

		if (Number.isNaN(desafioId)) {
			return c.json({ error: 'ID do desafio inválido' }, 400);
		}

		try {
			// Verificar se o desafio existe
			const desafioExistente = await prisma.desafio.findUnique({
				where: { id: desafioId }
			});

			if (!desafioExistente) {
				return c.json({ error: 'Desafio não encontrado' }, 404);
			}

			// Buscar todas as etapas do desafio
			const etapas = await prisma.desafioEtapa.findMany({
				where: {
					desafio_id: desafioId
				},
				include: {
					avaliacao: {
						select: {
							id: true,
							titulo: true,
							descricao: true
						}
					}
				},
				orderBy: {
					ordem: 'asc'
				}
			});

			return c.json({ etapas });
		} catch (error) {
			console.error('Erro ao listar etapas de desafio:', error);
			return c.json({ error: 'Erro ao listar etapas de desafio' }, 500);
		}
	}

	// Atualizar etapa de desafio
	async atualizarEtapaDesafio(c: Context) {
		const etapaId = Number(c.req.param('id'));

		if (Number.isNaN(etapaId)) {
			return c.json({ error: 'ID da etapa inválido' }, 400);
		}

		try {
			const body = await c.req.json();

			// Verificar se a etapa existe
			const etapaExistente = await prisma.desafioEtapa.findUnique({
				where: { id: etapaId }
			});

			if (!etapaExistente) {
				return c.json({ error: 'Etapa não encontrada' }, 404);
			}

			// Validar ordem se for fornecida
			if (body.ordem !== undefined) {
				const etapaComMesmaOrdem = await prisma.desafioEtapa.findFirst({
					where: {
						desafio_id: etapaExistente.desafio_id,
						ordem: Number(body.ordem),
						id: {
							not: etapaId
						}
					}
				});

				if (etapaComMesmaOrdem) {
					return c.json(
						{ error: 'Já existe uma etapa com esta ordem neste desafio' },
						400
					);
				}
			}

			// Validar avaliação se for fornecida
			if (body.avaliacao_id !== undefined) {
				const avaliacaoExistente = await prisma.avaliacao.findUnique({
					where: { id: Number(body.avaliacao_id) }
				});

				if (!avaliacaoExistente) {
					return c.json({ error: 'Avaliação não encontrada' }, 404);
				}
			}

			// Atualizar a etapa
			const etapaAtualizada = await prisma.desafioEtapa.update({
				where: { id: etapaId },
				data: {
					avaliacao_id:
						body.avaliacao_id !== undefined
							? Number(body.avaliacao_id)
							: undefined,
					ordem: body.ordem !== undefined ? Number(body.ordem) : undefined
				},
				include: {
					avaliacao: {
						select: {
							titulo: true,
							descricao: true
						}
					}
				}
			});

			return c.json({ etapa: etapaAtualizada });
		} catch (error) {
			console.error('Erro ao atualizar etapa de desafio:', error);
			return c.json({ error: 'Erro ao atualizar etapa de desafio' }, 500);
		}
	}

	// Excluir etapa de desafio
	async excluirEtapaDesafio(c: Context) {
		const etapaId = Number(c.req.param('id'));

		if (Number.isNaN(etapaId)) {
			return c.json({ error: 'ID da etapa inválido' }, 400);
		}

		try {
			// Verificar se a etapa existe
			const etapaExistente = await prisma.desafioEtapa.findUnique({
				where: { id: etapaId }
			});

			if (!etapaExistente) {
				return c.json({ error: 'Etapa não encontrada' }, 404);
			}

			// Excluir a etapa
			await prisma.desafioEtapa.delete({
				where: { id: etapaId }
			});

			return c.json({ message: 'Etapa excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir etapa de desafio:', error);
			return c.json({ error: 'Erro ao excluir etapa de desafio' }, 500);
		}
	}
}

export default new DesafiosController();
