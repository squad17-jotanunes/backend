import { Hono } from 'hono';
import { authController } from '../controllers/authController';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const auth = new Hono<{ Variables: Variables }>();

// Rota de login
auth.post('/login', (c) => authController.login(c));

// Rota para verificar se o token é válido
auth.get('/verificar', verificarTokenJwt, (c) => authController.verificar(c));

export default auth;
