import { compare } from 'bcrypt';
import * as honoJwt from 'hono/jwt';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import auth from '../routes/auth';

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
	email: string;
	data_criacao: Date;
	data_atualizacao: Date;
};

type RefreshToken = {
	id: number;
	token: string;
	usuario_id: number;
	data_expiracao: Date;
	revogado: boolean;
	criado_em: Date;
};

type RefreshTokenComUsuario = RefreshToken & {
	usuario: Usuario;
};

type UpdateManyResponse = {
	count: number;
};

// Definindo tipos para os mocks
type MockedPrisma = {
	usuario: {
		findUnique: ReturnType<typeof vi.fn>;
	};
	refreshToken: {
		create: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		updateMany: ReturnType<typeof vi.fn>;
	};
};

// Mock para o prisma
vi.mock('../lib/db', () => {
	return {
		prisma: {
			usuario: {
				findUnique: vi.fn()
			},
			refreshToken: {
				create: vi.fn(),
				findUnique: vi.fn(),
				updateMany: vi.fn()
			}
		} as MockedPrisma
	};
});

// Mock para bcrypt
vi.mock('bcrypt', () => {
	return {
		compare: vi.fn().mockResolvedValue(false),
		hash: vi.fn()
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

describe('Rotas de autenticação', () => {
	// Tipar o cliente adequadamente
	const client = testClient(auth) as {
		login: {
			$post: (options: { json: Record<string, unknown> }) => Promise<Response>;
		};
		refresh: {
			$post: (options: { json: Record<string, unknown> }) => Promise<Response>;
		};
		logout: {
			$post: (options: { json: Record<string, unknown> }) => Promise<Response>;
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('POST /login', () => {
		it('deve retornar erro quando matrícula e senha não são fornecidas', async () => {
			const res = await client.login.$post({
				json: {}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty(
				'error',
				'Matrícula e senha são obrigatórios'
			);
		});

		it('deve retornar erro quando o usuário não existe', async () => {
			// Mock do prisma.usuario.findUnique retornando null
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			const res = await client.login.$post({
				json: {
					matricula: '12345',
					senha: 'senha123'
				}
			});

			expect(res.status).toBe(401);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Matrícula ou senha inválida');
		});

		it('deve retornar erro quando a senha está incorreta', async () => {
			// Mock do prisma.usuario.findUnique retornando um usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
				id: 1,
				gestor_id: null,
				nome: 'Usuário Teste',
				matricula: '12345',
				senha: 'hash_da_senha',
				setor: 'TI',
				pontos: 0,
				autoridade: 'colaborador',
				email: 'usuario@teste.com',
				data_criacao: new Date(),
				data_atualizacao: new Date()
			} as Usuario);

			// Mock do compare retornando false (senha incorreta)
			vi.mocked(compare).mockImplementationOnce(() => Promise.resolve(false));

			const res = await client.login.$post({
				json: {
					matricula: '12345',
					senha: 'senha_errada'
				}
			});

			expect(res.status).toBe(401);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Matrícula ou senha inválida');
		});

		it('deve realizar login com sucesso sem manter sessão', async () => {
			const usuarioMock: Usuario = {
				id: 1,
				gestor_id: null,
				nome: 'Usuário Teste',
				matricula: '12345',
				senha: 'hash_da_senha',
				setor: 'TI',
				pontos: 0,
				autoridade: 'colaborador',
				email: 'usuario@teste.com',
				data_criacao: new Date(),
				data_atualizacao: new Date()
			};

			// Mock do prisma.usuario.findUnique retornando um usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			// Mock do compare retornando true (senha correta)
			vi.mocked(compare).mockImplementationOnce(() => Promise.resolve(true));

			// Mock do sign retornando um token
			vi.mocked(honoJwt.sign).mockResolvedValueOnce('token_jwt_mockado');

			const res = await client.login.$post({
				json: {
					matricula: '12345',
					senha: 'senha_correta'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('token', 'token_jwt_mockado');
			expect(body).toHaveProperty('usuario.id', 1);
			expect(body).toHaveProperty('usuario.nome', 'Usuário Teste');
			expect(body).not.toHaveProperty('refreshToken');
		});

		it('deve realizar login com sucesso e gerar refresh token quando manterSessao=true', async () => {
			const usuarioMock: Usuario = {
				id: 1,
				gestor_id: null,
				nome: 'Usuário Teste',
				matricula: '12345',
				senha: 'hash_da_senha',
				setor: 'TI',
				pontos: 0,
				autoridade: 'colaborador',
				email: 'usuario@teste.com',
				data_criacao: new Date(),
				data_atualizacao: new Date()
			};

			// Mock do prisma.usuario.findUnique retornando um usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			// Mock do compare retornando true (senha correta)
			vi.mocked(compare).mockImplementationOnce(() => Promise.resolve(true));

			// Mock do sign retornando um token
			vi.mocked(honoJwt.sign).mockResolvedValueOnce('token_jwt_mockado');

			// Mock do prisma.refreshToken.create
			vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({
				id: 1,
				token: 'refresh_token_mockado',
				usuario_id: 1,
				data_expiracao: new Date(),
				revogado: false,
				criado_em: new Date()
			} as RefreshToken);

			const res = await client.login.$post({
				json: {
					matricula: '12345',
					senha: 'senha_correta',
					manterSessao: true
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('token', 'token_jwt_mockado');
			expect(body).toHaveProperty('usuario.id', 1);
			expect(body).toHaveProperty('refreshToken');
			expect(body).toHaveProperty('tokenExpiry');
			expect(body).toHaveProperty('refreshTokenExpiry');
		});
	});

	describe('POST /refresh', () => {
		it('deve retornar erro quando o refresh token não é fornecido', async () => {
			const res = await client.refresh.$post({
				json: {}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Refresh token não fornecido');
		});

		it('deve retornar erro quando o refresh token é inválido', async () => {
			// Mock do prisma.refreshToken.findUnique retornando null
			vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(null);

			const res = await client.refresh.$post({
				json: {
					refreshToken: 'token_invalido'
				}
			});

			expect(res.status).toBe(401);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Refresh token inválido');
		});

		it('deve retornar novo token JWT quando o refresh token é válido', async () => {
			const dataFutura = new Date();
			dataFutura.setDate(dataFutura.getDate() + 30);

			// Mock do prisma.refreshToken.findUnique retornando um refresh token válido
			vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce({
				id: 1,
				token: 'refresh_token_valido',
				usuario_id: 1,
				data_expiracao: dataFutura,
				revogado: false,
				criado_em: new Date(),
				usuario: {
					id: 1,
					gestor_id: null,
					nome: 'Usuário Teste',
					matricula: '12345',
					senha: 'hash_da_senha',
					setor: 'TI',
					pontos: 0,
					autoridade: 'colaborador',
					email: 'usuario@teste.com',
					data_criacao: new Date(),
					data_atualizacao: new Date()
				}
			} as RefreshTokenComUsuario);

			// Mock do sign retornando um token
			vi.mocked(honoJwt.sign).mockResolvedValueOnce('novo_token_jwt_mockado');

			const res = await client.refresh.$post({
				json: {
					refreshToken: 'refresh_token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('token', 'novo_token_jwt_mockado');
			expect(body).toHaveProperty('usuario.id', 1);
			expect(body).toHaveProperty('refreshToken', 'refresh_token_valido');
		});
	});

	describe('POST /logout', () => {
		it('deve revogar o refresh token com sucesso', async () => {
			// Mock do prisma.refreshToken.updateMany
			vi.mocked(prisma.refreshToken.updateMany).mockResolvedValueOnce({
				count: 1
			} as UpdateManyResponse);

			const res = await client.logout.$post({
				json: {
					refreshToken: 'token_para_revogar'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('message', 'Logout realizado com sucesso');
			expect(vi.mocked(prisma.refreshToken.updateMany)).toHaveBeenCalledWith({
				where: { token: 'token_para_revogar' },
				data: { revogado: true }
			});
		});

		it('deve retornar sucesso mesmo sem refresh token', async () => {
			const res = await client.logout.$post({
				json: {}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty('message', 'Logout realizado com sucesso');
			expect(vi.mocked(prisma.refreshToken.updateMany)).not.toHaveBeenCalled();
		});
	});
});
