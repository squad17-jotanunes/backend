import { Hono } from 'hono';
import { avaliacoesController } from '../controllers/avaliacoesController';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const avaliacoes = new Hono<{ Variables: Variables }>();

// Todas as rotas de avaliações exigem autenticação
avaliacoes.use('*', verificarTokenJwt);

// ROTAS PARA AVALIAÇÕES

// Rota para listar todas as avaliações (acessível a todos os usuários autenticados)
avaliacoes.get('/', (c) => avaliacoesController.listarTodas(c));

// Rota para buscar avaliação por ID (acessível a todos os usuários autenticados)
avaliacoes.get('/:id', (c) => avaliacoesController.buscarPorId(c));

// Rota para criar nova avaliação (apenas gestores/admins)
avaliacoes.post('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	avaliacoesController.criar(c)
);

// Rota para atualizar avaliação existente (apenas gestores/admins)
avaliacoes.put('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	avaliacoesController.atualizar(c)
);

// Rota para excluir avaliação (apenas gestores/admins)
avaliacoes.delete('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	avaliacoesController.excluir(c)
);

// Rota para submeter respostas de uma avaliação (todos os autenticados)
avaliacoes.post('/:id/responder', (c) =>
	avaliacoesController.submeterRespostas(c)
);

// ROTAS PARA QUESTÕES

// Listar questões de uma avaliação
avaliacoes.get('/:id/questoes', (c) => avaliacoesController.listarQuestoes(c));

// Criar nova questão para uma avaliação (apenas gestores/admins)
avaliacoes.post(
	'/:id/questoes',
	verificarAutoridade(['gestor', 'admin']),
	(c) => avaliacoesController.criarQuestao(c)
);

// ROTAS PARA ALTERNATIVAS

// Criar nova alternativa para uma questão (apenas gestores/admins)
avaliacoes.post(
	'/questoes/:id/alternativas',
	verificarAutoridade(['gestor', 'admin']),
	(c) => avaliacoesController.criarAlternativa(c)
);

// Atualizar uma questão (apenas gestores/admins)
avaliacoes.put('/questoes/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	avaliacoesController.atualizarQuestao(c)
);

// Excluir uma questão (apenas gestores/admins)
avaliacoes.delete(
	'/questoes/:id',
	verificarAutoridade(['gestor', 'admin']),
	(c) => avaliacoesController.excluirQuestao(c)
);

// Listar alternativas de uma questão
avaliacoes.get('/questoes/:id/alternativas', (c) =>
	avaliacoesController.listarAlternativas(c)
);

// Atualizar uma alternativa (apenas gestores/admins)
avaliacoes.put(
	'/alternativas/:id',
	verificarAutoridade(['gestor', 'admin']),
	(c) => avaliacoesController.atualizarAlternativa(c)
);

// Excluir uma alternativa (apenas gestores/admins)
avaliacoes.delete(
	'/alternativas/:id',
	verificarAutoridade(['gestor', 'admin']),
	(c) => avaliacoesController.excluirAlternativa(c)
);

export default avaliacoes;
