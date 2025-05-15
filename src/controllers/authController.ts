import { compare } from 'bcrypt';
import type { Context } from 'hono';
import { sign } from 'hono/jwt';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/db';

// Configuração do segredo para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'jotanunes_secret_key';
const REFRESH_SECRET =
	process.env.REFRESH_SECRET || 'jotanunes_refresh_secret_key';

// Duração dos tokens
const ACCESS_TOKEN_EXPIRY = '1h'; // Token principal expira em 1 hora
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // Em segundos para o payload JWT
const REFRESH_TOKEN_EXPIRY = 30; // Refresh token expira em 30 dias
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000; // 30 dias em milissegundos

export class AuthController {
	// Método para login de usuários
	async login(c: Context): Promise<Response> {
		try {
			const { matricula, senha, manterSessao } = await c.req.json();

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

			// Calcular o tempo de expiração para o payload (em segundos desde a época UNIX)
			const expiresAt =
				Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_SECONDS;

			// Gerar token JWT usando Hono JWT
			const token = await sign(
				{
					id: usuario.id,
					matricula: usuario.matricula,
					nome: usuario.nome,
					autoridade: usuario.autoridade,
					exp: expiresAt // Tempo de expiração (em segundos desde a época UNIX)
				},
				JWT_SECRET
			);

			// Dados de resposta
			const resposta: {
				token: string;
				usuario: {
					id: number;
					nome: string;
					matricula: string;
					autoridade: string;
				};
				refreshToken?: string;
				tokenExpiry?: string;
				refreshTokenExpiry?: string;
			} = {
				token,
				usuario: {
					id: usuario.id,
					nome: usuario.nome,
					matricula: usuario.matricula,
					autoridade: usuario.autoridade
				}
			};

			// Se solicitado para manter sessão, gerar refresh token
			if (manterSessao) {
				// Gerar refresh token
				const refreshTokenString = randomBytes(40).toString('hex');
				const dataExpiracao = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

				// Salvar refresh token no banco de dados
				await prisma.refreshToken.create({
					data: {
						token: refreshTokenString,
						usuario_id: usuario.id,
						data_expiracao: dataExpiracao
					}
				});
				resposta.refreshToken = refreshTokenString;
				resposta.tokenExpiry = ACCESS_TOKEN_EXPIRY;
				resposta.refreshTokenExpiry = `${REFRESH_TOKEN_EXPIRY}d`;
			}

			// Retornar token e informações do usuário
			return c.json(resposta);
		} catch (error) {
			console.error('Erro ao realizar login:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Método para verificar autenticação
	async verificar(c: Context): Promise<Response> {
		return c.json({ autenticado: true, usuario: c.get('jwtPayload') });
	}

	// Método para renovar o token JWT usando um refresh token
	async refreshToken(c: Context): Promise<Response> {
		try {
			const { refreshToken } = await c.req.json();

			if (!refreshToken) {
				return c.json({ error: 'Refresh token não fornecido' }, 400);
			}

			// Verificar se o refresh token existe e é válido
			const tokenArmazenado = await prisma.refreshToken.findUnique({
				where: { token: refreshToken },
				include: { usuario: true }
			});

			// Verificar se o token existe
			if (!tokenArmazenado) {
				return c.json({ error: 'Refresh token inválido' }, 401);
			}

			// Verificar se o token está revogado
			if (tokenArmazenado.revogado) {
				return c.json({ error: 'Refresh token revogado' }, 401);
			}

			// Verificar se o token expirou
			if (new Date() > tokenArmazenado.data_expiracao) {
				return c.json({ error: 'Refresh token expirado' }, 401);
			}
			const usuario = tokenArmazenado.usuario;

			// Calcular o tempo de expiração para o payload (em segundos desde a época UNIX)
			const expiresAt =
				Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_SECONDS;

			// Gerar novo token JWT usando Hono JWT
			const novoToken = await sign(
				{
					id: usuario.id,
					matricula: usuario.matricula,
					nome: usuario.nome,
					autoridade: usuario.autoridade,
					exp: expiresAt // Tempo de expiração (em segundos desde a época UNIX)
				},
				JWT_SECRET
			);

			// Verificar se precisamos gerar um novo refresh token (opcional - rotação de tokens)
			// Para este exemplo, manteremos o mesmo refresh token

			return c.json({
				token: novoToken,
				usuario: {
					id: usuario.id,
					nome: usuario.nome,
					matricula: usuario.matricula,
					autoridade: usuario.autoridade
				},
				refreshToken: tokenArmazenado.token,
				tokenExpiry: ACCESS_TOKEN_EXPIRY
			});
		} catch (error) {
			console.error('Erro ao renovar token:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}

	// Método para fazer logout (revogar refresh token)
	async logout(c: Context): Promise<Response> {
		try {
			const { refreshToken } = await c.req.json();

			if (!refreshToken) {
				// Se não houver refresh token, o cliente provavelmente só precisa limpar o JWT localmente
				return c.json({ message: 'Logout realizado com sucesso' });
			}

			// Revogar o refresh token
			await prisma.refreshToken.updateMany({
				where: { token: refreshToken },
				data: { revogado: true }
			});

			return c.json({ message: 'Logout realizado com sucesso' });
		} catch (error) {
			console.error('Erro ao realizar logout:', error);
			return c.json({ error: 'Erro interno do servidor' }, 500);
		}
	}
}

// Exportar uma instância do controller
export const authController = new AuthController();
