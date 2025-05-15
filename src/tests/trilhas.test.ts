import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import trilhas from '../routes/trilhas';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type TrilhaAprendizagem = {
	id: number;
	nome: string;
	descricao: string;
	carga_horaria: number;
	gestor_id: number;
	avaliacao_id: number | null;
	data_criacao?: Date;
	data_atualizacao?: Date;
	gestor?: {
		id: number;
		nome: string;
	};
	itensTrilha?: Array<{
		id: number;
		trilha_id: number;
		modulo_id: number;
		ordem: number;
		modulo: {
			id: number;
			nome: string;
			descricao: string;
			conteudos?: Array<{
				id: number;
				titulo: string;
				tipo: string;
				ordem: number;
			}>;
		};
	}>;
	avaliacao?: {
		id: number;
		titulo: string;
		pontos_aprovacao: number;
	} | null;
};

type ItemTrilha = {
	id: number;
	trilha_id: number;
	modulo_id: number;
	ordem: number;
};

type TrilhaProgressoUsuario = {
	id: number;
	trilha_id: number;
	usuario_id: number;
	data_inicio: Date | string;
	data_conclusao: Date | null | string;
	status: string;
	progresso: number;
};

type ConteudoCheck = {
	id: number;
	conteudo_id: number;
	usuario_id: number;
	data: Date;
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	trilhaAprendizagem: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	itemTrilha: {
		create: ReturnType<typeof vi.fn>;
		deleteMany: ReturnType<typeof vi.fn>;
	};
	modulo: {
		findMany: ReturnType<typeof vi.fn>;
	};
	trilhaProgressoUsuario: {
		findFirst: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		count: ReturnType<typeof vi.fn>;
	};
	conteudoCheck: {
		count: ReturnType<typeof vi.fn>;
	};
	$transaction: ReturnType<typeof vi.fn>;
};

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

// Mock para o middleware de autoridade
vi.mock('../middleware/verificarAutoridade', () => {
	return {
		verificarAutoridade: vi.fn().mockImplementation(() => {
			return async (c, next) => {
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
			trilhaAprendizagem: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			itemTrilha: {
				create: vi.fn(),
				deleteMany: vi.fn()
			},
			modulo: {
				findMany: vi.fn()
			},
			trilhaProgressoUsuario: {
				findFirst: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				count: vi.fn()
			},
			conteudoCheck: {
				count: vi.fn()
			},
			$transaction: vi.fn().mockImplementation(async (callback) => {
				return callback({
					trilhaAprendizagem: {
						findUnique: vi.fn(),
						create: vi.fn(),
						update: vi.fn(),
						delete: vi.fn()
					},
					itemTrilha: {
						create: vi.fn(),
						deleteMany: vi.fn()
					},
					modulo: {
						findMany: vi.fn()
					}
				});
			})
		} as unknown as MockedPrisma
	};
});

// Importando o prisma mockado
import { prisma } from '../lib/db';

describe('Rotas de trilhas de aprendizagem', () => {
	// Tipar o cliente adequadamente
	const client = testClient(trilhas) as {
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
			iniciar: {
				$post: (options: {
					param: { id: string };
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
			progresso: {
				$get: (options: {
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
		it('deve listar todas as trilhas de aprendizagem', async () => {
			// Mock dos dados de retorno
			const trilhasMock: TrilhaAprendizagem[] = [
				{
					id: 1,
					nome: 'Introdução à Construção',
					descricao: 'Conceitos básicos de construção civil',
					carga_horaria: 20,
					gestor_id: 1,
					avaliacao_id: null,
					gestor: {
						id: 1,
						nome: 'Gestor Teste'
					},
					itensTrilha: [
						{
							id: 1,
							trilha_id: 1,
							modulo_id: 1,
							ordem: 1,
							modulo: {
								id: 1,
								nome: 'Fundações',
								descricao: 'Conceitos básicos de fundações'
							}
						},
						{
							id: 2,
							trilha_id: 1,
							modulo_id: 2,
							ordem: 2,
							modulo: {
								id: 2,
								nome: 'Alvenaria',
								descricao: 'Conceitos básicos de alvenaria'
							}
						}
					]
				}
			];

			// Configurar o mock do findMany para retornar a lista de trilhas
			(
				prisma.trilhaAprendizagem.findMany as ReturnType<typeof vi.fn>
			).mockResolvedValue(trilhasMock);

			// Fazer a requisição GET
			const res = await client.$get({
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém as trilhas
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(trilhasMock);
			expect(prisma.trilhaAprendizagem.findMany).toHaveBeenCalledTimes(1);
		});
	});

	// Outros testes podem ser implementados para as demais rotas
	// ...

	// Exemplo de teste para a rota de iniciar trilha
	describe('POST /:id/iniciar', () => {
		it('deve iniciar uma trilha para o usuário', async () => {
			// Mock da trilha existente
			const trilhaMock: TrilhaAprendizagem = {
				id: 1,
				nome: 'Introdução à Construção',
				descricao: 'Conceitos básicos de construção civil',
				carga_horaria: 20,
				gestor_id: 1,
				avaliacao_id: null
			};

			// Mock do progresso criado
			const dataInicioMock = '2025-05-15T19:27:41.542Z';
			const progressoMock: TrilhaProgressoUsuario = {
				id: 1,
				trilha_id: 1,
				usuario_id: 1,
				data_inicio: dataInicioMock, // Usando string para representar a data
				data_conclusao: null,
				status: 'EM_ANDAMENTO',
				progresso: 0
			};

			// Configurar os mocks
			(
				prisma.trilhaAprendizagem.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(trilhaMock);
			(
				prisma.trilhaProgressoUsuario.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(null); // Usuário ainda não iniciou a trilha
			(
				prisma.trilhaProgressoUsuario.create as ReturnType<typeof vi.fn>
			).mockResolvedValue(progressoMock);

			// Fazer a requisição POST para iniciar a trilha
			const res = await client[':id']['iniciar'].$post({
				param: { id: '1' },
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar o resultado
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({
				message: 'Trilha de aprendizagem iniciada com sucesso',
				progresso: progressoMock
			});
		});
	});
});
