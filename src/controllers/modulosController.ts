import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class ModulosController {
	// Listar todos os módulos
	async listarTodos(c: Context): Promise<Response> {
		try {
			const modulos = await prisma.modulo.findMany({
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			return c.json(modulos);
		} catch (error) {
			console.error('Erro ao listar módulos:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar módulo por ID
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const modulo = await prisma.modulo.findUnique({
				where: { id },
				include: {
					gestor: {
						select: {
							id: true,
							nome: true
						}
					}
				}
			});

			if (!modulo) {
				return c.json({ error: 'Módulo não encontrado' }, 404);
			}

			return c.json(modulo);
		} catch (error) {
			console.error('Erro ao buscar módulo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar novo módulo
	async criar(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Validar dados obrigatórios
			if (!dados.nome || !dados.descricao) {
				return c.json({ error: 'Nome e descrição são obrigatórios' }, 400);
			}

			// Criar o módulo
			const novoModulo = await prisma.modulo.create({
				data: {
					nome: dados.nome,
					descricao: dados.descricao,
					gestor_id: gestorId
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

			return c.json(novoModulo, 201);
		} catch (error) {
			console.error('Erro ao criar módulo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar módulo existente
	async atualizar(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o módulo existe
			const moduloExistente = await prisma.modulo.findUnique({
				where: { id }
			});

			if (!moduloExistente) {
				return c.json({ error: 'Módulo não encontrado' }, 404);
			}

			// Preparar dados para atualização
			const dadosAtualizacao: Partial<{
				nome: string;
				descricao: string;
			}> = {};

			if (dados.nome) dadosAtualizacao.nome = dados.nome;
			if (dados.descricao) dadosAtualizacao.descricao = dados.descricao;

			// Atualizar o módulo
			const moduloAtualizado = await prisma.modulo.update({
				where: { id },
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

			return c.json(moduloAtualizado);
		} catch (error) {
			console.error('Erro ao atualizar módulo:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir módulo
	async excluir(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o módulo existe
			const moduloExistente = await prisma.modulo.findUnique({
				where: { id }
			});

			if (!moduloExistente) {
				return c.json({ error: 'Módulo não encontrado' }, 404);
			}

			// Excluir módulo
			await prisma.modulo.delete({ where: { id } });

			return c.json({ message: 'Módulo excluído com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir módulo:', error);

			interface PrismaError {
				code: string;
				meta?: unknown;
				message: string;
			}

			// Verificar se é um erro de restrição de chave estrangeira
			if (typeof error === 'object' && error !== null && 'code' in error) {
				// Erro de chave estrangeira (código P2003 no Prisma)
				if ((error as PrismaError).code === 'P2003') {
					return c.json(
						{
							error:
								'Não é possível excluir este módulo, pois há registros associados a ele'
						},
						409
					);
				}
			}

			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

// Exportar uma instância do controller
export const modulosController = new ModulosController();
