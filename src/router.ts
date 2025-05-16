import { Hono } from 'hono';
import authRoutes from './routes/auth';
import avaliacoesRoutes from './routes/avaliacoes';
import certificadosRoutes from './routes/certificados';
import conteudosRoutes from './routes/conteudos';
import desafiosRoutes from './routes/desafios';
import modulosRoutes from './routes/modulos';
import recompensasRoutes from './routes/recompensas';
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
router.route('/avaliacoes', avaliacoesRoutes);
router.route('/certificados', certificadosRoutes);
router.route('/recompensas', recompensasRoutes);
router.route('/desafios', desafiosRoutes);

// Aqui podem ser adicionadas outras rotas no futuro:
// etc.

export default router;
