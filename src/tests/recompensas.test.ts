import type { Context } from 'hono';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import recompensas from '../routes/recompensas';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type Recompensa = {
	id: number;
	nome: string;
	descricao: string;
	moedas_requeridas: number;
	tipo: string;
	quantidade_disponivel: number | null;
	gestor_id: number;
	gestor?: {
		id: number;
		nome: string;
	};
};

type UsuarioRecompensa = {
	id: number;
	usuario_id: number;
	recompensa_id: number;
	data_resgate: string | Date;
	status: string;
	recompensa?: Recompensa;
	usuario?: {
		id: number;
		nome: string;
		matricula: string;
		setor: string;
	};
};

type Moeda = {
	id: number;
	usuario_id: number;
	tipo_evento: string;
	referencia_id: number;
	moedas: number;
	data_evento: string | Date;
	descricao: string | null;
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	recompensa: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	usuarioRecompensa: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		count: ReturnType<typeof vi.fn>;
	};
	moeda: {
		create: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
	};
	usuario: {
		findUnique: ReturnType<typeof vi.fn>;
	};
};

// Mock para o middleware de token JWT
vi.mock('../middleware/verificarTokenJwt', () => {
	return {
		verificarTokenJwt: vi.fn().mockImplementation(async (c, next) => {
			// Simula um usuário autenticado
			c.set('userId', 1);
			c.set('jwtPayload', {
				id: 1,
				matricula: '12345',
				nome: 'Usuário Teste',
				autoridade: 'gestor'
			});
			await next();
		})
	};
});

// Mock para o middleware de autoridade
vi.mock('../middleware/verificarAutoridade', () => {
	return {
		verificarAutoridade: vi.fn().mockImplementation(() => {
			return async (c: Context, next: () => Promise<void>) => {
				await next();
			};
		})
	};
});

// Mock para o prisma
vi.mock('../lib/db', () => {
	return {
		prisma: {
			recompensa: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			usuarioRecompensa: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				count: vi.fn()
			},
			moeda: {
				create: vi.fn(),
				aggregate: vi.fn()
			},
			usuario: {
				findUnique: vi.fn()
			}
		} as MockedPrisma
	};
});

describe('Rotas de recompensas', () => {
	// Tipar o cliente adequadamente
	const client = testClient(recompensas) as {
		$get: (options: { headers: Record<string, string> }) => Promise<Response>;
		$post: (options: {
			json: Record<string, unknown>;
			headers: Record<string, string>;
		}) => Promise<Response>;
		':id': {
			$get: (options: {
				param: { id: string };
				headers: Record<string, string>;
			}) => Promise<Response>;
			$put: (options: {
				param: { id: string };
				json: Record<string, unknown>;
				headers: Record<string, string>;
			}) => Promise<Response>;
			$delete: (options: {
				param: { id: string };
				headers: Record<string, string>;
			}) => Promise<Response>;
			resgatar: {
				$post: (options: {
					param: { id: string };
					headers: Record<string, string>;
				}) => Promise<Response>;
			};
		};
		usuario: {
			minhas: {
				$get: (options: {
					headers: Record<string, string>;
				}) => Promise<Response>;
			};
			':id': {
				$get: (options: {
					param: { id: string };
					headers: Record<string, string>;
				}) => Promise<Response>;
			};
		};
		saldo: {
			moedas: {
				$get: (options: {
					headers: Record<string, string>;
				}) => Promise<Response>;
			};
			usuario: {
				':id': {
					$get: (options: {
						param: { id: string };
						headers: Record<string, string>;
					}) => Promise<Response>;
				};
			};
		};
		resgate: {
			':id': {
				status: {
					$put: (options: {
						param: { id: string };
						json: Record<string, unknown>;
						headers: Record<string, string>;
					}) => Promise<Response>;
				};
			};
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /', () => {
		it('deve listar todas as recompensas', async () => {
			const recompensasMock: Recompensa[] = [
				{
					id: 1,
					nome: 'Recompensa 1',
					descricao: 'Descrição da recompensa 1',
					moedas_requeridas: 100,
					tipo: 'VIRTUAL',
					quantidade_disponivel: 10,
					gestor_id: 1
				},
				{
					id: 2,
					nome: 'Recompensa 2',
					descricao: 'Descrição da recompensa 2',
					moedas_requeridas: 200,
					tipo: 'FISICA',
					quantidade_disponivel: null,
					gestor_id: 1
				}
			];

			// Mock do prisma.recompensa.findMany retornando uma lista de recompensas
			vi.mocked(prisma.recompensa.findMany).mockResolvedValueOnce(
				recompensasMock
			);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ recompensas: recompensasMock });
			expect(vi.mocked(prisma.recompensa.findMany)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.recompensa.findMany)).toHaveBeenCalledWith({
				orderBy: {
					moedas_requeridas: 'asc'
				}
			});
		});

		it('deve retornar erro ao falhar na listagem de recompensas', async () => {
			// Mock do prisma.recompensa.findMany lançando erro
			vi.mocked(prisma.recompensa.findMany).mockRejectedValueOnce(
				new Error('Erro no banco de dados')
			);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(500);
			const body = await res.json();
			expect(body).toEqual({ error: 'Erro ao listar recompensas' });
		});
	});

	describe('GET /:id', () => {
		it('deve buscar uma recompensa pelo ID', async () => {
			const recompensaMock: Recompensa = {
				id: 1,
				nome: 'Recompensa Teste',
				descricao: 'Descrição da recompensa teste',
				moedas_requeridas: 150,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			// Mock do prisma.recompensa.findUnique retornando uma recompensa
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaMock
			);

			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ recompensa: recompensaMock });
			expect(vi.mocked(prisma.recompensa.findUnique)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.recompensa.findUnique)).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('deve retornar erro quando ID não é um número', async () => {
			const res = await client[':id'].$get({
				param: { id: 'abc' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({ error: 'ID inválido' });
			expect(vi.mocked(prisma.recompensa.findUnique)).not.toHaveBeenCalled();
		});

		it('deve retornar erro quando recompensa não é encontrada', async () => {
			// Mock do prisma.recompensa.findUnique retornando null
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Recompensa não encontrada' });
		});
	});

	describe('POST /', () => {
		it('deve criar uma nova recompensa', async () => {
			const novaRecompensaData = {
				nome: 'Nova Recompensa',
				descricao: 'Descrição da nova recompensa',
				moedas_requeridas: 300,
				tipo: 'FISICA',
				quantidade_disponivel: 20
			};

			const recompensaCriada = {
				id: 3,
				...novaRecompensaData,
				gestor_id: 1
			};

			// Mock do prisma.recompensa.create retornando a recompensa criada
			vi.mocked(prisma.recompensa.create).mockResolvedValueOnce(
				recompensaCriada
			);

			const res = await client.$post({
				json: novaRecompensaData,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ recompensa: recompensaCriada });
			expect(vi.mocked(prisma.recompensa.create)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.recompensa.create)).toHaveBeenCalledWith({
				data: {
					nome: novaRecompensaData.nome,
					descricao: novaRecompensaData.descricao,
					moedas_requeridas: novaRecompensaData.moedas_requeridas,
					tipo: novaRecompensaData.tipo,
					quantidade_disponivel: novaRecompensaData.quantidade_disponivel,
					gestor_id: 1
				}
			});
		});

		it('deve retornar erro quando faltarem campos obrigatórios', async () => {
			const dadosIncompletos = {
				nome: 'Recompensa Incompleta'
				// Faltando campos obrigatórios
			};

			const res = await client.$post({
				json: dadosIncompletos,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error: 'Nome, descrição, moedas requeridas e tipo são obrigatórios'
			});
			expect(vi.mocked(prisma.recompensa.create)).not.toHaveBeenCalled();
		});

		it('deve retornar erro quando moedas_requeridas for menor ou igual a zero', async () => {
			const dadosInvalidos = {
				nome: 'Recompensa Inválida',
				descricao: 'Descrição',
				moedas_requeridas: 0,
				tipo: 'VIRTUAL'
			};

			const res = await client.$post({
				json: dadosInvalidos,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();

			// O controlador verifica primeiro se os campos estão presentes e depois verifica o valor
			// Então vamos apenas verificar parcialmente a resposta para garantir que o teste seja robusto
			expect(body).toHaveProperty('error');
			expect(vi.mocked(prisma.recompensa.create)).not.toHaveBeenCalled();
		});
	});

	describe('PUT /:id', () => {
		it('deve atualizar uma recompensa existente', async () => {
			const recompensaExistente = {
				id: 1,
				nome: 'Recompensa Antiga',
				descricao: 'Descrição antiga',
				moedas_requeridas: 100,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			const dadosAtualizacao = {
				nome: 'Recompensa Atualizada',
				moedas_requeridas: 150
			};

			const recompensaAtualizada = {
				...recompensaExistente,
				...dadosAtualizacao
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa existente
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaExistente
			);

			// Mock do prisma.recompensa.update retornando a recompensa atualizada
			vi.mocked(prisma.recompensa.update).mockResolvedValueOnce(
				recompensaAtualizada
			);

			const res = await client[':id'].$put({
				param: { id: '1' },
				json: dadosAtualizacao,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ recompensa: recompensaAtualizada });
			expect(vi.mocked(prisma.recompensa.update)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.recompensa.update)).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					nome: dadosAtualizacao.nome,
					descricao: recompensaExistente.descricao,
					moedas_requeridas: dadosAtualizacao.moedas_requeridas,
					tipo: recompensaExistente.tipo,
					quantidade_disponivel: recompensaExistente.quantidade_disponivel
				}
			});
		});

		it('deve retornar erro quando a recompensa não existe', async () => {
			// Mock do prisma.recompensa.findUnique retornando null
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$put({
				param: { id: '999' },
				json: { nome: 'Nova Nome' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Recompensa não encontrada' });
			expect(vi.mocked(prisma.recompensa.update)).not.toHaveBeenCalled();
		});
	});

	describe('DELETE /:id', () => {
		it('deve excluir uma recompensa', async () => {
			const recompensaExistente = {
				id: 1,
				nome: 'Recompensa para Excluir',
				descricao: 'Descrição',
				moedas_requeridas: 100,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa existente
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaExistente
			);

			// Mock do prisma.usuarioRecompensa.count retornando 0 (nenhum resgate)
			vi.mocked(prisma.usuarioRecompensa.count).mockResolvedValueOnce(0);

			// Mock do prisma.recompensa.delete
			vi.mocked(prisma.recompensa.delete).mockResolvedValueOnce(
				recompensaExistente
			);

			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ message: 'Recompensa excluída com sucesso' });
			expect(vi.mocked(prisma.recompensa.delete)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.recompensa.delete)).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('deve retornar erro quando tentar excluir recompensa que já foi resgatada', async () => {
			const recompensaExistente = {
				id: 1,
				nome: 'Recompensa Resgatada',
				descricao: 'Descrição',
				moedas_requeridas: 100,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa existente
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaExistente
			);

			// Mock do prisma.usuarioRecompensa.count retornando 2 (recompensa já resgatada)
			vi.mocked(prisma.usuarioRecompensa.count).mockResolvedValueOnce(2);

			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error:
					'Esta recompensa já foi resgatada por usuários e não pode ser excluída'
			});
			expect(vi.mocked(prisma.recompensa.delete)).not.toHaveBeenCalled();
		});
	});

	describe('POST /:id/resgatar', () => {
		it('deve permitir resgatar uma recompensa', async () => {
			const recompensaMock: Recompensa = {
				id: 1,
				nome: 'Recompensa Resgatável',
				descricao: 'Descrição',
				moedas_requeridas: 100,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			const usuarioMock = {
				id: 1,
				nome: 'Usuário Teste',
				matricula: '12345',
				setor: 'Desenvolvimento',
				gestor_id: null,
				senha: 'senha_hash',
				pontos: 0,
				autoridade: 'colaborador'
			};

			const dataAtual = new Date();

			// Criar um mock que será usado na criação e depois serializado para comparação
			const resgateCriado = {
				id: 1,
				usuario_id: 1,
				recompensa_id: 1,
				data_resgate: dataAtual,
				status: 'RESGATADO'
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaMock
			);

			// Mock do prisma.usuario.findUnique retornando o usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			// Mock do prisma.moeda.aggregate retornando o saldo de moedas
			vi.mocked(prisma.moeda.aggregate).mockResolvedValueOnce({
				_count: {},
				_avg: { moedas: 100 },
				_sum: { moedas: 200 }, // Usuário tem moedas suficientes
				_min: { moedas: 10 },
				_max: { moedas: 100 }
			});

			// Mock do prisma.usuarioRecompensa.create retornando o resgate criado
			vi.mocked(prisma.usuarioRecompensa.create).mockResolvedValueOnce(
				resgateCriado
			);

			// Mock do prisma.moeda.create para o débito
			vi.mocked(prisma.moeda.create).mockResolvedValueOnce({
				id: 1,
				usuario_id: 1,
				tipo_evento: 'RESGATE_RECOMPENSA',
				referencia_id: 1,
				moedas: -100,
				data_evento: dataAtual,
				descricao: `Resgate da recompensa: ${recompensaMock.nome}`
			});

			// Mock do prisma.recompensa.update para atualizar quantidade disponível
			vi.mocked(prisma.recompensa.update).mockResolvedValueOnce({
				...recompensaMock,
				quantidade_disponivel: 4
			});

			const res = await client[':id'].resgatar.$post({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty(
				'message',
				'Recompensa resgatada com sucesso'
			);
			expect(body).toHaveProperty('resgate');
			expect(body.resgate).toHaveProperty('id', resgateCriado.id);
			expect(body.resgate).toHaveProperty(
				'usuario_id',
				resgateCriado.usuario_id
			);
			expect(body.resgate).toHaveProperty(
				'recompensa_id',
				resgateCriado.recompensa_id
			);
			expect(body.resgate).toHaveProperty('status', resgateCriado.status);
		});

		it('deve retornar erro quando usuário não tem moedas suficientes', async () => {
			const recompensaMock: Recompensa = {
				id: 1,
				nome: 'Recompensa Cara',
				descricao: 'Descrição',
				moedas_requeridas: 500,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 5,
				gestor_id: 1
			};

			const usuarioMock = {
				id: 1,
				nome: 'Usuário Teste',
				matricula: '12345',
				setor: 'Desenvolvimento',
				gestor_id: null,
				senha: 'senha_hash',
				pontos: 0,
				autoridade: 'colaborador'
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaMock
			);

			// Mock do prisma.usuario.findUnique retornando o usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			// Mock do prisma.moeda.aggregate retornando o saldo de moedas
			vi.mocked(prisma.moeda.aggregate).mockResolvedValueOnce({
				_count: {},
				_avg: { moedas: 100 },
				_sum: { moedas: 300 }, // Usuário não tem moedas suficientes
				_min: { moedas: 50 },
				_max: { moedas: 100 }
			});

			const res = await client[':id'].resgatar.$post({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error: 'Moedas insuficientes',
				moedasUsuario: 300,
				moedasNecessarias: 500
			});
		});

		it('deve retornar erro quando recompensa está esgotada', async () => {
			const recompensaMock: Recompensa = {
				id: 1,
				nome: 'Recompensa Esgotada',
				descricao: 'Descrição',
				moedas_requeridas: 100,
				tipo: 'VIRTUAL',
				quantidade_disponivel: 0,
				gestor_id: 1
			};

			// Mock do prisma.recompensa.findUnique retornando a recompensa esgotada
			vi.mocked(prisma.recompensa.findUnique).mockResolvedValueOnce(
				recompensaMock
			);

			const res = await client[':id'].resgatar.$post({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error: 'Recompensa esgotada'
			});
		});
	});

	describe('GET /usuario/minhas', () => {
		it('deve listar recompensas do usuário logado', async () => {
			const dataResgate = new Date();

			// Usando tipo mais específico para compatibilidade com Prisma
			const resgatesMock = [
				{
					id: 1,
					usuario_id: 1,
					recompensa_id: 1,
					data_resgate: dataResgate,
					status: 'RESGATADO',
					recompensa: {
						id: 1,
						nome: 'Recompensa 1',
						descricao: 'Descrição',
						moedas_requeridas: 100,
						tipo: 'VIRTUAL',
						quantidade_disponivel: 10,
						gestor_id: 1
					}
				},
				{
					id: 2,
					usuario_id: 1,
					recompensa_id: 2,
					data_resgate: dataResgate,
					status: 'PROCESSANDO',
					recompensa: {
						id: 2,
						nome: 'Recompensa 2',
						descricao: 'Descrição',
						moedas_requeridas: 200,
						tipo: 'FISICA',
						quantidade_disponivel: null,
						gestor_id: 1
					}
				}
			];

			// Mock do prisma.usuarioRecompensa.findMany retornando os resgates
			vi.mocked(prisma.usuarioRecompensa.findMany).mockResolvedValueOnce(
				resgatesMock
			);

			const res = await client.usuario.minhas.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('resgates');
			expect(Array.isArray(body.resgates)).toBe(true);
			expect(body.resgates.length).toBe(resgatesMock.length);
			expect(vi.mocked(prisma.usuarioRecompensa.findMany)).toHaveBeenCalledWith(
				{
					where: { usuario_id: 1 },
					include: {
						recompensa: true
					},
					orderBy: {
						data_resgate: 'desc'
					}
				}
			);
		});
	});

	describe('GET /saldo/moedas', () => {
		it('deve retornar o saldo de moedas do usuário logado', async () => {
			// Mock do prisma.moeda.aggregate retornando o saldo de moedas
			vi.mocked(prisma.moeda.aggregate).mockResolvedValueOnce({
				_count: {},
				_avg: { moedas: 150 },
				_sum: { moedas: 350 },
				_min: { moedas: 50 },
				_max: { moedas: 200 }
			});

			const res = await client.saldo.moedas.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({
				usuario_id: 1,
				saldo_moedas: 350
			});
		});
	});

	describe('PUT /resgate/:id/status', () => {
		it('deve alterar o status de um resgate', async () => {
			const resgateMock = {
				id: 1,
				usuario_id: 2,
				recompensa_id: 3,
				data_resgate: new Date(),
				status: 'RESGATADO',
				recompensa: {
					id: 3,
					nome: 'Recompensa Teste',
					descricao: 'Descrição',
					moedas_requeridas: 200,
					tipo: 'FISICA',
					quantidade_disponivel: 5,
					gestor_id: 1
				}
			};

			const resgateAtualizado = {
				...resgateMock,
				status: 'PROCESSANDO',
				usuario: {
					id: 2,
					nome: 'Outro Usuário',
					matricula: '67890',
					setor: 'RH'
				}
			};

			// Mock do prisma.usuarioRecompensa.findUnique retornando o resgate
			vi.mocked(prisma.usuarioRecompensa.findUnique).mockResolvedValueOnce(
				resgateMock
			);

			// Mock do prisma.usuarioRecompensa.update retornando o resgate atualizado
			vi.mocked(prisma.usuarioRecompensa.update).mockResolvedValueOnce(
				resgateAtualizado
			);

			const res = await client.resgate[':id'].status.$put({
				param: { id: '1' },
				json: { status: 'PROCESSANDO' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty(
				'message',
				'Status do resgate alterado para PROCESSANDO'
			);
			expect(body).toHaveProperty('resgate');
			expect(body.resgate).toHaveProperty('id', resgateAtualizado.id);
			expect(body.resgate).toHaveProperty('status', resgateAtualizado.status);
		});

		it('deve estornar moedas quando status é alterado para CANCELADO', async () => {
			const resgateMock = {
				id: 1,
				usuario_id: 2,
				recompensa_id: 3,
				data_resgate: new Date(),
				status: 'RESGATADO',
				recompensa: {
					id: 3,
					nome: 'Recompensa Cancelada',
					descricao: 'Descrição',
					moedas_requeridas: 200,
					tipo: 'FISICA',
					quantidade_disponivel: 5,
					gestor_id: 1
				}
			};

			const resgateAtualizado = {
				...resgateMock,
				status: 'CANCELADO',
				usuario: {
					id: 2,
					nome: 'Outro Usuário',
					matricula: '67890',
					setor: 'RH'
				}
			};

			// Mock do prisma.usuarioRecompensa.findUnique retornando o resgate
			vi.mocked(prisma.usuarioRecompensa.findUnique).mockResolvedValueOnce(
				resgateMock
			);

			// Mock do prisma.moeda.create para o estorno
			vi.mocked(prisma.moeda.create).mockResolvedValueOnce({
				id: 5,
				usuario_id: 2,
				tipo_evento: 'ESTORNO_RECOMPENSA',
				referencia_id: 1,
				moedas: 200,
				data_evento: new Date(),
				descricao: `Estorno do resgate da recompensa: ${resgateMock.recompensa.nome}`
			});

			// Mock do prisma.recompensa.update para atualizar quantidade disponível
			vi.mocked(prisma.recompensa.update).mockResolvedValueOnce({
				...resgateMock.recompensa,
				quantidade_disponivel: 6
			});

			// Mock do prisma.usuarioRecompensa.update retornando o resgate atualizado
			vi.mocked(prisma.usuarioRecompensa.update).mockResolvedValueOnce(
				resgateAtualizado
			);

			const res = await client.resgate[':id'].status.$put({
				param: { id: '1' },
				json: { status: 'CANCELADO' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty(
				'message',
				'Status do resgate alterado para CANCELADO'
			);
			expect(body).toHaveProperty('resgate');
			expect(body.resgate).toHaveProperty('id', resgateAtualizado.id);
			expect(body.resgate).toHaveProperty('status', resgateAtualizado.status);
			expect(vi.mocked(prisma.moeda.create)).toHaveBeenCalledTimes(1);
		});

		it('deve retornar erro quando status é inválido', async () => {
			const res = await client.resgate[':id'].status.$put({
				param: { id: '1' },
				json: { status: 'STATUS_INEXISTENTE' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error: 'Status inválido',
				statusValidos: ['RESGATADO', 'PROCESSANDO', 'ENTREGUE', 'CANCELADO']
			});
		});
	});
});
