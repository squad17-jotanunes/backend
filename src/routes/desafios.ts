import { Hono } from 'hono';
import desafiosController from '../controllers/desafiosController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

const desafiosRoutes = new Hono();

// Middleware de autenticação para todas as rotas de desafios
desafiosRoutes.use('*', verificarTokenJwt);

// Rotas públicas (para usuários autenticados)
desafiosRoutes.get(
	'/',
	desafiosController.listarDesafios.bind(desafiosController)
);
desafiosRoutes.get(
	'/:id',
	desafiosController.buscarDesafio.bind(desafiosController)
);
desafiosRoutes.get(
	'/:id/etapas',
	desafiosController.listarEtapasDesafio.bind(desafiosController)
);

// Rotas para gestores
desafiosRoutes.post(
	'/',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.criarDesafio.bind(desafiosController)
);
desafiosRoutes.put(
	'/:id',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.atualizarDesafio.bind(desafiosController)
);
desafiosRoutes.delete(
	'/:id',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.excluirDesafio.bind(desafiosController)
);

// Rotas para etapas de desafios
desafiosRoutes.post(
	'/:id/etapas',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.criarEtapaDesafio.bind(desafiosController)
);
desafiosRoutes.put(
	'/etapas/:id',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.atualizarEtapaDesafio.bind(desafiosController)
);
desafiosRoutes.delete(
	'/etapas/:id',
	verificarAutoridade(['gestor', 'admin']),
	desafiosController.excluirEtapaDesafio.bind(desafiosController)
);

export default desafiosRoutes;
