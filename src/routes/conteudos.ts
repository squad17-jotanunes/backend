import { Hono } from 'hono';
import { conteudosController } from '../controllers/conteudosController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const conteudos = new Hono<{ Variables: Variables }>();

// Todas as rotas de conteúdos exigem autenticação
conteudos.use('*', verificarTokenJwt);

// Rota para listar todos os conteúdos (acessível a todos os usuários autenticados)
conteudos.get('/', (c) => conteudosController.listarTodos(c));

// Rota para buscar conteúdo por ID (acessível a todos os usuários autenticados)
conteudos.get('/:id', (c) => conteudosController.buscarPorId(c));

// Rota para listar conteúdos por módulo (acessível a todos os usuários autenticados)
conteudos.get('/modulo/:moduloId', (c) =>
	conteudosController.listarPorModulo(c)
);

// Rota para criar novo conteúdo (apenas gestores/admins)
conteudos.post('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	conteudosController.criar(c)
);

// Rota para atualizar conteúdo existente (apenas gestores/admins)
conteudos.put('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	conteudosController.atualizar(c)
);

// Rota para excluir conteúdo (apenas gestores/admins)
conteudos.delete('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	conteudosController.excluir(c)
);

// Rota para marcar conteúdo como assistido (para todos os usuários autenticados)
conteudos.post('/:id/assistir', (c) => conteudosController.marcarAssistido(c));

export default conteudos;
