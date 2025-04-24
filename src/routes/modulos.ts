import { Hono } from 'hono';
import { modulosController } from '../controllers/modulosController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const modulos = new Hono<{ Variables: Variables }>();

// Todas as rotas de módulos exigem autenticação
modulos.use('*', verificarTokenJwt);

// Rota para listar todos os módulos (acessível a todos os usuários autenticados)
modulos.get('/', (c) => modulosController.listarTodos(c));

// Rota para buscar módulo por ID (acessível a todos os usuários autenticados)
modulos.get('/:id', (c) => modulosController.buscarPorId(c));

// Rota para criar novo módulo (apenas gestores/admins)
modulos.post('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	modulosController.criar(c)
);

// Rota para atualizar módulo existente (apenas gestores/admins)
modulos.put('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	modulosController.atualizar(c)
);

// Rota para excluir módulo (apenas gestores/admins)
modulos.delete('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	modulosController.excluir(c)
);

export default modulos;
