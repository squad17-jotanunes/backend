import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class AvaliacoesController {
	// Listar todas as avaliações
	async listarTodas(c: Context): Promise<Response> {
		try {
			const avaliacoes = await prisma.avaliacao.findMany({
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					conteudo: {
						select: {
							id: true,
							titulo: true
						}
					},
					trilha: {
						select: {
							id: true,
							nome: true
						}
					},
					questoes: {
						select: {
							id: true,
							texto: true
						}
					}
				}
			});

			return c.json(avaliacoes);
		} catch (error) {
			console.error('Erro ao listar avaliações:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar avaliação por ID
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const avaliacao = await prisma.avaliacao.findUnique({
				where: { id },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					conteudo: {
						select: {
							id: true,
							titulo: true
						}
					},
					trilha: {
						select: {
							id: true,
							nome: true
						}
					},
					questoes: {
						include: {
							alternativas: true
						}
					}
				}
			});

			if (!avaliacao) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			return c.json(avaliacao);
		} catch (error) {
			console.error('Erro ao buscar avaliação:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar nova avaliação
	async criar(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Validar dados obrigatórios
			if (!dados.titulo || !dados.descricao) {
				return c.json(
					{
						error:
							'Dados incompletos. Forneça título e descrição para a avaliação'
					},
					400
				);
			}

			// Validar relações opcionais (conteúdo, trilha ou etapa)
			if (!dados.conteudo_id && !dados.trilha_id && !dados.etapa_id) {
				return c.json(
					{
						error:
							'A avaliação precisa estar associada a um conteúdo, uma trilha ou uma etapa de desafio'
					},
					400
				);
			}

			// Verificar se o conteúdo existe, caso fornecido
			if (dados.conteudo_id) {
				const conteudoExiste = await prisma.conteudo.findUnique({
					where: { id: Number(dados.conteudo_id) }
				});

				if (!conteudoExiste) {
					return c.json({ error: 'Conteúdo não encontrado' }, 404);
				}
			}

			// Verificar se a trilha existe, caso fornecida
			if (dados.trilha_id) {
				const trilhaExiste = await prisma.trilhaAprendizagem.findUnique({
					where: { id: Number(dados.trilha_id) }
				});

				if (!trilhaExiste) {
					return c.json({ error: 'Trilha não encontrada' }, 404);
				}
			}

			// Verificar se a etapa existe, caso fornecida
			if (dados.etapa_id) {
				const etapaExiste = await prisma.desafioEtapa.findUnique({
					where: { id: Number(dados.etapa_id) }
				});

				if (!etapaExiste) {
					return c.json({ error: 'Etapa de desafio não encontrada' }, 404);
				}
			}

			// Criar a avaliação
			const novaAvaliacao = await prisma.avaliacao.create({
				data: {
					titulo: dados.titulo,
					descricao: dados.descricao,
					conteudo_id: dados.conteudo_id
						? Number(dados.conteudo_id)
						: undefined,
					trilha_id: dados.trilha_id ? Number(dados.trilha_id) : undefined,
					etapa_id: dados.etapa_id ? Number(dados.etapa_id) : undefined,
					gestor_id: gestorId
				},
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					conteudo: {
						select: {
							id: true,
							titulo: true
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

			return c.json(novaAvaliacao, 201);
		} catch (error) {
			console.error('Erro ao criar avaliação:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar avaliação existente
	async atualizar(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a avaliação existe
			const avaliacaoExistente = await prisma.avaliacao.findUnique({
				where: { id }
			});

			if (!avaliacaoExistente) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Validar relações opcionais (conteúdo, trilha ou etapa), se fornecidas
			if (dados.conteudo_id) {
				const conteudoExiste = await prisma.conteudo.findUnique({
					where: { id: Number(dados.conteudo_id) }
				});

				if (!conteudoExiste) {
					return c.json({ error: 'Conteúdo não encontrado' }, 404);
				}
			}

			if (dados.trilha_id) {
				const trilhaExiste = await prisma.trilhaAprendizagem.findUnique({
					where: { id: Number(dados.trilha_id) }
				});

				if (!trilhaExiste) {
					return c.json({ error: 'Trilha não encontrada' }, 404);
				}
			}

			if (dados.etapa_id) {
				const etapaExiste = await prisma.desafioEtapa.findUnique({
					where: { id: Number(dados.etapa_id) }
				});

				if (!etapaExiste) {
					return c.json({ error: 'Etapa de desafio não encontrada' }, 404);
				}
			}

			// Atualizar a avaliação
			const avaliacaoAtualizada = await prisma.avaliacao.update({
				where: { id },
				data: {
					titulo: dados.titulo,
					descricao: dados.descricao,
					conteudo_id: dados.conteudo_id
						? Number(dados.conteudo_id)
						: undefined,
					trilha_id: dados.trilha_id ? Number(dados.trilha_id) : undefined,
					etapa_id: dados.etapa_id ? Number(dados.etapa_id) : undefined
				},
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					},
					conteudo: {
						select: {
							id: true,
							titulo: true
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

			return c.json(avaliacaoAtualizada);
		} catch (error) {
			console.error('Erro ao atualizar avaliação:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir avaliação
	async excluir(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a avaliação existe
			const avaliacaoExistente = await prisma.avaliacao.findUnique({
				where: { id },
				include: {
					questoes: {
						include: {
							alternativas: true
						}
					}
				}
			});

			if (!avaliacaoExistente) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Excluir em cascata (questões e alternativas)
			await prisma.$transaction(async (tx) => {
				// Para cada questão, excluir suas alternativas e respostas
				for (const questao of avaliacaoExistente.questoes) {
					// Excluir respostas ligadas às alternativas da questão
					await tx.avaliacaoResposta.deleteMany({
						where: {
							alternativa: {
								questao_id: questao.id
							}
						}
					});

					// Excluir alternativas da questão
					await tx.alternativa.deleteMany({
						where: {
							questao_id: questao.id
						}
					});
				}

				// Excluir todas as questões da avaliação
				await tx.questao.deleteMany({
					where: {
						avaliacao_id: id
					}
				});

				// Por fim, excluir a avaliação
				await tx.avaliacao.delete({
					where: { id }
				});
			});

			return c.json({ message: 'Avaliação excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir avaliação:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// MÉTODOS PARA QUESTÕES

	// Listar questões de uma avaliação
	async listarQuestoes(c: Context): Promise<Response> {
		try {
			const avaliacaoId = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(avaliacaoId)) {
				return c.json({ error: 'ID de avaliação inválido' }, 400);
			}

			// Verificar se a avaliação existe
			const avaliacaoExistente = await prisma.avaliacao.findUnique({
				where: { id: avaliacaoId }
			});

			if (!avaliacaoExistente) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Buscar questões com suas alternativas
			const questoes = await prisma.questao.findMany({
				where: {
					avaliacao_id: avaliacaoId
				},
				include: {
					alternativas: true
				}
			});

			return c.json(questoes);
		} catch (error) {
			console.error('Erro ao listar questões:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar questão para uma avaliação
	async criarQuestao(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const avaliacaoId = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(avaliacaoId)) {
				return c.json({ error: 'ID de avaliação inválido' }, 400);
			}

			// Validar dados obrigatórios
			if (
				!dados.texto ||
				!Array.isArray(dados.alternativas) ||
				dados.alternativas.length < 2
			) {
				return c.json(
					{
						error:
							'Dados incompletos. Forneça texto e pelo menos duas alternativas'
					},
					400
				);
			}

			// Verificar se há pelo menos uma alternativa correta
			const temAlternativaCorreta = dados.alternativas.some(
				(alt: { correta: boolean }) => alt.correta === true
			);

			if (!temAlternativaCorreta) {
				return c.json(
					{
						error:
							'É necessário indicar pelo menos uma alternativa como correta'
					},
					400
				);
			}

			// Verificar se a avaliação existe
			const avaliacaoExistente = await prisma.avaliacao.findUnique({
				where: { id: avaliacaoId }
			});

			if (!avaliacaoExistente) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Criar a questão e suas alternativas em uma transação
			const novaQuestao = await prisma.$transaction(async (tx) => {
				// Criar a questão
				const questao = await tx.questao.create({
					data: {
						texto: dados.texto,
						avaliacao_id: avaliacaoId,
						gestor_id: gestorId
					}
				});

				// Criar as alternativas
				for (const alt of dados.alternativas) {
					await tx.alternativa.create({
						data: {
							questao_id: questao.id,
							texto: alt.texto,
							correta: alt.correta
						}
					});
				}

				// Recuperar a questão completa com suas alternativas
				return await tx.questao.findUnique({
					where: { id: questao.id },
					include: {
						alternativas: true
					}
				});
			});

			return c.json(novaQuestao, 201);
		} catch (error) {
			console.error('Erro ao criar questão:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar questão por ID
	async buscarQuestaoPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const questao = await prisma.questao.findUnique({
				where: { id },
				include: {
					alternativas: true,
					avaliacao: {
						select: {
							id: true,
							titulo: true
						}
					}
				}
			});

			if (!questao) {
				return c.json({ error: 'Questão não encontrada' }, 404);
			}

			return c.json(questao);
		} catch (error) {
			console.error('Erro ao buscar questão:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar questão
	async atualizarQuestao(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a questão existe
			const questaoExistente = await prisma.questao.findUnique({
				where: { id }
			});

			if (!questaoExistente) {
				return c.json({ error: 'Questão não encontrada' }, 404);
			}

			// Atualizar apenas o texto da questão
			const questaoAtualizada = await prisma.questao.update({
				where: { id },
				data: {
					texto: dados.texto
				},
				include: {
					alternativas: true
				}
			});

			return c.json(questaoAtualizada);
		} catch (error) {
			console.error('Erro ao atualizar questão:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir questão
	async excluirQuestao(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a questão existe
			const questaoExistente = await prisma.questao.findUnique({
				where: { id },
				include: {
					alternativas: true
				}
			});

			if (!questaoExistente) {
				return c.json({ error: 'Questão não encontrada' }, 404);
			}

			// Excluir em cascata (alternativas e respostas)
			await prisma.$transaction(async (tx) => {
				// Excluir respostas ligadas às alternativas desta questão
				await tx.avaliacaoResposta.deleteMany({
					where: {
						alternativa: {
							questao_id: id
						}
					}
				});

				// Excluir alternativas da questão
				await tx.alternativa.deleteMany({
					where: {
						questao_id: id
					}
				});

				// Por fim, excluir a questão
				await tx.questao.delete({
					where: { id }
				});
			});

			return c.json({ message: 'Questão excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir questão:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// MÉTODOS PARA ALTERNATIVAS

	// Listar alternativas de uma questão
	async listarAlternativas(c: Context): Promise<Response> {
		try {
			const questaoId = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(questaoId)) {
				return c.json({ error: 'ID de questão inválido' }, 400);
			}

			// Verificar se a questão existe
			const questaoExistente = await prisma.questao.findUnique({
				where: { id: questaoId }
			});

			if (!questaoExistente) {
				return c.json({ error: 'Questão não encontrada' }, 404);
			}

			// Buscar alternativas da questão
			const alternativas = await prisma.alternativa.findMany({
				where: {
					questao_id: questaoId
				}
			});

			return c.json(alternativas);
		} catch (error) {
			console.error('Erro ao listar alternativas:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar alternativa para uma questão
	async criarAlternativa(c: Context): Promise<Response> {
		try {
			const questaoId = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(questaoId)) {
				return c.json({ error: 'ID de questão inválido' }, 400);
			}

			// Validar dados obrigatórios
			if (!dados.texto || dados.correta === undefined) {
				return c.json(
					{
						error: 'Dados incompletos. Forneça texto e indique se é correta'
					},
					400
				);
			}

			// Verificar se a questão existe
			const questaoExistente = await prisma.questao.findUnique({
				where: { id: questaoId }
			});

			if (!questaoExistente) {
				return c.json({ error: 'Questão não encontrada' }, 404);
			}

			// Criar a alternativa
			const novaAlternativa = await prisma.alternativa.create({
				data: {
					texto: dados.texto,
					correta: dados.correta,
					questao_id: questaoId
				}
			});

			return c.json(novaAlternativa, 201);
		} catch (error) {
			console.error('Erro ao criar alternativa:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar alternativa
	async atualizarAlternativa(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a alternativa existe
			const alternativaExistente = await prisma.alternativa.findUnique({
				where: { id }
			});

			if (!alternativaExistente) {
				return c.json({ error: 'Alternativa não encontrada' }, 404);
			}

			// Atualizar a alternativa
			const alternativaAtualizada = await prisma.alternativa.update({
				where: { id },
				data: {
					texto: dados.texto,
					correta: dados.correta
				}
			});

			return c.json(alternativaAtualizada);
		} catch (error) {
			console.error('Erro ao atualizar alternativa:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir alternativa
	async excluirAlternativa(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se a alternativa existe
			const alternativaExistente = await prisma.alternativa.findUnique({
				where: { id }
			});

			if (!alternativaExistente) {
				return c.json({ error: 'Alternativa não encontrada' }, 404);
			}

			// Verificar se é a última alternativa da questão
			const contagem = await prisma.alternativa.count({
				where: {
					questao_id: alternativaExistente.questao_id
				}
			});

			if (contagem <= 2) {
				return c.json(
					{
						error:
							'Não é possível excluir, uma questão precisa ter pelo menos duas alternativas'
					},
					400
				);
			}

			// Excluir respostas ligadas a esta alternativa
			await prisma.$transaction(async (tx) => {
				// Excluir respostas
				await tx.avaliacaoResposta.deleteMany({
					where: {
						alternativa_id: id
					}
				});

				// Excluir a alternativa
				await tx.alternativa.delete({
					where: { id }
				});
			});

			return c.json({ message: 'Alternativa excluída com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir alternativa:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// MÉTODO PARA SUBMETER RESPOSTAS

	// Submeter resposta para uma avaliação
	async submeterRespostas(c: Context): Promise<Response> {
		try {
			const avaliacaoId = Number(c.req.param('id'));
			const { id: usuarioId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Verificar se o ID da avaliação é válido
			if (Number.isNaN(avaliacaoId)) {
				return c.json({ error: 'ID de avaliação inválido' }, 400);
			}

			// Validar dados obrigatórios
			if (!Array.isArray(dados.respostas) || dados.respostas.length === 0) {
				return c.json(
					{ error: 'É necessário fornecer ao menos uma resposta' },
					400
				);
			}

			// Verificar se a avaliação existe
			const avaliacao = await prisma.avaliacao.findUnique({
				where: { id: avaliacaoId },
				include: {
					questoes: {
						include: {
							alternativas: true
						}
					}
				}
			});

			if (!avaliacao) {
				return c.json({ error: 'Avaliação não encontrada' }, 404);
			}

			// Validar se todas as questões foram respondidas
			const respostasPorQuestao = new Map();
			for (const resposta of dados.respostas) {
				respostasPorQuestao.set(resposta.questao_id, resposta.alternativa_id);
			}

			if (respostasPorQuestao.size !== avaliacao.questoes.length) {
				return c.json(
					{ error: 'É necessário responder todas as questões da avaliação' },
					400
				);
			}

			// Calcular os resultados
			let acertos = 0;
			const totalQuestoes = avaliacao.questoes.length;
			interface AlternativaSelecionada {
				id: number;
				texto: string;
				correta: boolean;
			}

			interface DetalheResposta {
				questao_id: number;
				texto_questao: string;
				alternativa_selecionada: AlternativaSelecionada;
			}

			const resultado = {
				avaliacao_id: avaliacaoId,
				questoes_total: totalQuestoes,
				acertos: 0,
				percentual_acerto: 0,
				detalhes: [] as DetalheResposta[]
			};

			// Registrar as respostas e calcular pontuação
			const respostasRegistradas = await prisma.$transaction(async (tx) => {
				const respostas = [];

				for (const questao of avaliacao.questoes) {
					const alternativaId = respostasPorQuestao.get(questao.id);

					// Busca a alternativa selecionada
					const alternativa = questao.alternativas.find(
						(alt) => alt.id === alternativaId
					);

					if (!alternativa) {
						return c.json(
							{
								error: `Alternativa não encontrada para a questão ${questao.id}`
							},
							400
						);
					}

					// Registrar a resposta
					const resposta = await tx.avaliacaoResposta.create({
						data: {
							usuario_id: usuarioId,
							alternativa_id: alternativa.id,
							data_resposta: new Date()
						}
					});

					respostas.push(resposta);

					// Verificar se a resposta está correta
					if (alternativa.correta) {
						acertos++;
					}

					// Adicionar detalhes da resposta
					resultado.detalhes.push({
						questao_id: questao.id,
						texto_questao: questao.texto,
						alternativa_selecionada: {
							id: alternativa.id,
							texto: alternativa.texto,
							correta: alternativa.correta
						}
					});
				}

				// Se o conteúdo está associado à avaliação, marcar como assistido
				if (avaliacao.conteudo_id) {
					// Verificar se já existe registro
					const conteudoCheckExistente = await tx.conteudoCheck.findFirst({
						where: {
							usuario_id: usuarioId,
							conteudo_id: avaliacao.conteudo_id
						}
					});

					if (!conteudoCheckExistente) {
						await tx.conteudoCheck.create({
							data: {
								usuario_id: usuarioId,
								conteudo_id: avaliacao.conteudo_id,
								data_assistido: new Date()
							}
						});
					}
				}

				// Registrar pontuação proporcional ao percentual de acertos
				const percentualAcerto = (acertos / totalQuestoes) * 100;
				const pontos = Math.ceil(percentualAcerto); // 1 ponto para cada % de acerto

				await tx.pontuacao.create({
					data: {
						usuario_id: usuarioId,
						tipo_evento: 'AVALIACAO',
						referencia_id: avaliacaoId,
						pontos,
						data_evento: new Date(),
						descricao: `Avaliação '${avaliacao.titulo}' - ${percentualAcerto.toFixed(0)}% de acerto`
					}
				});

				// Atualizar pontos do usuário
				await tx.usuario.update({
					where: { id: usuarioId },
					data: {
						pontos: {
							increment: pontos
						}
					}
				});

				return respostas;
			});

			// Preparar resultado final
			resultado.acertos = acertos;
			resultado.percentual_acerto = (acertos / totalQuestoes) * 100;

			return c.json(resultado);
		} catch (error) {
			console.error('Erro ao submeter respostas:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

// Instância única para exportação
export const avaliacoesController = new AvaliacoesController();
