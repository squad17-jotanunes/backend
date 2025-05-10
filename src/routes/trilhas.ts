import { Hono } from 'hono';
import { trilhasController } from '../controllers/trilhasController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const trilhas = new Hono<{ Variables: Variables }>();

// Todas as rotas de trilhas exigem autenticação
trilhas.use('*', verificarTokenJwt);

// Rota para listar todas as trilhas (acessível a todos os usuários autenticados)
trilhas.get('/', (c) => trilhasController.listarTodas(c));

// Rota para buscar trilha por ID (acessível a todos os usuários autenticados)
trilhas.get('/:id', (c) => trilhasController.buscarPorId(c));

// Rota para criar nova trilha (apenas gestores/admins)
trilhas.post('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	trilhasController.criar(c)
);

// Rota para atualizar trilha existente (apenas gestores/admins)
trilhas.put('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	trilhasController.atualizar(c)
);

// Rota para excluir trilha (apenas gestores/admins)
trilhas.delete('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	trilhasController.excluir(c)
);

// Rota para iniciar uma trilha (todos os usuários autenticados)
trilhas.post('/:id/iniciar', (c) => trilhasController.iniciarTrilha(c));

// Rota para obter o progresso em uma trilha (todos os usuários autenticados)
trilhas.get('/:id/progresso', (c) => trilhasController.obterProgresso(c));

export default trilhas;
