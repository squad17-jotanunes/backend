import { Hono } from 'hono';
import { certificadosController } from '../controllers/certificadosController';
import { verificarAcessoPerfil } from '../middleware/verificarAcessoPerfil';
import { verificarAutoridade } from '../middleware/verificarAutoridade';
import { verificarTokenJwt } from '../middleware/verificarTokenJwt';

type Variables = {
	jwtPayload: string;
};

const certificados = new Hono<{ Variables: Variables }>();

// Todas as rotas de certificados exigem autenticação
certificados.use('*', verificarTokenJwt);

// Rota para listar todos os certificados (apenas gestores/admins)
certificados.get('/', verificarAutoridade(['gestor', 'admin']), (c) =>
	certificadosController.listarTodos(c)
);

// Rota para buscar certificados de um usuário específico
certificados.get(
	'/usuario/:id',
	verificarAcessoPerfil, // Permite acesso ao próprio usuário ou gestor/admin
	(c) => certificadosController.listarPorUsuario(c)
);

// Rota para buscar um certificado específico por ID
certificados.get('/:id', (c) => certificadosController.buscarPorId(c));

// Rota para emitir certificado para uma trilha concluída (qualquer usuário autenticado)
certificados.post('/emitir/:trilhaId', (c) => certificadosController.emitir(c));

// Rota para gerar e baixar o PDF de um certificado
certificados.get('/:id/download', (c) => certificadosController.downloadPDF(c));

export default certificados;
