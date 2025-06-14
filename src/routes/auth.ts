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

// Rota para obter dados do usuário autenticado
auth.get('/me', verificarTokenJwt, (c) => authController.me(c));

// Rota para renovar o token usando refresh token
auth.post('/refresh', (c) => authController.refreshToken(c));

// Rota para realizar logout (revogando refresh token)
auth.post('/logout', (c) => authController.logout(c));

export default auth;
