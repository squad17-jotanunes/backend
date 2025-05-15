import { hash } from 'bcrypt';
import type { Context } from 'hono';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import usuarios from '../routes/usuarios';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type Usuario = {
	id: number;
	gestor_id: number | null;
	nome: string;
	matricula: string;
	senha: string;
	setor: string;
	pontos: number;
	autoridade: string;
	email?: string;
	data_criacao?: Date;
	data_atualizacao?: Date;
};

type CreateUsuario = {
	nome: string;
	matricula: string;
	senha: string;
	setor: string;
	autoridade: string;
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	usuario: {
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

// Mock para o middleware de acesso ao perfil
vi.mock('../middleware/verificarAcessoPerfil', () => {
	return {
		verificarAcessoPerfil: vi.fn().mockImplementation(async (c, next) => {
			await next();
		})
	};
});

// Mock para o prisma
vi.mock('../lib/db', () => {
	return {
		prisma: {
			usuario: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			}
		} as MockedPrisma
	};
});

// Mock para bcrypt - corrigido para retornar string como implementação interna mas preservar o tipo
vi.mock('bcrypt', () => {
	return {
		hash: vi.fn().mockImplementation(() => Promise.resolve('senha_hasheada'))
	};
});

// Mock para o módulo Hono JWT
vi.mock('hono/jwt', () => {
	return {
		sign: vi.fn().mockResolvedValue('token_jwt_mockado'),
		verify: vi
			.fn()
			.mockResolvedValue({ id: 1, nome: 'Usuário Mock', autoridade: 'GESTOR' }),
		decode: vi.fn()
	};
});

describe('Rotas de usuários', () => {
	// Tipar o cliente adequadamente
	const client = testClient(usuarios) as {
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
		it('deve listar todos os usuários', async () => {
			const usuariosMock: Usuario[] = [
				{
					id: 1,
					nome: 'Usuário 1',
					matricula: '12345',
					setor: 'TI',
					autoridade: 'colaborador',
					pontos: 0,
					gestor_id: 2,
					senha: 'senha_hash'
				},
				{
					id: 2,
					nome: 'Usuário 2',
					matricula: '67890',
					setor: 'RH',
					autoridade: 'gestor',
					pontos: 100,
					gestor_id: null,
					senha: 'senha_hash'
				}
			];

			// Mock do prisma.usuario.findMany retornando uma lista de usuários
			vi.mocked(prisma.usuario.findMany).mockResolvedValueOnce(usuariosMock);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveLength(2);
			expect(body).toEqual(usuariosMock);
			expect(vi.mocked(prisma.usuario.findMany)).toHaveBeenCalledTimes(1);
		});

		it('deve retornar lista vazia quando não há usuários', async () => {
			// Mock do prisma.usuario.findMany retornando array vazio
			vi.mocked(prisma.usuario.findMany).mockResolvedValueOnce([]);

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
		it('deve buscar um usuário pelo ID', async () => {
			const usuarioMock: Usuario = {
				id: 1,
				nome: 'Usuário Teste',
				matricula: '12345',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 50,
				gestor_id: 2,
				senha: 'senha_hash'
			};

			// Mock do prisma.usuario.findUnique retornando um usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(usuarioMock);
			expect(vi.mocked(prisma.usuario.findUnique)).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					nome: true,
					matricula: true,
					setor: true,
					autoridade: true,
					pontos: true,
					gestor_id: true
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

		it('deve retornar erro quando o usuário não existe', async () => {
			// Mock do prisma.usuario.findUnique retornando null
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Usuário não encontrado');
		});
	});

	describe('POST /', () => {
		it('deve criar um novo usuário com sucesso', async () => {
			const novoUsuarioData: CreateUsuario = {
				nome: 'Novo Usuário',
				matricula: 'ABC123',
				senha: 'senha123',
				setor: 'Engenharia',
				autoridade: 'colaborador'
			};

			const novoUsuarioRetorno: Usuario = {
				id: 10,
				nome: 'Novo Usuário',
				matricula: 'ABC123',
				setor: 'Engenharia',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: 1,
				senha: 'senha_hasheada'
			};

			// Mock do prisma.usuario.findUnique retornando null (matrícula não existe)
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			// Mock do prisma.usuario.create retornando o novo usuário
			vi.mocked(prisma.usuario.create).mockResolvedValueOnce(
				novoUsuarioRetorno
			);

			const res = await client.$post({
				json: novoUsuarioData,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual(novoUsuarioRetorno);
			expect(vi.mocked(prisma.usuario.create)).toHaveBeenCalledWith({
				data: {
					nome: novoUsuarioData.nome,
					matricula: novoUsuarioData.matricula,
					senha: 'senha_hasheada',
					setor: novoUsuarioData.setor,
					autoridade: novoUsuarioData.autoridade,
					gestor_id: 1
				},
				select: {
					id: true,
					nome: true,
					matricula: true,
					setor: true,
					autoridade: true,
					pontos: true,
					gestor_id: true
				}
			});
		});

		it('deve retornar erro quando dados estão incompletos', async () => {
			const dadosIncompletos = {
				nome: 'Novo Usuário',
				// Matricula faltando
				senha: 'senha123',
				// Setor faltando
				autoridade: 'colaborador'
			};

			const res = await client.$post({
				json: dadosIncompletos,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Dados incompletos');
		});

		it('deve retornar erro quando a matrícula já existe', async () => {
			const novoUsuario = {
				nome: 'Novo Usuário',
				matricula: 'ABC123',
				senha: 'senha123',
				setor: 'Engenharia',
				autoridade: 'colaborador'
			};

			// Mock do prisma.usuario.findUnique retornando um usuário (matrícula já existe)
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
				id: 5,
				matricula: 'ABC123',
				nome: 'Usuário Existente',
				senha: 'hash_senha',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null
			} as Usuario);

			const res = await client.$post({
				json: novoUsuario,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(409);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Matrícula já cadastrada');
		});
	});

	describe('PUT /:id', () => {
		it('deve atualizar um usuário com sucesso', async () => {
			const usuarioExistente: Usuario = {
				id: 1,
				nome: 'Usuário Antigo',
				matricula: 'ABC123',
				senha: 'senha_antiga_hash',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: 2
			};

			const dadosAtualizacao = {
				nome: 'Usuário Atualizado',
				setor: 'Engenharia'
			};

			const usuarioAtualizado: Usuario = {
				id: 1,
				nome: 'Usuário Atualizado',
				matricula: 'ABC123',
				setor: 'Engenharia',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: 2,
				senha: 'senha_antiga_hash'
			};

			// Mock do findUnique para verificar se o usuário existe
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(
				usuarioExistente
			);

			// Mock do update retornando o usuário atualizado
			vi.mocked(prisma.usuario.update).mockResolvedValueOnce(usuarioAtualizado);

			const res = await client[':id'].$put({
				param: { id: '1' },
				json: dadosAtualizacao,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(usuarioAtualizado);
			expect(vi.mocked(prisma.usuario.update)).toHaveBeenCalledWith({
				where: { id: 1 },
				data: dadosAtualizacao,
				select: {
					id: true,
					nome: true,
					matricula: true,
					setor: true,
					autoridade: true,
					pontos: true,
					gestor_id: true
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

		it('deve retornar erro quando o usuário não existe', async () => {
			// Mock do prisma.usuario.findUnique retornando null
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$put({
				param: { id: '999' },
				json: { nome: 'Novo Nome' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Usuário não encontrado');
		});

		it('deve hashear a senha quando ela é fornecida na atualização', async () => {
			const usuarioExistente: Usuario = {
				id: 1,
				nome: 'Usuário Teste',
				matricula: 'ABC123',
				senha: 'senha_antiga_hash',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null
			};

			const dadosAtualizacao = {
				nome: 'Usuário Teste',
				senha: 'nova_senha'
			};

			// Mock do findUnique para verificar se o usuário existe
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(
				usuarioExistente
			);

			// Mock do update retornando o usuário atualizado
			vi.mocked(prisma.usuario.update).mockResolvedValueOnce({
				id: 1,
				nome: 'Usuário Teste',
				matricula: 'ABC123',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null,
				senha: 'senha_hasheada'
			} as Usuario);

			await client[':id'].$put({
				param: { id: '1' },
				json: dadosAtualizacao,
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(vi.mocked(hash)).toHaveBeenCalledWith('nova_senha', 10);
			expect(vi.mocked(prisma.usuario.update)).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					nome: 'Usuário Teste',
					senha: 'senha_hasheada'
				},
				select: expect.anything()
			});
		});
	});

	describe('DELETE /:id', () => {
		it('deve excluir um usuário com sucesso', async () => {
			// Mock do findUnique para verificar se o usuário existe
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
				id: 1,
				nome: 'Usuário para Excluir',
				matricula: 'ABC123',
				senha: 'senha_hash',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null
			} as Usuario);

			// Mock do delete
			vi.mocked(prisma.usuario.delete).mockResolvedValueOnce({
				id: 1,
				nome: 'Usuário Excluído',
				matricula: 'ABC123',
				senha: 'senha_hash',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null
			} as Usuario);

			const res = await client[':id'].$delete({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('message', 'Usuário excluído com sucesso');
			expect(vi.mocked(prisma.usuario.delete)).toHaveBeenCalledWith({
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

		it('deve retornar erro quando o usuário não existe', async () => {
			// Mock do prisma.usuario.findUnique retornando null
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$delete({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Usuário não encontrado');
		});

		it('deve retornar erro quando há registros associados ao usuário', async () => {
			// Mock do findUnique para verificar se o usuário existe
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
				id: 1,
				nome: 'Usuário com Registros',
				matricula: 'ABC123',
				senha: 'senha_hash',
				setor: 'TI',
				autoridade: 'colaborador',
				pontos: 0,
				gestor_id: null
			});

			// Mock do delete lançando erro de chave estrangeira
			vi.mocked(prisma.usuario.delete).mockRejectedValueOnce({
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
				'Não é possível excluir este usuário, pois há registros associados a ele'
			);
		});
	});
});
