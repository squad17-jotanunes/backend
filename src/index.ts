import { serve } from '@hono/node-server';
import { hash } from 'bcrypt';
import { app } from './app';
import { prisma } from './lib/db';

// Iniciar servidor
const port = process.env.PORT || 3000;
console.log(`Servidor rodando na porta ${port}`);
const usuariosCount = await prisma.usuario.count();
if (usuariosCount === 0) {
	// Criar um usuário padrão
	await prisma.usuario.create({
		data: {
			nome: 'Admin',
			matricula: '1',
			senha: await hash('admin', 10),
			setor: 'Administração',
			autoridade: 'ADMIN'
		}
	});
}
serve({
	fetch: app.fetch,
	port: Number(port)
});

export default app;
