import { Hono } from 'hono';
import { authController } from '../controllers/authController';
import { jwt } from '../middleware/jwt';

type Variables = {
	jwtPayload: string;
};

const auth = new Hono<{ Variables: Variables }>();

// Rota de login
auth.post('/login', (c) => authController.login(c));

// Rota para verificar se o token é válido
auth.get('/verificar', jwt(), (c) => authController.verificar(c));

export default auth;
