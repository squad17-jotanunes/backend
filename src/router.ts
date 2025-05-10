import { Hono } from 'hono';
import authRoutes from './routes/auth';
import conteudosRoutes from './routes/conteudos';
import modulosRoutes from './routes/modulos';
import trilhasRoutes from './routes/trilhas';
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
router.route('/modulos', modulosRoutes);
router.route('/conteudos', conteudosRoutes);
router.route('/trilhas', trilhasRoutes);

// Aqui podem ser adicionadas outras rotas no futuro:
// router.route("/avaliacoes", avaliacoesRoutes);
// router.route("/desafios", desafiosRoutes);
// etc.

export default router;
