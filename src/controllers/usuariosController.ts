import { hash } from 'bcrypt';
import type { Context } from 'hono';
import { prisma } from '../lib/db';

export class UsuariosController {
	// Listar todos os usuários
	async listarTodos(c: Context): Promise<Response> {
		try {
			// Buscar todos os usuários (excluindo a senha por segurança)
			const usuarios = await prisma.usuario.findMany({
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

			return c.json(usuarios);
		} catch (error) {
			console.error('Erro ao listar usuários:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Buscar usuário por ID
	async buscarPorId(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			const usuario = await prisma.usuario.findUnique({
				where: { id },
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

			if (!usuario) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}

			return c.json(usuario);
		} catch (error) {
			console.error('Erro ao buscar usuário:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Criar novo usuário
	async criar(c: Context): Promise<Response> {
		try {
			const { id: gestorId } = c.get('jwtPayload') as { id: number };
			const dados = await c.req.json();

			// Validar dados obrigatórios
			if (
				!dados.nome ||
				!dados.matricula ||
				!dados.senha ||
				!dados.setor ||
				!dados.autoridade
			) {
				return c.json({ error: 'Dados incompletos' }, 400);
			}

			// Verificar se já existe usuário com a mesma matrícula
			const usuarioExistente = await prisma.usuario.findUnique({
				where: { matricula: dados.matricula }
			});

			if (usuarioExistente) {
				return c.json({ error: 'Matrícula já cadastrada' }, 409);
			}

			// Hash da senha
			const senhaHash = await hash(dados.senha, 10);

			// Criar o usuário
			const novoUsuario = await prisma.usuario.create({
				data: {
					nome: dados.nome,
					matricula: dados.matricula,
					senha: senhaHash,
					setor: dados.setor,
					autoridade: dados.autoridade,
					gestor_id: gestorId // Registra qual gestor criou o usuário
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

			return c.json(novoUsuario, 201);
		} catch (error) {
			console.error('Erro ao criar usuário:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Atualizar usuário existente
	async atualizar(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));
			const dados = await c.req.json();

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o usuário existe
			const usuarioExistente = await prisma.usuario.findUnique({
				where: { id }
			});
			if (!usuarioExistente) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}

			// Preparar dados para atualização
			const dadosAtualizacao: Partial<{
				nome: string;
				matricula: string;
				senha: string;
				setor: string;
				autoridade: string;
			}> = {};

			// Campos que qualquer usuário pode atualizar em seu próprio perfil
			if (dados.nome) dadosAtualizacao.nome = dados.nome;
			if (dados.setor) dadosAtualizacao.setor = dados.setor;

			// Senha requer hash se fornecida
			if (dados.senha) {
				dadosAtualizacao.senha = await hash(dados.senha, 10);
			}

			// Campos que apenas gestores/admin podem alterar
			if (dados.autoridade) {
				dadosAtualizacao.autoridade = dados.autoridade;
			}

			if (dados.matricula) {
				// Verificar se a nova matrícula já existe (exceto para o próprio usuário)
				if (dados.matricula !== usuarioExistente.matricula) {
					const matriculaExistente = await prisma.usuario.findUnique({
						where: { matricula: dados.matricula }
					});

					if (matriculaExistente) {
						return c.json({ error: 'Matrícula já cadastrada' }, 409);
					}
				}
				dadosAtualizacao.matricula = dados.matricula;
			}

			// Atualizar o usuário
			const usuarioAtualizado = await prisma.usuario.update({
				where: { id },
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

			return c.json(usuarioAtualizado);
		} catch (error) {
			console.error('Erro ao atualizar usuário:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Excluir usuário
	async excluir(c: Context): Promise<Response> {
		try {
			const id = Number(c.req.param('id'));

			// Verificar se o ID é um número válido
			if (Number.isNaN(id)) {
				return c.json({ error: 'ID inválido' }, 400);
			}

			// Verificar se o usuário existe
			const usuarioExistente = await prisma.usuario.findUnique({
				where: { id }
			});
			if (!usuarioExistente) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}

			// Excluir usuário
			await prisma.usuario.delete({ where: { id } });

			return c.json({ message: 'Usuário excluído com sucesso' });
		} catch (error) {
			console.error('Erro ao excluir usuário:', error);

			// Interface para tipar o erro do Prisma
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
								'Não é possível excluir este usuário, pois há registros associados a ele'
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
export const usuariosController = new UsuariosController();
