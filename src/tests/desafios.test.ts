import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import desafios from '../routes/desafios';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type Desafio = {
	id: number;
	nome: string;
	descricao: string;
	gestor_id: number;
	gestor?: {
		id: number;
		nome: string;
	};
	desafioEtapas?: DesafioEtapa[];
};

type DesafioEtapa = {
	id: number;
	desafio_id: number;
	avaliacao_id: number;
	ordem: number;
	avaliacao?: {
		id?: number;
		titulo?: string;
		descricao?: string;
		questoes?: {
			id: number;
			texto: string;
		}[];
	};
};

type Avaliacao = {
	id: number;
	titulo: string;
	descricao: string;
	questoes: {
		id: number;
		texto: string;
	}[];
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	desafio: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	desafioEtapa: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
		deleteMany: ReturnType<typeof vi.fn>;
	};
	avaliacao: {
		findUnique: ReturnType<typeof vi.fn>;
	};
	$transaction: ReturnType<typeof vi.fn>;
};

// Mock para o middleware de token JWT
vi.mock('../middleware/verificarTokenJwt', () => {
	return {
		verificarTokenJwt: vi.fn().mockImplementation(async (c, next) => {
			// Simula um usuário autenticado
			c.set('userId', 1);
			c.set('jwtPayload', {
				id: 1,
				matricula: '123',
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
				// Simula verificação de autoridade passando para o próximo middleware
				await next();
			};
		})
	};
});

// Mock para o prisma
vi.mock('../lib/db', () => {
	return {
		prisma: {
			desafio: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			desafioEtapa: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				deleteMany: vi.fn()
			},
			avaliacao: {
				findUnique: vi.fn()
			},
			$transaction: vi.fn().mockImplementation(async (callback) => {
				return await callback({
					desafioEtapa: {
						deleteMany: vi.fn()
					},
					desafio: {
						delete: vi.fn()
					}
				});
			})
		} as unknown as MockedPrisma
	};
});

import type { Context } from 'hono';
// Importando o prisma mockado
import { prisma } from '../lib/db';

// Teste unitário das rotas de desafios
describe('Rotas de desafios', () => {
	// Tipar o cliente adequadamente
	const client = testClient(desafios) as {
		$get: (options?: { headers?: Record<string, string> }) => Promise<Response>;
		$post: (options: {
			json?: Record<string, unknown>;
			headers?: Record<string, string>;
		}) => Promise<Response>;
		':id': {
			$get: (options: {
				param: { id: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
			$put: (options: {
				param: { id: string };
				json: Record<string, unknown>;
				headers?: Record<string, string>;
			}) => Promise<Response>;
			$delete: (options: {
				param: { id: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
			etapas: {
				$get: (options: {
					param: { id: string };
					headers?: Record<string, string>;
				}) => Promise<Response>;
				$post: (options: {
					param: { id: string };
					json: Record<string, unknown>;
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
		};
		etapas: {
			':id': {
				$put: (options: {
					param: { id: string };
					json: Record<string, unknown>;
					headers?: Record<string, string>;
				}) => Promise<Response>;
				$delete: (options: {
					param: { id: string };
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /', () => {
		it('deve listar todos os desafios', async () => {
			// Mock dos dados de retorno
			const desafiosMock: Desafio[] = [
				{
					id: 1,
					nome: 'Desafio 1',
					descricao: 'Descrição do Desafio 1',
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor Teste'
					},
					desafioEtapas: [
						{
							id: 1,
							desafio_id: 1,
							avaliacao_id: 1,
							ordem: 1,
							avaliacao: {
								id: 1,
								titulo: 'Avaliação 1'
							}
						},
						{
							id: 2,
							desafio_id: 1,
							avaliacao_id: 2,
							ordem: 2,
							avaliacao: {
								id: 2,
								titulo: 'Avaliação 2'
							}
						}
					]
				},
				{
					id: 2,
					nome: 'Desafio 2',
					descricao: 'Descrição do Desafio 2',
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor Teste'
					},
					desafioEtapas: []
				}
			];

			// Configurar o mock do findMany para retornar a lista de desafios
			(prisma.desafio.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafiosMock
			);

			// Fazer a requisição GET
			const res = await client.$get({
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém os desafios
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ desafios: desafiosMock });
			expect(prisma.desafio.findMany).toHaveBeenCalledTimes(1);
		});
	});

	describe('GET /:id', () => {
		it('deve buscar um desafio pelo ID', async () => {
			// Mock do desafio retornado
			const desafioMock: Desafio = {
				id: 1,
				nome: 'Desafio 1',
				descricao: 'Descrição do Desafio 1',
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor Teste'
				},
				desafioEtapas: [
					{
						id: 1,
						desafio_id: 1,
						avaliacao_id: 1,
						ordem: 1,
						avaliacao: {
							id: 1,
							titulo: 'Avaliação 1',
							descricao: 'Descrição da Avaliação 1',
							questoes: [
								{
									id: 1,
									texto: 'Pergunta 1'
								}
							]
						}
					}
				]
			};

			// Configurar o mock do findUnique para retornar o desafio
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioMock
			);

			// Fazer a requisição GET com ID
			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém o desafio
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ desafio: desafioMock });
			expect(prisma.desafio.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: expect.any(Object)
			});
		});

		it('deve retornar 404 para um ID de desafio inexistente', async () => {
			// Configurar o mock do findUnique para retornar null (desafio não encontrado)
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				null
			);

			// Fazer a requisição GET com ID inexistente
			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Desafio não encontrado' });
		});

		it('deve retornar 400 para um ID inválido', async () => {
			// Fazer a requisição GET com ID inválido
			const res = await client[':id'].$get({
				param: { id: 'abc' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 400
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({ error: 'ID inválido' });
		});
	});

	describe('POST /', () => {
		it('deve criar um novo desafio', async () => {
			// Mock do desafio criado
			const novoDesafio: Desafio = {
				id: 3,
				nome: 'Novo Desafio',
				descricao: 'Descrição do Novo Desafio',
				gestor_id: 1
			};

			// Configurar o mock do create para retornar o novo desafio
			(prisma.desafio.create as ReturnType<typeof vi.fn>).mockResolvedValue(
				novoDesafio
			);

			// Fazer a requisição POST
			const res = await client.$post({
				json: {
					nome: 'Novo Desafio',
					descricao: 'Descrição do Novo Desafio'
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 201 e o corpo contém o novo desafio
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ desafio: novoDesafio });
			expect(prisma.desafio.create).toHaveBeenCalledWith({
				data: {
					nome: 'Novo Desafio',
					descricao: 'Descrição do Novo Desafio',
					gestor_id: 1
				}
			});
		});

		it('deve retornar 400 se os dados do desafio estiverem incompletos', async () => {
			// Fazer a requisição POST com dados incompletos
			const res = await client.$post({
				json: {
					// Nome está faltando
					descricao: 'Descrição do Novo Desafio'
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 400
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({ error: 'Nome e descrição são obrigatórios' });
		});
	});

	describe('PUT /:id', () => {
		it('deve atualizar um desafio existente', async () => {
			// Mock do desafio existente
			const desafioExistente = {
				id: 1,
				nome: 'Desafio 1',
				descricao: 'Descrição do Desafio 1',
				gestor_id: 1
			};

			// Mock do desafio atualizado
			const desafioAtualizado = {
				id: 1,
				nome: 'Desafio 1 Atualizado',
				descricao: 'Nova descrição do Desafio 1',
				gestor_id: 1
			};

			// Configurar mocks
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioExistente
			);
			(prisma.desafio.update as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioAtualizado
			);

			// Fazer a requisição PUT
			const res = await client[':id'].$put({
				param: { id: '1' },
				json: {
					nome: 'Desafio 1 Atualizado',
					descricao: 'Nova descrição do Desafio 1'
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém o desafio atualizado
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ desafio: desafioAtualizado });
			expect(prisma.desafio.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: expect.any(Object)
			});
		});

		it('deve retornar 404 ao tentar atualizar um desafio inexistente', async () => {
			// Configurar mock para retornar null (desafio não encontrado)
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				null
			);

			// Fazer a requisição PUT com ID inexistente
			const res = await client[':id'].$put({
				param: { id: '999' },
				json: {
					nome: 'Desafio Inexistente',
					descricao: 'Descrição atualizada'
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Desafio não encontrado' });
		});
	});

	describe('DELETE /:id', () => {
		it('deve excluir um desafio existente', async () => {
			// Mock do desafio existente com etapas
			const desafioExistente = {
				id: 1,
				nome: 'Desafio para excluir',
				descricao: 'Descrição do desafio',
				gestor_id: 1,
				desafioEtapas: [{ id: 1, desafio_id: 1, avaliacao_id: 1, ordem: 1 }]
			};

			// Configurar mock para retornar o desafio existente
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioExistente
			);

			// Fazer a requisição DELETE
			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ message: 'Desafio excluído com sucesso' });
			expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		});

		it('deve retornar 404 ao tentar excluir um desafio inexistente', async () => {
			// Configurar mock para retornar null (desafio não encontrado)
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				null
			);

			// Fazer a requisição DELETE com ID inexistente
			const res = await client[':id'].$delete({
				param: { id: '999' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Desafio não encontrado' });
		});
	});

	describe('GET /:id/etapas', () => {
		it('deve listar todas as etapas de um desafio', async () => {
			// Mock do desafio existente
			const desafioExistente = {
				id: 1,
				nome: 'Desafio 1',
				descricao: 'Descrição do Desafio 1',
				gestor_id: 1
			};

			// Mock das etapas de desafio
			const etapasMock = [
				{
					id: 1,
					desafio_id: 1,
					avaliacao_id: 1,
					ordem: 1,
					avaliacao: {
						id: 1,
						titulo: 'Avaliação 1',
						descricao: 'Descrição da Avaliação 1'
					}
				},
				{
					id: 2,
					desafio_id: 1,
					avaliacao_id: 2,
					ordem: 2,
					avaliacao: {
						id: 2,
						titulo: 'Avaliação 2',
						descricao: 'Descrição da Avaliação 2'
					}
				}
			];

			// Configurar mocks
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioExistente
			);
			(
				prisma.desafioEtapa.findMany as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapasMock);

			// Fazer a requisição GET
			const res = await client[':id'].etapas.$get({
				param: { id: '1' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém as etapas
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ etapas: etapasMock });
			expect(prisma.desafio.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(prisma.desafioEtapa.findMany).toHaveBeenCalledWith({
				where: { desafio_id: 1 },
				include: expect.any(Object),
				orderBy: { ordem: 'asc' }
			});
		});

		it('deve retornar 404 para um ID de desafio inexistente', async () => {
			// Configurar mock para retornar null (desafio não encontrado)
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				null
			);

			// Fazer a requisição GET com ID inexistente
			const res = await client[':id'].etapas.$get({
				param: { id: '999' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Desafio não encontrado' });
		});
	});

	describe('POST /:id/etapas', () => {
		it('deve criar uma nova etapa para um desafio', async () => {
			// Mock do desafio existente
			const desafioExistente = {
				id: 1,
				nome: 'Desafio 1',
				descricao: 'Descrição do Desafio 1',
				gestor_id: 1
			};

			// Mock da avaliação existente
			const avaliacaoExistente = {
				id: 1,
				titulo: 'Avaliação 1',
				descricao: 'Descrição da Avaliação 1'
			};

			// Mock da nova etapa criada
			const novaEtapa = {
				id: 1,
				desafio_id: 1,
				avaliacao_id: 1,
				ordem: 1,
				avaliacao: {
					titulo: 'Avaliação 1',
					descricao: 'Descrição da Avaliação 1'
				}
			};

			// Configurar mocks
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioExistente
			);
			(
				prisma.avaliacao.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(avaliacaoExistente);
			(
				prisma.desafioEtapa.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);
			(
				prisma.desafioEtapa.create as ReturnType<typeof vi.fn>
			).mockResolvedValue(novaEtapa);

			// Fazer a requisição POST
			const res = await client[':id'].etapas.$post({
				param: { id: '1' },
				json: {
					avaliacao_id: 1,
					ordem: 1
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 201 e o corpo contém a nova etapa
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ etapa: novaEtapa });
			expect(prisma.desafioEtapa.create).toHaveBeenCalledWith({
				data: {
					desafio_id: 1,
					avaliacao_id: 1,
					ordem: 1
				},
				include: expect.any(Object)
			});
		});

		it('deve retornar 400 se já existir uma etapa com a mesma ordem no desafio', async () => {
			// Mock do desafio existente
			const desafioExistente = {
				id: 1,
				nome: 'Desafio 1',
				descricao: 'Descrição do Desafio 1',
				gestor_id: 1
			};

			// Mock da avaliação existente
			const avaliacaoExistente = {
				id: 1,
				titulo: 'Avaliação 1',
				descricao: 'Descrição da Avaliação 1'
			};

			// Mock da etapa existente com a mesma ordem
			const etapaExistente = {
				id: 1,
				desafio_id: 1,
				avaliacao_id: 1,
				ordem: 1
			};

			// Configurar mocks
			(prisma.desafio.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
				desafioExistente
			);
			(
				prisma.avaliacao.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(avaliacaoExistente);
			(
				prisma.desafioEtapa.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapaExistente);

			// Fazer a requisição POST
			const res = await client[':id'].etapas.$post({
				param: { id: '1' },
				json: {
					avaliacao_id: 2,
					ordem: 1 // Mesmo número de ordem que já existe
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 400
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toEqual({
				error: 'Já existe uma etapa com esta ordem neste desafio'
			});
		});
	});

	describe('PUT /etapas/:id', () => {
		it('deve atualizar uma etapa de desafio existente', async () => {
			// Mock da etapa existente
			const etapaExistente = {
				id: 1,
				desafio_id: 1,
				avaliacao_id: 1,
				ordem: 1
			};

			// Mock da etapa atualizada
			const etapaAtualizada = {
				id: 1,
				desafio_id: 1,
				avaliacao_id: 2,
				ordem: 2,
				avaliacao: {
					titulo: 'Avaliação 2',
					descricao: 'Descrição da Avaliação 2'
				}
			};

			// Configurar mocks
			(
				prisma.desafioEtapa.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapaExistente);
			(
				prisma.desafioEtapa.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);
			(
				prisma.avaliacao.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: 2,
				titulo: 'Avaliação 2',
				descricao: 'Descrição da Avaliação 2'
			});
			(
				prisma.desafioEtapa.update as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapaAtualizada);

			// Fazer a requisição PUT
			const res = await client.etapas[':id'].$put({
				param: { id: '1' },
				json: {
					avaliacao_id: 2,
					ordem: 2
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém a etapa atualizada
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ etapa: etapaAtualizada });
			expect(prisma.desafioEtapa.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: expect.any(Object),
				include: expect.any(Object)
			});
		});

		it('deve retornar 404 ao tentar atualizar uma etapa inexistente', async () => {
			// Configurar mock para retornar null (etapa não encontrada)
			(
				prisma.desafioEtapa.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			// Fazer a requisição PUT com ID inexistente
			const res = await client.etapas[':id'].$put({
				param: { id: '999' },
				json: {
					avaliacao_id: 2,
					ordem: 2
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Etapa não encontrada' });
		});
	});

	describe('DELETE /etapas/:id', () => {
		it('deve excluir uma etapa de desafio existente', async () => {
			// Mock da etapa existente
			const etapaExistente = {
				id: 1,
				desafio_id: 1,
				avaliacao_id: 1,
				ordem: 1
			};

			// Configurar mock para retornar a etapa existente
			(
				prisma.desafioEtapa.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapaExistente);
			(
				prisma.desafioEtapa.delete as ReturnType<typeof vi.fn>
			).mockResolvedValue(etapaExistente);

			// Fazer a requisição DELETE
			const res = await client.etapas[':id'].$delete({
				param: { id: '1' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ message: 'Etapa excluída com sucesso' });
			expect(prisma.desafioEtapa.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('deve retornar 404 ao tentar excluir uma etapa inexistente', async () => {
			// Configurar mock para retornar null (etapa não encontrada)
			(
				prisma.desafioEtapa.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			// Fazer a requisição DELETE com ID inexistente
			const res = await client.etapas[':id'].$delete({
				param: { id: '999' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 404
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toEqual({ error: 'Etapa não encontrada' });
		});
	});
});
