import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jotanunes_secret_key';

export const verificarTokenJwt = async (c: Context, next: Next) => {
	// Obter o token do cabeçalho Authorization
	const authHeader = c.req.header('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ error: 'Token não fornecido' }, 401);
	}

	const token = authHeader.substring(7); // Remover "Bearer " do token

	try {
		// Verificar e decodificar o token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Armazenar os dados do usuário no contexto para uso nas rotas
		c.set('jwtPayload', decoded);

		// Continuar para a próxima middleware ou rota
		await next();
	} catch (error: unknown) {
		if (error instanceof Error && error.name === 'TokenExpiredError') {
			return c.json({ error: 'Token expirado' }, 401);
		}
		return c.json({ error: 'Token inválido' }, 401);
	}
};
