import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import conteudos from '../routes/conteudos';

// Definindo tipos para os mocks - correspondendo aos modelos do Prisma
type Conteudo = {
	id: number;
	modulo_id: number;
	tipo: string;
	titulo: string;
	descricao: string;
	url_video: string;
	url_pdf: string | null;
	ordem: number;
	gestor_id: number;
	gestor?: {
		id: number;
		nome: string;
	};
	modulo?: {
		id: number;
		nome: string;
	};
};

type ConteudoCheck = {
	id: number;
	conteudo_id: number;
	usuario_id: number;
	data: Date;
};

// Definindo tipos para os mocks do Prisma
type MockedPrisma = {
	conteudo: {
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	modulo: {
		findUnique: ReturnType<typeof vi.fn>;
	};
	conteudoCheck: {
		findFirst: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		count: ReturnType<typeof vi.fn>;
	};
	avaliacao: {
		count: ReturnType<typeof vi.fn>;
	};
	pontuacao: {
		create: ReturnType<typeof vi.fn>;
	};
	usuario: {
		update: ReturnType<typeof vi.fn>;
	};
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
			conteudo: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			modulo: {
				findUnique: vi.fn()
			},
			conteudoCheck: {
				findFirst: vi.fn(),
				create: vi.fn(),
				count: vi.fn()
			},
			avaliacao: {
				count: vi.fn()
			},
			pontuacao: {
				create: vi.fn()
			},
			usuario: {
				update: vi.fn()
			}
		} as MockedPrisma
	};
});

// Importando o prisma mockado
import { prisma } from '../lib/db';

describe('Rotas de conteúdos', () => {
	// Tipar o cliente adequadamente
	const client = testClient(conteudos) as {
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
			assistir: {
				$post: (options: {
					param: { id: string };
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
		};
		modulo: {
			':moduloId': {
				$get: (options: {
					param: { moduloId: string };
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /', () => {
		it('deve listar todos os conteúdos', async () => {
			// Mock dos dados de retorno
			const conteudosMock: Conteudo[] = [
				{
					id: 1,
					modulo_id: 1,
					tipo: 'video',
					titulo: 'Introdução',
					descricao: 'Aula introdutória',
					url_video: 'https://exemplo.com/video1.mp4',
					url_pdf: null,
					ordem: 1,
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor Teste'
					},
					modulo: {
						id: 1,
						nome: 'Módulo Teste'
					}
				},
				{
					id: 2,
					modulo_id: 1,
					tipo: 'video',
					titulo: 'Conceitos Básicos',
					descricao: 'Conceitos básicos do curso',
					url_video: 'https://exemplo.com/video2.mp4',
					url_pdf: 'https://exemplo.com/documento.pdf',
					ordem: 2,
					gestor_id: 1,
					gestor: {
						id: 1,
						nome: 'Gestor Teste'
					},
					modulo: {
						id: 1,
						nome: 'Módulo Teste'
					}
				}
			];

			// Configurar o mock do findMany para retornar a lista de conteúdos
			(prisma.conteudo.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				conteudosMock
			);

			// Fazer a requisição GET
			const res = await client.$get({
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 200 e o corpo contém os conteúdos
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual(conteudosMock);
			expect(prisma.conteudo.findMany).toHaveBeenCalledTimes(1);
		});
	});

	// Outros testes podem ser implementados para as demais rotas
	// ...

	// Exemplo de teste para a rota de criar conteúdo
	describe('POST /', () => {
		it('deve criar um novo conteúdo com sucesso', async () => {
			// Mock do módulo existente
			(prisma.modulo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: 1,
				nome: 'Módulo Teste',
				descricao: 'Descrição do módulo',
				gestor_id: 1
			});

			// Mock do conteúdo criado
			const novoConteudo = {
				id: 3,
				modulo_id: 1,
				tipo: 'video',
				titulo: 'Nova Aula',
				descricao: 'Descrição da nova aula',
				url_video: 'https://exemplo.com/video3.mp4',
				url_pdf: 'https://exemplo.com/documento3.pdf',
				ordem: 3,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor Teste'
				},
				modulo: {
					id: 1,
					nome: 'Módulo Teste'
				}
			};

			// Configurar o mock do create para retornar o novo conteúdo
			(prisma.conteudo.create as ReturnType<typeof vi.fn>).mockResolvedValue(
				novoConteudo
			);

			// Fazer a requisição POST
			const res = await client.$post({
				json: {
					modulo_id: 1,
					tipo: 'video',
					titulo: 'Nova Aula',
					descricao: 'Descrição da nova aula',
					url_video: 'https://exemplo.com/video3.mp4',
					url_pdf: 'https://exemplo.com/documento3.pdf',
					ordem: 3
				},
				headers: { Authorization: 'Bearer fake-token' }
			});

			// Verificar se o status é 201 e o corpo contém o novo conteúdo
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual(novoConteudo);
			expect(prisma.modulo.findUnique).toHaveBeenCalledTimes(1);
			expect(prisma.conteudo.create).toHaveBeenCalledTimes(1);
		});
	});
});
