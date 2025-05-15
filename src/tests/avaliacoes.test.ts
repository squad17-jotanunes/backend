import type { Context } from 'hono';
import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import avaliacoes from '../routes/avaliacoes';
// Mocks dos middlewares devem vir antes do import das rotas!
vi.mock('../middleware/verificarTokenJwt', () => {
	return {
		verificarTokenJwt: vi
			.fn()
			.mockImplementation(async (c: Context, next: () => Promise<void>) => {
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
vi.mock('../middleware/verificarAutoridade', () => {
	return {
		verificarAutoridade: vi.fn().mockImplementation(() => {
			return async (c: Context, next: () => Promise<void>) => {
				await next();
			};
		})
	};
});

// Mockando o Prisma Client
vi.mock('../lib/db', () => ({
	prisma: {
		avaliacao: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		},
		questao: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn()
		},
		alternativa: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn()
		},
		avaliacaoResposta: {
			create: vi.fn(),
			deleteMany: vi.fn()
		},
		conteudo: {
			findUnique: vi.fn()
		},
		trilhaAprendizagem: {
			findUnique: vi.fn()
		},
		desafioEtapa: {
			findUnique: vi.fn()
		},
		conteudoCheck: {
			findFirst: vi.fn(),
			create: vi.fn()
		},
		pontuacao: {
			create: vi.fn()
		},
		usuario: {
			update: vi.fn()
		},
		$transaction: vi.fn((callback) => callback(prisma))
	}
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('Testes das rotas de avaliações', () => {
	// Definição dos mocks de dados (apenas uma vez, no início do describe)
	const conteudoMock = {
		id: 1,
		modulo_id: 1,
		tipo: 'video',
		titulo: 'Conteúdo de teste',
		descricao: 'Descrição do conteúdo',
		url_video: 'https://exemplo.com/video.mp4',
		url_pdf: null,
		ordem: 1,
		gestor_id: 1
	};
	const avaliacaoMock = {
		id: 1,
		titulo: 'Avaliação de teste',
		descricao: 'Descrição da avaliação de teste',
		conteudo_id: 1,
		trilha_id: null,
		etapa_id: null,
		gestor_id: 1,
		gestor: { id: 1, nome: 'Gestor Teste' },
		conteudo: { id: 1, titulo: 'Conteúdo de teste' },
		trilha: null,
		questoes: [
			{
				id: 1,
				avaliacao_id: 1,
				texto: 'Questão de teste?',
				gestor_id: 1,
				alternativas: [
					{ id: 1, questao_id: 1, texto: 'Alternativa correta', correta: true },
					{
						id: 2,
						questao_id: 1,
						texto: 'Alternativa incorreta',
						correta: false
					}
				]
			}
		]
	};

	// Tipar o client igual aos outros testes
	const client = testClient(avaliacoes) as {
		$get: (options?: { headers?: Record<string, string> }) => Promise<Response>;
		$post: (options: {
			json: Record<string, unknown>;
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
			questoes: {
				$post: (options: {
					param: { id: string };
					json: Record<string, unknown>;
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
			responder: {
				$post: (options: {
					param: { id: string };
					json: Record<string, unknown>;
					headers?: Record<string, string>;
				}) => Promise<Response>;
			};
		};
	};
	const dataCriacao = new Date();

	// Token de autenticação simulado para gestor
	const tokenGestor = 'token_valido';
	const jwtPayloadGestor = { id: 1, autoridade: 'gestor' };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /avaliacoes', () => {
		it('deve listar todas as avaliações', async () => {
			// Configuração do mock
			vi.mocked(prisma.avaliacao.findMany).mockResolvedValueOnce([
				avaliacaoMock
			]);

			// Execução do teste
			const res = await client.$get({
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toHaveLength(1);
			expect(body[0].titulo).toBe('Avaliação de teste');
			expect(prisma.avaliacao.findMany).toHaveBeenCalledTimes(1);
		});
	});

	describe('GET /avaliacoes/:id', () => {
		it('deve retornar uma avaliação específica', async () => {
			// Configuração do mock
			vi.mocked(prisma.avaliacao.findUnique).mockResolvedValueOnce(
				avaliacaoMock
			);

			// Execução do teste
			const res = await client[':id'].$get({
				param: { id: '1' },
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.id).toBe(1);
			expect(body.titulo).toBe('Avaliação de teste');
			expect(prisma.avaliacao.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: expect.any(Object)
			});
		});

		it('deve retornar 404 para avaliação não encontrada', async () => {
			// Configuração do mock
			vi.mocked(prisma.avaliacao.findUnique).mockResolvedValueOnce(null);

			// Execução do teste
			const res = await client[':id'].$get({
				param: { id: '999' },
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body.error).toBe('Avaliação não encontrada');
		});
	});

	describe('POST /avaliacoes', () => {
		it('deve criar uma nova avaliação', async () => {
			// Dados para o teste
			const novaAvaliacao = {
				titulo: 'Nova Avaliação',
				descricao: 'Descrição da nova avaliação',
				conteudo_id: 1
			};

			const avaliacaoCriada = {
				id: 2,
				titulo: 'Nova Avaliação',
				descricao: 'Descrição da nova avaliação',
				conteudo_id: 1,
				trilha_id: null,
				etapa_id: null,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor Teste'
				},
				conteudo: {
					id: 1,
					titulo: 'Conteúdo de teste'
				},
				trilha: null,
				questoes: []
			};

			// Configuração dos mocks
			vi.mocked(prisma.conteudo.findUnique).mockResolvedValueOnce(conteudoMock);
			vi.mocked(prisma.avaliacao.create).mockResolvedValueOnce(avaliacaoCriada);

			// Execução do teste
			const res = await client.$post({
				json: novaAvaliacao,
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.titulo).toBe('Nova Avaliação');
			expect(body.conteudo.id).toBe(1);
			expect(prisma.avaliacao.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						titulo: 'Nova Avaliação',
						descricao: 'Descrição da nova avaliação',
						conteudo_id: 1,
						gestor_id: 1
					})
				})
			);
		});
	});

	describe('POST /avaliacoes/:id/questoes', () => {
		it('deve criar uma nova questão para uma avaliação', async () => {
			// Dados para o teste
			const novaQuestao = {
				texto: 'Nova questão de teste?',
				alternativas: [
					{ texto: 'Alternativa correta', correta: true },
					{ texto: 'Alternativa incorreta', correta: false }
				]
			};

			const avaliacaoExistente = {
				id: 1,
				titulo: 'Avaliação existente',
				descricao: 'Descrição',
				conteudo_id: 1,
				trilha_id: null,
				etapa_id: null,
				gestor_id: 1
			};

			const questaoCriada = {
				id: 2,
				avaliacao_id: 1,
				texto: 'Nova questão de teste?',
				gestor_id: 1,
				alternativas: [
					{
						id: 3,
						questao_id: 2,
						texto: 'Alternativa correta',
						correta: true
					},
					{
						id: 4,
						questao_id: 2,
						texto: 'Alternativa incorreta',
						correta: false
					}
				]
			};

			// Configuração dos mocks
			vi.mocked(prisma.avaliacao.findUnique).mockResolvedValueOnce(
				avaliacaoExistente
			);
			vi.mocked(prisma.questao.create).mockResolvedValueOnce({
				id: 2,
				avaliacao_id: 1,
				texto: 'Nova questão de teste?',
				gestor_id: 1
			});
			vi.mocked(prisma.questao.findUnique).mockResolvedValueOnce(questaoCriada);

			// Execução do teste
			const res = await client[':id'].questoes.$post({
				param: { id: '1' },
				json: novaQuestao,
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.texto).toBe('Nova questão de teste?');
			expect(body.alternativas).toHaveLength(2);
			expect(prisma.$transaction).toHaveBeenCalled();
		});
	});

	describe('POST /avaliacoes/:id/responder', () => {
		it('deve submeter respostas para uma avaliação', async () => {
			// Dados para o teste
			const respostas = {
				respostas: [{ questao_id: 1, alternativa_id: 1 }]
			};

			const avaliacaoComQuestoes = {
				id: 1,
				titulo: 'Avaliação de teste',
				descricao: 'Descrição da avaliação de teste',
				conteudo_id: 1,
				trilha_id: null,
				etapa_id: null,
				gestor_id: 1,
				gestor: {
					id: 1,
					nome: 'Gestor Teste'
				},
				conteudo: {
					id: 1,
					titulo: 'Conteúdo de teste'
				},
				trilha: null,
				questoes: [
					{
						id: 1,
						avaliacao_id: 1,
						texto: 'Questão de teste?',
						gestor_id: 1,
						alternativas: [
							{
								id: 1,
								questao_id: 1,
								texto: 'Alternativa correta',
								correta: true
							},
							{
								id: 2,
								questao_id: 1,
								texto: 'Alternativa incorreta',
								correta: false
							}
						]
					}
				]
			};

			// Configuração dos mocks
			vi.mocked(prisma.avaliacao.findUnique).mockResolvedValueOnce(
				avaliacaoComQuestoes
			);
			vi.mocked(prisma.avaliacaoResposta.create).mockResolvedValueOnce({
				id: 1,
				usuario_id: 1,
				alternativa_id: 1,
				data_resposta: new Date(),
				questaoId: 1
			});
			vi.mocked(prisma.conteudoCheck.findFirst).mockResolvedValueOnce(null);
			vi.mocked(prisma.conteudoCheck.create).mockResolvedValueOnce({
				id: 1,
				usuario_id: 1,
				conteudo_id: 1,
				data_assistido: new Date()
			});

			// Execução do teste
			const res = await client[':id'].responder.$post({
				param: { id: '1' },
				json: respostas,
				headers: {
					Authorization: `Bearer ${tokenGestor}`
				}
			});

			// Verificações
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.avaliacao_id).toBe(1);
			expect(body.questoes_total).toBe(1);
			expect(body.acertos).toBe(1);
			expect(body.percentual_acerto).toBe(100);
			expect(prisma.pontuacao.create).toHaveBeenCalled();
			expect(prisma.usuario.update).toHaveBeenCalled();
		});
	});
});
