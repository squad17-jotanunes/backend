import type { Usuario } from '@prisma/client';
import type { Context } from 'hono';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import certificados from '../routes/certificados';

// Função auxiliar para normalizar as comparações de objetos com datas
function stripDates(obj: unknown): unknown {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(stripDates);
	}

	const strippedObj = { ...(obj as Record<string, unknown>) };
	for (const key in strippedObj) {
		if (key === 'data_emissao') {
			// Verifica se existe a propriedade data_emissao
			expect(strippedObj[key]).toBeDefined();
			// Remove a propriedade para não comparar o valor
			delete strippedObj[key];
		} else if (
			typeof strippedObj[key] === 'object' &&
			strippedObj[key] !== null
		) {
			strippedObj[key] = stripDates(strippedObj[key]);
		}
	}

	return strippedObj;
}

// Mock para o Prisma
vi.mock('../lib/db', () => {
	return {
		prisma: {
			certificado: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			usuario: {
				findUnique: vi.fn(),
				update: vi.fn()
			},
			trilhaAprendizagem: {
				findUnique: vi.fn()
			},
			trilhaProgressoUsuario: {
				findFirst: vi.fn()
			},
			pontuacao: {
				create: vi.fn()
			},
			moeda: {
				create: vi.fn()
			},
			$transaction: vi.fn()
		}
	};
});

// Mock para o middleware de token JWT
vi.mock('../middleware/verificarTokenJwt', () => {
	return {
		verificarTokenJwt: vi.fn().mockImplementation(async (c, next) => {
			// Simula um usuário autenticado
			c.set('jwtPayload', {
				id: 1,
				matricula: '123',
				nome: 'Usuário Teste',
				autoridade: 'colaborador'
			});
			await next();
		})
	};
});

// Mock para o middleware de verificação de autoridade
vi.mock('../middleware/verificarAutoridade', () => {
	return {
		verificarAutoridade: vi.fn().mockImplementation(() => {
			return async (_c: Context, next: () => Promise<void>) => {
				await next();
			};
		})
	};
});

// Mock para o middleware de verificação de acesso a perfil
vi.mock('../middleware/verificarAcessoPerfil', () => {
	return {
		verificarAcessoPerfil: vi
			.fn()
			.mockImplementation(async (_c: Context, next: () => Promise<void>) => {
				await next();
			})
	};
});

describe('Certificados Routes', () => {
	// Tipagem explícita do client para evitar erro TS18046
	const client = testClient(certificados) as {
		$get: (options?: { headers?: Record<string, string> }) => Promise<Response>;
		post?: (options: {
			json: Record<string, unknown>;
			headers?: Record<string, string>;
		}) => Promise<Response>;
		'usuario/:id': {
			$get: (options: {
				param: { id: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
		};
		':id': {
			$get: (options: {
				param: { id: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
		};
		'emitir/:trilhaId': {
			$post: (options: {
				param: { trilhaId: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
		};
		':id/download': {
			$get: (options: {
				param: { id: string };
				headers?: Record<string, string>;
			}) => Promise<Response>;
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /', () => {
		it('deve listar todos os certificados', async () => {
			const certificadosMock = [
				{
					id: 1,
					usuario_id: 1,
					trilha_id: 1,
					data_emissao: new Date('2025-05-15T21:26:10.202Z'),
					usuario: {
						id: 1,
						nome: 'Usuário 1',
						matricula: '123'
					},
					trilha: {
						id: 1,
						nome: 'Trilha 1'
					}
				},
				{
					id: 2,
					usuario_id: 2,
					trilha_id: 1,
					data_emissao: new Date('2025-05-15T21:26:10.202Z'),
					usuario: {
						id: 2,
						nome: 'Usuário 2',
						matricula: '456'
					},
					trilha: {
						id: 1,
						nome: 'Trilha 1'
					}
				}
			];

			// Mock do prisma.certificado.findMany retornando os certificados
			vi.mocked(prisma.certificado.findMany).mockResolvedValueOnce(
				certificadosMock
			);

			const res = await client.$get({
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(stripDates(body)).toEqual(stripDates(certificadosMock));
			expect(vi.mocked(prisma.certificado.findMany)).toHaveBeenCalledWith({
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
		});
	});

	describe('GET /usuario/:id', () => {
		it('deve listar certificados de um usuário específico', async () => {
			const usuarioMock = {
				id: 1,
				gestor_id: null,
				nome: 'Usuário Teste',
				matricula: '123',
				senha: '',
				setor: '',
				pontos: 0,
				autoridade: 'colaborador'
			};

			const certificadosMock = [
				{
					id: 1,
					usuario_id: 1,
					trilha_id: 1,
					data_emissao: new Date(),
					trilha: {
						id: 1,
						nome: 'Trilha 1'
					}
				}
			];

			// Mock do prisma.usuario.findUnique retornando o usuário
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(usuarioMock);

			// Mock do prisma.certificado.findMany retornando os certificados
			vi.mocked(prisma.certificado.findMany).mockResolvedValueOnce(
				certificadosMock
			);

			const res = await client['usuario/:id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(stripDates(body)).toEqual(stripDates(certificadosMock));
			expect(vi.mocked(prisma.certificado.findMany)).toHaveBeenCalledWith({
				where: { usuario_id: 1 },
				include: {
					trilha: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});
		});

		it('deve retornar erro quando o ID não é válido', async () => {
			const res = await client['usuario/:id'].$get({
				param: { id: 'abc' }, // ID não numérico
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'ID de usuário inválido');
		});

		it('deve retornar erro quando o usuário não existe', async () => {
			// Mock do prisma.usuario.findUnique retornando null
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);

			const res = await client['usuario/:id'].$get({
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

	describe('GET /:id', () => {
		it('deve buscar um certificado específico por ID', async () => {
			const certificadoMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				data_emissao: new Date(),
				usuario: {
					id: 1,
					nome: 'Usuário Teste',
					matricula: '123',
					setor: 'TI'
				},
				trilha: {
					id: 1,
					nome: 'Trilha 1',
					descricao: 'Descrição da Trilha 1'
				}
			};

			// Mock do prisma.certificado.findUnique retornando o certificado
			vi.mocked(prisma.certificado.findUnique).mockResolvedValueOnce(
				certificadoMock
			);

			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(stripDates(body)).toEqual(stripDates(certificadoMock));
			expect(vi.mocked(prisma.certificado.findUnique)).toHaveBeenCalledWith({
				where: { id: 1 },
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

		it('deve retornar erro quando o certificado não existe', async () => {
			// Mock do prisma.certificado.findUnique retornando null
			vi.mocked(prisma.certificado.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Certificado não encontrado');
		});
	});

	describe('POST /emitir/:trilhaId', () => {
		it('deve emitir um certificado com sucesso', async () => {
			const trilhaMock = {
				id: 1,
				nome: 'Trilha 1',
				descricao: 'Descrição da Trilha 1',
				gestor_id: 2
			};

			const progressoMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				percentual: 100,
				finalizado: true,
				data_inicio: new Date(),
				data_finalizacao: new Date()
			};

			const novoCertificadoMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				data_emissao: new Date()
			};

			// Mock do prisma.trilhaAprendizagem.findUnique retornando a trilha
			vi.mocked(prisma.trilhaAprendizagem.findUnique).mockResolvedValueOnce(
				trilhaMock
			);

			// Mock do prisma.trilhaProgressoUsuario.findFirst retornando o progresso
			vi.mocked(prisma.trilhaProgressoUsuario.findFirst).mockResolvedValueOnce(
				progressoMock
			);

			// Mock do prisma.certificado.findFirst retornando null (certificado não existe)
			vi.mocked(prisma.certificado.findFirst).mockResolvedValueOnce(null);

			// Mock do prisma.certificado.create retornando o novo certificado
			vi.mocked(prisma.certificado.create).mockResolvedValueOnce(
				novoCertificadoMock
			);

			// Mock das criações de pontuação e moedas
			vi.mocked(prisma.pontuacao.create).mockResolvedValueOnce({
				id: 1,
				usuario_id: 1,
				tipo_evento: 'CERTIFICADO',
				referencia_id: 1,
				pontos: 100,
				data_evento: new Date(),
				descricao: 'Certificado obtido na trilha: Trilha 1'
			});
			vi.mocked(prisma.usuario.update).mockResolvedValueOnce({
				id: 1,
				gestor_id: null,
				nome: 'Usuário Teste',
				matricula: '123',
				senha: '',
				setor: '',
				pontos: 0,
				autoridade: 'colaborador'
			});
			vi.mocked(prisma.moeda.create).mockResolvedValueOnce({
				id: 1,
				usuario_id: 1,
				tipo_evento: 'CERTIFICADO',
				referencia_id: 1,
				moedas: 10,
				data_evento: new Date(),
				descricao: 'Bônus por certificado'
			});

			const res = await client['emitir/:trilhaId'].$post({
				param: { trilhaId: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toHaveProperty('message', 'Certificado emitido com sucesso');
			expect(stripDates(body.certificado)).toEqual(
				stripDates(novoCertificadoMock)
			);
			expect(vi.mocked(prisma.certificado.create)).toHaveBeenCalledWith({
				data: {
					usuario_id: 1,
					trilha_id: 1,
					data_emissao: expect.any(Date)
				}
			});
		});

		it('deve retornar erro quando a trilha não existe', async () => {
			// Mock do prisma.trilhaAprendizagem.findUnique retornando null
			vi.mocked(prisma.trilhaAprendizagem.findUnique).mockResolvedValueOnce(
				null
			);

			const res = await client['emitir/:trilhaId'].$post({
				param: { trilhaId: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Trilha não encontrada');
		});

		it('deve retornar erro quando o usuário não concluiu a trilha', async () => {
			const trilhaMock = {
				id: 1,
				nome: 'Trilha 1',
				descricao: 'Descrição da Trilha 1',
				gestor_id: 2
			};

			// Mock do prisma.trilhaAprendizagem.findUnique retornando a trilha
			vi.mocked(prisma.trilhaAprendizagem.findUnique).mockResolvedValueOnce(
				trilhaMock
			);

			// Mock do prisma.trilhaProgressoUsuario.findFirst retornando null
			vi.mocked(prisma.trilhaProgressoUsuario.findFirst).mockResolvedValueOnce(
				null
			);

			const res = await client['emitir/:trilhaId'].$post({
				param: { trilhaId: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body).toHaveProperty(
				'error',
				'Usuário não concluiu esta trilha ainda'
			);
		});

		it('deve retornar informação quando o certificado já existe', async () => {
			const trilhaMock = {
				id: 1,
				nome: 'Trilha 1',
				descricao: 'Descrição da Trilha 1',
				gestor_id: 2
			};

			const progressoMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				percentual: 100,
				finalizado: true,
				data_inicio: new Date(),
				data_finalizacao: new Date()
			};

			const certificadoExistenteMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				data_emissao: new Date()
			};

			// Mock do prisma.trilhaAprendizagem.findUnique retornando a trilha
			vi.mocked(prisma.trilhaAprendizagem.findUnique).mockResolvedValueOnce(
				trilhaMock
			);

			// Mock do prisma.trilhaProgressoUsuario.findFirst retornando o progresso
			vi.mocked(prisma.trilhaProgressoUsuario.findFirst).mockResolvedValueOnce(
				progressoMock
			);

			// Mock do prisma.certificado.findFirst retornando o certificado já existente
			vi.mocked(prisma.certificado.findFirst).mockResolvedValueOnce(
				certificadoExistenteMock
			);

			const res = await client['emitir/:trilhaId'].$post({
				param: { trilhaId: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty(
				'message',
				'Certificado já emitido anteriormente'
			);
			expect(stripDates(body.certificado)).toEqual(
				stripDates(certificadoExistenteMock)
			);
		});
	});

	describe('GET /:id/download', () => {
		it('deve retornar os dados para geração do PDF do certificado', async () => {
			const certificadoMock = {
				id: 1,
				usuario_id: 1,
				trilha_id: 1,
				data_emissao: new Date(),
				usuario: {
					id: 1,
					nome: 'Usuário Teste',
					matricula: '123',
					setor: 'TI',
					autoridade: 'colaborador'
				},
				trilha: {
					id: 1,
					nome: 'Trilha 1',
					descricao: 'Descrição da Trilha 1'
				}
			};

			// Mock do prisma.certificado.findUnique retornando o certificado
			vi.mocked(prisma.certificado.findUnique).mockResolvedValueOnce(
				certificadoMock
			);

			// Mock do prisma.usuario.findUnique retornando o usuário solicitante
			vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
				id: 1,
				autoridade: 'colaborador'
			} as Usuario);

			const res = await client[':id/download'].$get({
				param: { id: '1' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveProperty(
				'message',
				'Dados do certificado para geração de PDF'
			);
			expect(body).toHaveProperty('certificado');
			expect(body.certificado).toHaveProperty('nomeCurso', 'Trilha 1');
			expect(body.certificado).toHaveProperty('nomeCompleto', 'Usuário Teste');
			expect(body.certificado).toHaveProperty('codigo', 'CERT-000001');
		});

		it('deve retornar erro quando o certificado não existe', async () => {
			// Mock do prisma.certificado.findUnique retornando null
			vi.mocked(prisma.certificado.findUnique).mockResolvedValueOnce(null);

			const res = await client[':id/download'].$get({
				param: { id: '999' },
				headers: {
					Authorization: 'Bearer token_valido'
				}
			});

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body).toHaveProperty('error', 'Certificado não encontrado');
		});
	});
});
