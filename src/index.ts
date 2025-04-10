import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import router from './router';

const app = new Hono();

// Middleware global
app.use(cors());

// Aplicar todas as rotas definidas no router
app.route('/', router);

// Iniciar servidor
const port = process.env.PORT || 3000;
console.log(`Servidor rodando na porta ${port}`);
serve({
	fetch: app.fetch,
	port: Number(port)
});

export default app;
