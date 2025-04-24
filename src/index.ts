import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

// Iniciar servidor
const port = process.env.PORT || 3000;
console.log(`Servidor rodando na porta ${port}`);
serve({
	fetch: app.fetch,
	port: Number(port)
});

export default app;
