import { Hono } from 'hono';
import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';

// Router principal que reunirá todas as rotas da aplicação
const router = new Hono();

// Rota inicial
router.get('/', (c) => {
	return c.json({ message: 'API de Treinamento Jotanunes' });
});

// Agrupando as rotas por domínio
router.route('/auth', authRoutes);
router.route('/usuarios', usuariosRoutes);

// Aqui podem ser adicionadas outras rotas no futuro:
// router.route("/modulos", modulosRoutes);
// router.route("/conteudos", conteudosRoutes);
// router.route("/trilhas", trilhasRoutes);
// etc.

export default router;
