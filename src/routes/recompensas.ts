import { Hono } from 'hono';
import recompensasController from '../controllers/recompensasController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

const recompensasRoutes = new Hono();

// Middleware de autenticação para todas as rotas de recompensas
recompensasRoutes.use('*', verificarTokenJwt);

// Rotas públicas (para usuários autenticados)
recompensasRoutes.get(
	'/',
	recompensasController.listarRecompensas.bind(recompensasController)
);
recompensasRoutes.get(
	'/:id',
	recompensasController.buscarRecompensa.bind(recompensasController)
);
recompensasRoutes.post(
	'/:id/resgatar',
	recompensasController.resgatarRecompensa.bind(recompensasController)
);
recompensasRoutes.get(
	'/usuario/minhas',
	recompensasController.listarRecompensasUsuario.bind(recompensasController)
);
recompensasRoutes.get(
	'/saldo/moedas',
	recompensasController.obterSaldoMoedas.bind(recompensasController)
);

// Rotas para gestores
recompensasRoutes.post(
	'/',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.criarRecompensa.bind(recompensasController)
);
recompensasRoutes.put(
	'/:id',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.atualizarRecompensa.bind(recompensasController)
);
recompensasRoutes.delete(
	'/:id',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.excluirRecompensa.bind(recompensasController)
);
recompensasRoutes.get(
	'/usuario/:id',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.listarRecompensasUsuario.bind(recompensasController)
);
recompensasRoutes.get(
	'/saldo/usuario/:id',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.obterSaldoMoedas.bind(recompensasController)
);
recompensasRoutes.put(
	'/resgate/:id/status',
	verificarAutoridade(['gestor', 'admin']),
	recompensasController.alterarStatusResgate.bind(recompensasController)
);

export default recompensasRoutes;
