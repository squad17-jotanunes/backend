import { Hono } from 'hono';
import { usuariosController } from '../controllers/usuariosController';
import { verificarAcessoPerfil } from '../middleware/verificarAcessoPerfil';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const usuarios = new Hono<{ Variables: Variables }>();

// Todas as rotas de usuários exigem autenticação
usuarios.use('*', verificarTokenJwt);

// Rota para listar todos os usuários (apenas gestores/admins)
usuarios.get('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	usuariosController.listarTodos(c)
);

// Rota para buscar usuário por ID (próprio perfil ou gestor/admin)
usuarios.get('/:id', verificarAcessoPerfil, (c) =>
	usuariosController.buscarPorId(c)
);

// Rota para criar novo usuário (apenas gestores/admins)
usuarios.post('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	usuariosController.criar(c)
);

// Rota para atualizar usuário existente (próprio perfil ou gestor/admin)
usuarios.put('/:id', verificarAcessoPerfil, (c) =>
	usuariosController.atualizar(c)
);

// Rota para excluir usuário (apenas gestores/admins)
usuarios.delete('/:id', verificarAutoridade(['gestor', 'admin']), (c) =>
	usuariosController.excluir(c)
);

export default usuarios;
