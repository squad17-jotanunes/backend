import { compare } from 'bcrypt';
import type { Context } from 'hono';
import { sign } from 'jsonwebtoken';
import { prisma } from '../lib/db';

// Configuração do segredo para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'jotanunes_secret_key';

export class AuthController {
	// Método para login de usuários
	async login(c: Context): Promise<Response> {
		try {
			const { matricula, senha } = await c.req.json();

			// Validar se matricula e senha foram fornecidos
			if (!matricula || !senha) {
				return c.json({ error: 'Matrícula e senha são obrigatórios' }, 400);
			}

			// Buscar usuário pela matrícula
			const usuario = await prisma.usuario.findUnique({
				where: { matricula }
			});

			// Verificar se o usuário existe
			if (!usuario) {
				return c.json({ error: 'Matrícula ou senha inválida' }, 401);
			}

			// Verificar a senha
			const senhaValida = await compare(senha, usuario.senha);
			if (!senhaValida) {
				return c.json({ error: 'Matrícula ou senha inválida' }, 401);
			}

			// Gerar token JWT
			const token = sign(
				{
					id: usuario.id,
					matricula: usuario.matricula,
					nome: usuario.nome,
					role: usuario.role
				},
				JWT_SECRET,
				{ expiresIn: '8h' }
			);

			// Retornar token e informações do usuário
			return c.json({
				token,
				usuario: {
					id: usuario.id,
					nome: usuario.nome,
					matricula: usuario.matricula,
					role: usuario.role
				}
			});
		} catch (error) {
			console.error('Erro ao realizar login:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Método para verificar autenticação
	async verificar(c: Context): Promise<Response> {
		return c.json({ autenticado: true, usuario: c.get('jwtPayload') });
	}
}

// Exportar uma instância do controller
export const authController = new AuthController();
