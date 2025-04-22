import type { Context, Next } from 'hono';

type Autoridade = 'colaborador' | 'gestor' | 'admin';

/**
 * Middleware para verificar se o usuário possui a autoridade necessária para acessar a rota
 * @param autoridades - Lista de autoridades que podem acessar a rota
 */
export const verificarAutoridade = (autoridades: Autoridade[]) => {
	return async (c: Context, next: Next) => {
		// Verifica se o payload JWT está presente no contexto (middleware verifyJwtToken deve ser executado antes)
		const jwtPayload = c.get('jwtPayload');

		if (!jwtPayload || !jwtPayload.autoridade) {
			return c.json(
				{ error: 'Dados de autenticação inválidos ou incompletos' },
				403
			);
		}

		const { autoridade } = jwtPayload as { autoridade: string };

		// Verifica se a autoridade do usuário está na lista de autoridades permitidas
		if (!autoridades.includes(autoridade as Autoridade)) {
			return c.json(
				{
					error: 'Acesso não autorizado. Você não tem permissão para esta ação.'
				},
				403
			);
		}

		// Se a autoridade for válida, continua para o próximo middleware ou controlador
		await next();
	};
};
