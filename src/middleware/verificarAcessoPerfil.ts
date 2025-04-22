import type { Context, Next } from 'hono';

/**
 * Middleware para verificar acesso ao perfil de um usuário
 * Permite que qualquer usuário acesse seu próprio perfil
 * Permite que gestores e admins acessem qualquer perfil
 */
export const verificarAcessoPerfil = async (c: Context, next: Next) => {
	try {
		const idPerfilSolicitado = Number(c.req.param('id'));
		const { id: idUsuarioAutenticado, autoridade } = c.get('jwtPayload') as {
			id: number;
			autoridade: string;
		};

		// Verifica se o ID é válido
		if (Number.isNaN(idPerfilSolicitado)) {
			return c.json({ error: 'ID de perfil inválido' }, 400);
		}

		// Permite acesso se for o próprio perfil ou se for gestor/admin
		const acessoPermitido =
			idUsuarioAutenticado === idPerfilSolicitado ||
			autoridade === 'gestor' ||
			autoridade === 'admin';

		if (!acessoPermitido) {
			return c.json({ error: 'Não autorizado a acessar este perfil' }, 403);
		}

		// Se o acesso for permitido, prossegue para o controlador
		await next();
	} catch (error) {
		console.error('Erro ao verificar acesso ao perfil:', error);
		return c.json({ error: 'Erro ao processar a solicitação' }, 500);
	}
};
