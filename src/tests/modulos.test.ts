import type { Context } from 'hono';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import modulos from '../routes/modulos';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type Modulo = {
	id: number;
	nome: string;
	descricao: string;
	data_criacao: string | Date;
	data_atualizacao: string | Date;
	gestor_id: number;
	gestor?: {
		id: number;
		nome: string;
	};
};

type CreateModulo = {
	nome: string;
	descricao: string;
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	modulo: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
};

// Mock para o middleware de token JWT
vi.mock('../middleware/verificarTokenJwt', () => {
	return {
		verificarTokenJwt: vi.fn().mockImplementation(async (c, next) => {
			// Simula um usuário autenticado
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
			modulo: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			}
		} as MockedPrisma
	};
});

describe('Rotas de módulos', () => {
	// Tipar o cliente adequadamente
	const client = testClient(modulos) as {
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
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /', () => {
		it('deve listar todos os módulos', async () => {
			const dataCriacao = new Date().toISOString();
			const dataAtualizacao = new Date().toISOString();

			const modulosMock: Modulo[] = [
				{
					id: 1,
					nome: 'Módulo 1',
					descricao: 'Descrição do módulo 1',
					data_criacao: dataCriacao,
					data_atualizacao: dataAtualizacao,
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor 1'
					}
				},
				{
					id: 2,
					nome: 'Módulo 2',
					descricao: 'Descrição do módulo 2',
					data_criacao: dataCriacao,
					data_atualizacao: dataAtualizacao,
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor 1'
					}
				}
			];

			// Mock do prisma.modulo.findMany retornando uma lista de módulos
			vi.mocked(prisma.modulo.findMany).mockResolvedValueOnce(modulosMock);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveLength(2);
			expect(body).toEqual(modulosMock);
			expect(vi.mocked(prisma.modulo.findMany)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(prisma.modulo.findMany)).toHaveBeenCalledWith({
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});
		});

		it('deve retornar lista vazia quando não há módulos', async () => {
			// Mock do prisma.modulo.findMany retornando array vazio
			vi.mocked(prisma.modulo.findMany).mockResolvedValueOnce([]);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual([]);
		});
	});

	describe('GET /:id', () => {
		it('deve buscar um módulo pelo ID', async () => {
			const dataCriacao = new Date().toISOString();
			const dataAtualizacao = new Date().toISOString();

			const moduloMock: Modulo = {
				id: 1,
				nome: 'Módulo Teste',
				descricao: 'Descrição do módulo teste',
				data_criacao: dataCriacao,
				data_atualizacao: dataAtualizacao,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor 1'
				}
			};

			// Mock do prisma.modulo.findUnique retornando um módulo
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce(moduloMock);

			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(moduloMock);
			expect(vi.mocked(prisma.modulo.findUnique)).toHaveBeenCalledWith({
				where: { id: 1 },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});
		});

		it('deve retornar erro quando o ID não é válido', async () => {
			const res = await client[':id'].$get({
				param: { id: 'abc' }, // ID não numérico
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'ID inválido');
		});

		it('deve retornar erro quando o módulo não existe', async () => {
			// Mock do prisma.modulo.findUnique retornando null
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Módulo não encontrado');
		});
	});

	describe('POST /', () => {
		it('deve criar um novo módulo com sucesso', async () => {
			const dataCriacao = new Date().toISOString();
			const dataAtualizacao = new Date().toISOString();

			const novoModuloData: CreateModulo = {
				nome: 'Novo Módulo',
				descricao: 'Descrição do novo módulo'
			};

			const novoModuloRetorno: Modulo = {
				id: 3,
				nome: 'Novo Módulo',
				descricao: 'Descrição do novo módulo',
				data_criacao: dataCriacao,
				data_atualizacao: dataAtualizacao,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor 1'
				}
			};

			// Mock do prisma.modulo.create retornando o novo módulo
			vi.mocked(prisma.modulo.create).mockResolvedValueOnce(novoModuloRetorno);

			const res = await client.$post({
				json: novoModuloData,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual(novoModuloRetorno);
			expect(vi.mocked(prisma.modulo.create)).toHaveBeenCalledWith({
				data: {
					nome: novoModuloData.nome,
					descricao: novoModuloData.descricao,
					gestor_id: 1
				},
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});
		});

		it('deve retornar erro quando dados estão incompletos', async () => {
			const dadosIncompletos = {
				nome: 'Novo Módulo'
				// Descrição faltando
			};

			const res = await client.$post({
				json: dadosIncompletos,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Nome e descrição são obrigatórios');
		});
	});

	describe('PUT /:id', () => {
		it('deve atualizar um módulo com sucesso', async () => {
			const dataCriacao = new Date().toISOString();
			const dataAtualizacao = new Date().toISOString();

			const moduloExistente: Modulo = {
				id: 1,
				nome: 'Módulo Antigo',
				descricao: 'Descrição antiga',
				data_criacao: dataCriacao,
				data_atualizacao: dataAtualizacao,
				gestor_id: 1
			};

			const dadosAtualizacao = {
				nome: 'Módulo Atualizado',
				descricao: 'Nova descrição'
			};

			const moduloAtualizado: Modulo = {
				id: 1,
				nome: 'Módulo Atualizado',
				descricao: 'Nova descrição',
				data_criacao: dataCriacao,
				data_atualizacao: dataAtualizacao,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor 1'
				}
			};

			// Mock do findUnique para verificar se o módulo existe
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce(
				moduloExistente
			);

			// Mock do update retornando o módulo atualizado
			vi.mocked(prisma.modulo.update).mockResolvedValueOnce(moduloAtualizado);

			const res = await client[':id'].$put({
				param: { id: '1' },
				json: dadosAtualizacao,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(moduloAtualizado);
			expect(vi.mocked(prisma.modulo.update)).toHaveBeenCalledWith({
				where: { id: 1 },
				data: dadosAtualizacao,
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});
		});

		it('deve retornar erro quando o ID não é válido', async () => {
			const res = await client[':id'].$put({
				param: { id: 'abc' }, // ID não numérico
				json: { nome: 'Novo Nome' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'ID inválido');
		});

		it('deve retornar erro quando o módulo não existe', async () => {
			// Mock do prisma.modulo.findUnique retornando null
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$put({
				param: { id: '999' },
				json: { nome: 'Novo Nome' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Módulo não encontrado');
		});
	});

	describe('DELETE /:id', () => {
		it('deve excluir um módulo com sucesso', async () => {
			// Mock do findUnique para verificar se o módulo existe
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce({
				id: 1,
				nome: 'Módulo para Excluir',
				descricao: 'Descrição do módulo',
				data_criacao: new Date().toISOString(),
				data_atualizacao: new Date().toISOString(),
				gestor_id: 1
			} as Modulo);

			// Mock do delete
			vi.mocked(prisma.modulo.delete).mockResolvedValueOnce({
				id: 1,
				nome: 'Módulo Excluído',
				descricao: 'Descrição do módulo excluído',
				data_criacao: new Date().toISOString(),
				data_atualizacao: new Date().toISOString(),
				gestor_id: 1
			} as Modulo);

			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('message', 'Módulo excluído com sucesso');
			expect(vi.mocked(prisma.modulo.delete)).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('deve retornar erro quando o ID não é válido', async () => {
			const res = await client[':id'].$delete({
				param: { id: 'abc' }, // ID não numérico
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'ID inválido');
		});

		it('deve retornar erro quando o módulo não existe', async () => {
			// Mock do prisma.modulo.findUnique retornando null
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$delete({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Módulo não encontrado');
		});

		it('deve retornar erro quando há conteúdos associados ao módulo', async () => {
			// Mock do findUnique para verificar se o módulo existe
			vi.mocked(prisma.modulo.findUnique).mockResolvedValueOnce({
				id: 1,
				nome: 'Módulo com Conteúdos',
				descricao: 'Descrição do módulo',
				data_criacao: new Date().toISOString(),
				data_atualizacao: new Date().toISOString(),
				gestor_id: 1
			} as Modulo);

			// Mock do delete lançando erro de chave estrangeira
			vi.mocked(prisma.modulo.delete).mockRejectedValueOnce({
				code: 'P2003',
				message: 'Foreign key constraint failed'
			});

			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(409);
			const body = await res.json();
			expect(body).toHaveProperty(
				'error',
				'Não é possível excluir este módulo, pois há registros associados a ele'
			);
		});
	});
});
