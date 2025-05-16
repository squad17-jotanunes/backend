import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class RecompensasController {
	// Listar todas as recompensas
	async listarRecompensas(c: Context) {
		try {
			const recompensas = await prisma.recompensa.findMany({
				orderBy: {
					moedas_requeridas: 'asc'
				}
			});

			return c.json({ recompensas });
		} catch (error) {
			console.error('Erro ao listar recompensas:', error);
			return c.json({ error: 'Erro ao listar recompensas' }, 500);
		}
	}

	// Buscar recompensa por ID
	async buscarRecompensa(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			const recompensa = await prisma.recompensa.findUnique({
				where: { id }
			});

			if (!recompensa) {
				return c.json({ error: 'Recompensa não encontrada' }, 404);
			}

			return c.json({ recompensa });
		} catch (error) {
			console.error('Erro ao buscar recompensa:', error);
			return c.json({ error: 'Erro ao buscar recompensa' }, 500);
		}
	}

	// Criar uma nova recompensa
	async criarRecompensa(c: Context) {
		try {
			const userId = c.get('userId');
			const body = await c.req.json();

			// Validações básicas
			if (
				!body.nome ||
				!body.descricao ||
				!body.moedas_requeridas ||
				!body.tipo
			) {
				return c.json(
					{
						error: 'Nome, descrição, moedas requeridas e tipo são obrigatórios'
					},
					400
				);
			}

			if (body.moedas_requeridas <= 0) {
				return c.json(
					{ error: 'Moedas requeridas deve ser maior que zero' },
					400
				);
			}

			const novaRecompensa = await prisma.recompensa.create({
				data: {
					nome: body.nome,
					descricao: body.descricao,
					moedas_requeridas: Number(body.moedas_requeridas),
					tipo: body.tipo,
					quantidade_disponivel: body.quantidade_disponivel
						? Number(body.quantidade_disponivel)
						: null,
					gestor_id: Number(userId)
				}
			});

			return c.json({ recompensa: novaRecompensa }, 201);
		} catch (error) {
			console.error('Erro ao criar recompensa:', error);
			return c.json({ error: 'Erro ao criar recompensa' }, 500);
		}
	}

	// Atualizar recompensa existente
	async atualizarRecompensa(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			const body = await c.req.json();

			// Verificar se a recompensa existe
			const recompensaExistente = await prisma.recompensa.findUnique({
				where: { id }
			});

			if (!recompensaExistente) {
				return c.json({ error: 'Recompensa não encontrada' }, 404);
			}

			// Atualizar a recompensa
			const recompensaAtualizada = await prisma.recompensa.update({
				where: { id },
				data: {
					nome: body.nome || recompensaExistente.nome,
					descricao: body.descricao || recompensaExistente.descricao,
					moedas_requeridas: body.moedas_requeridas
						? Number(body.moedas_requeridas)
						: recompensaExistente.moedas_requeridas,
					tipo: body.tipo || recompensaExistente.tipo,
					quantidade_disponivel:
						body.quantidade_disponivel !== undefined
							? Number(body.quantidade_disponivel)
							: recompensaExistente.quantidade_disponivel
				}
			});

			return c.json({ recompensa: recompensaAtualizada });
		} catch (error) {
			console.error('Erro ao atualizar recompensa:', error);
			return c.json({ error: 'Erro ao atualizar recompensa' }, 500);
		}
	}

	// Excluir recompensa
	async excluirRecompensa(c: Context) {
		const id = Number(c.req.param('id'));

		if (Number.isNaN(id)) {
			return c.json({ error: 'ID inválido' }, 400);
		}

		try {
			// Verificar se a recompensa existe
			const recompensaExistente = await prisma.recompensa.findUnique({
				where: { id }
			});

			if (!recompensaExistente) {
				return c.json({ error: 'Recompensa não encontrada' }, 404);
			}

			// Verificar se há usuários que já resgataram esta recompensa
			const resgatesTotais = await prisma.usuarioRecompensa.count({
				where: { recompensa_id: id }
			});

			if (resgatesTotais > 0) {
				return c.json(
					{
						error:
							'Esta recompensa já foi resgatada por usuários e não pode ser excluída'
					},
					400
				);
			}

			// Excluir a recompensa
			await prisma.recompensa.delete({
				where: { id }
			});

			return c.json({ message: 'Recompensa excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir recompensa:', error);
			return c.json({ error: 'Erro ao excluir recompensa' }, 500);
		}
	}

	// Resgatar recompensa
	async resgatarRecompensa(c: Context) {
		const recompensaId = Number(c.req.param('id'));
		const userId = c.get('userId');

		if (Number.isNaN(recompensaId)) {
			return c.json({ error: 'ID da recompensa inválido' }, 400);
		}

		try {
			// Verificar se a recompensa existe
			const recompensa = await prisma.recompensa.findUnique({
				where: { id: recompensaId }
			});

			if (!recompensa) {
				return c.json({ error: 'Recompensa não encontrada' }, 404);
			}

			// Verificar disponibilidade se houver limite
			if (
				recompensa.quantidade_disponivel !== null &&
				recompensa.quantidade_disponivel <= 0
			) {
				return c.json({ error: 'Recompensa esgotada' }, 400);
			}

			// Verificar se o usuário tem moedas suficientes
			const usuario = await prisma.usuario.findUnique({
				where: { id: Number(userId) }
			});

			if (!usuario) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}

			// Calcular total de moedas do usuário
			const totalMoedas = await prisma.moeda.aggregate({
				where: { usuario_id: Number(userId) },
				_sum: {
					moedas: true
				}
			});

			const moedasDoUsuario = totalMoedas._sum.moedas || 0;

			// Verificar se tem moedas suficientes
			if (moedasDoUsuario < recompensa.moedas_requeridas) {
				return c.json(
					{
						error: 'Moedas insuficientes',
						moedasUsuario: moedasDoUsuario,
						moedasNecessarias: recompensa.moedas_requeridas
					},
					400
				);
			}

			// Criar registro de resgate
			const resgate = await prisma.usuarioRecompensa.create({
				data: {
					usuario_id: Number(userId),
					recompensa_id: recompensaId,
					data_resgate: new Date(),
					status: 'RESGATADO' // Status inicial ao resgatar
				}
			});

			// Debitar moedas do usuário (criar registro negativo de moedas)
			await prisma.moeda.create({
				data: {
					usuario_id: Number(userId),
					tipo_evento: 'RESGATE_RECOMPENSA',
					referencia_id: resgate.id, // ID do resgate como referência
					moedas: -recompensa.moedas_requeridas, // Valor negativo para débito
					data_evento: new Date(),
					descricao: `Resgate da recompensa: ${recompensa.nome}`
				}
			});

			// Atualizar quantidade disponível se houver limite
			if (recompensa.quantidade_disponivel !== null) {
				await prisma.recompensa.update({
					where: { id: recompensaId },
					data: {
						quantidade_disponivel: recompensa.quantidade_disponivel - 1
					}
				});
			}

			return c.json({
				message: 'Recompensa resgatada com sucesso',
				resgate
			});
		} catch (error) {
			console.error('Erro ao resgatar recompensa:', error);
			return c.json({ error: 'Erro ao resgatar recompensa' }, 500);
		}
	}

	// Listar recompensas do usuário
	async listarRecompensasUsuario(c: Context) {
		const userId = c.req.param('id')
			? Number(c.req.param('id'))
			: c.get('userId');

		if (Number.isNaN(userId)) {
			return c.json({ error: 'ID do usuário inválido' }, 400);
		}

		try {
			const resgates = await prisma.usuarioRecompensa.findMany({
				where: { usuario_id: Number(userId) },
				include: {
					recompensa: true
				},
				orderBy: {
					data_resgate: 'desc'
				}
			});

			return c.json({ resgates });
		} catch (error) {
			console.error('Erro ao listar recompensas do usuário:', error);
			return c.json({ error: 'Erro ao listar recompensas do usuário' }, 500);
		}
	}

	// Obter saldo de moedas do usuário
	async obterSaldoMoedas(c: Context) {
		const userId = c.req.param('id')
			? Number(c.req.param('id'))
			: c.get('userId');

		if (Number.isNaN(userId)) {
			return c.json({ error: 'ID do usuário inválido' }, 400);
		}

		try {
			// Calcular total de moedas do usuário
			const totalMoedas = await prisma.moeda.aggregate({
				where: { usuario_id: Number(userId) },
				_sum: {
					moedas: true
				}
			});

			const saldoMoedas = totalMoedas._sum.moedas || 0;

			return c.json({ usuario_id: userId, saldo_moedas: saldoMoedas });
		} catch (error) {
			console.error('Erro ao obter saldo de moedas:', error);
			return c.json({ error: 'Erro ao obter saldo de moedas' }, 500);
		}
	}

	// Alterar status de uma recompensa resgatada (para gestores)
	async alterarStatusResgate(c: Context) {
		const resgateId = Number(c.req.param('id'));

		if (Number.isNaN(resgateId)) {
			return c.json({ error: 'ID do resgate inválido' }, 400);
		}

		try {
			const body = await c.req.json();

			if (!body.status) {
				return c.json({ error: 'Status é obrigatório' }, 400);
			}

			const statusValidos = [
				'RESGATADO',
				'PROCESSANDO',
				'ENTREGUE',
				'CANCELADO'
			];
			if (!statusValidos.includes(body.status)) {
				return c.json({ error: 'Status inválido', statusValidos }, 400);
			}

			// Verificar se o resgate existe
			const resgate = await prisma.usuarioRecompensa.findUnique({
				where: { id: resgateId },
				include: { recompensa: true }
			});

			if (!resgate) {
				return c.json({ error: 'Resgate não encontrado' }, 404);
			}

			// Se o status for CANCELADO, devolver as moedas ao usuário
			if (body.status === 'CANCELADO' && resgate.status !== 'CANCELADO') {
				await prisma.moeda.create({
					data: {
						usuario_id: resgate.usuario_id,
						tipo_evento: 'ESTORNO_RECOMPENSA',
						referencia_id: resgate.id,
						moedas: resgate.recompensa.moedas_requeridas, // Estorno positivo
						data_evento: new Date(),
						descricao: `Estorno do resgate da recompensa: ${resgate.recompensa.nome}`
					}
				});

				// Se a recompensa tem limite de quantidade, aumentar o contador novamente
				if (resgate.recompensa.quantidade_disponivel !== null) {
					await prisma.recompensa.update({
						where: { id: resgate.recompensa_id },
						data: {
							quantidade_disponivel:
								resgate.recompensa.quantidade_disponivel + 1
						}
					});
				}
			}

			// Atualizar o status do resgate
			const resgateAtualizado = await prisma.usuarioRecompensa.update({
				where: { id: resgateId },
				data: {
					status: body.status
				},
				include: {
					recompensa: true,
					usuario: {
						select: {
							id: true,
							nome: true,
							matricula: true,
							setor: true
						}
					}
				}
			});

			return c.json({
				message: `Status do resgate alterado para ${body.status}`,
				resgate: resgateAtualizado
			});
		} catch (error) {
			console.error('Erro ao alterar status do resgate:', error);
			return c.json({ error: 'Erro ao alterar status do resgate' }, 500);
		}
	}
}

export default new RecompensasController();
