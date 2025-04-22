# Documentação - Plataforma de Treinamento Jotanunes (Backend)

## 1. Visão Geral

Este documento descreve a arquitetura, funcionalidades e o roadmap de desenvolvimento do backend da plataforma de treinamento da Jotanunes Construtora. O objetivo é criar um sistema robusto e escalável para gerenciar conteúdos, usuários, progresso, gamificação e certificações.

## 2. Tecnologias Principais

- **Framework:** Hono (Node.js)
- **Banco de Dados:** PostgreSQL (via SQLite no desenvolvimento)
- **ORM:** Prisma
- **Autenticação:** JWT (JSON Web Tokens)
- **Formatação/Linting:** Biome

## 3. Estado Atual (Abril de 2025)

### Funcionalidades Implementadas

- **Estrutura Base do Projeto:** Configuração inicial com Hono, TypeScript, Prisma e Biome.
- **Modelo de Dados:** Schema Prisma definido em `prisma/schema.prisma` cobrindo as principais entidades (Usuários, Módulos, Conteúdos, Trilhas, Avaliações, etc.). Ver `diagram.md` para o diagrama ER.
- **Autenticação:**
  - Rota de Login (`/auth/login`): Valida matrícula e senha, retorna JWT.
  - Rota de Verificação (`/auth/verificar`): Valida um token JWT existente (requer middleware de autenticação).
- **CRUD Usuários:**
  - Listar todos os usuários (`/usuarios` - GET, requer gestor/admin).
  - Buscar usuário por ID (`/usuarios/{id}` - GET, requer próprio usuário ou gestor/admin).
  - Criar novo usuário (`/usuarios` - POST, requer gestor/admin).
  - Atualizar usuário existente (`/usuarios/{id}` - PUT, requer próprio usuário ou gestor/admin).
  - Excluir usuário (`/usuarios/{id}` - DELETE, requer gestor/admin).
- **Middlewares de Autorização:**
  - `verificarTokenJwt`: Verifica a validade do token JWT em rotas protegidas.
  - `verificarAutoridade`: Verifica se o usuário tem o papel necessário (e.g., 'gestor', 'admin') para acessar a rota.
  - `verificarAcessoPerfil`: Controla o acesso a rotas de perfil de usuário (próprio usuário ou gestor/admin).
- **Configuração Inicial do Servidor:** `src/index.ts` configura o servidor Hono e o CORS.
- **Roteamento Básico:** `src/router.ts` define a estrutura inicial de rotas, incluindo `/auth` e `/usuarios`.

### Arquivos Principais

- `prisma/schema.prisma`: Define a estrutura do banco de dados.
- `src/index.ts`: Ponto de entrada da aplicação, configuração do servidor.
- `src/app.ts`: Instância principal do Hono (atualmente mínima).
- `src/router.ts`: Roteador principal da aplicação.
- `src/routes/auth.ts`: Rotas específicas de autenticação.
- `src/routes/usuarios.ts`: Rotas específicas de usuários.
- `src/controllers/authController.ts`: Lógica de negócio para autenticação.
- `src/controllers/usuariosController.ts`: Lógica de negócio para CRUD de usuários.
- `src/middleware/verificarTokenJwt.ts`: Middleware para validação de token JWT.
- `src/middleware/verificarAutoridade.ts`: Middleware para verificação de papel.
- `src/middleware/verificarAcessoPerfil.ts`: Middleware para controle de acesso a perfis.
- `src/lib/db.ts`: Instância do Prisma Client.

## 4. Roadmap / Funcionalidades Pendentes

### Prioridade Alta (Essencial para MVP)

1. **CRUD Usuários:**
   - Criação de usuários (provavelmente por um gestor ou admin).
   - Leitura (listar todos, buscar por ID/matrícula).
   - Atualização de dados do usuário.
   - Exclusão (ou desativação) de usuários.
   - Definição de papéis (colaborador, gestor, admin) e controle de acesso baseado neles.
2. **CRUD Módulos:** Rotas e controllers para criar, ler, atualizar e deletar módulos.
3. **CRUD Conteúdos:** Rotas e controllers para adicionar, visualizar, editar e remover conteúdos (vídeos, PDFs) dentro dos módulos.
4. **CRUD Trilhas de Aprendizagem:** Rotas e controllers para criar, ler, atualizar e deletar trilhas.
5. **Associação Módulo-Trilha:** Lógica para adicionar/remover módulos de uma trilha (`ItemTrilha`).
6. **Rastreamento de Progresso Básico:**
   - Marcar conteúdo como assistido (`ConteudoCheck`).
   - Calcular e armazenar progresso na trilha (`TrilhaProgressoUsuario`).
7. **Sistema de Avaliação (Básico):**
   - CRUD Avaliações (associadas a Conteúdos).
   - CRUD Questões e Alternativas.
   - Submissão de Respostas (`AvaliacaoRespostas`).
   - Cálculo de nota (lógica a ser definida).

### Prioridade Média (Funcionalidades Core)

1. **Gamificação (Pontos e Moedas):**
   - Lógica para atribuir pontos/moedas ao assistir conteúdo, completar módulos/trilhas, acertar avaliações.
   - Tabelas `Pontuacao` e `Moedas`.
   - Atualização dos pontos/moedas no perfil do `Usuario`.
2. **Certificação:**
   - Lógica para verificar conclusão e aprovação em trilhas.
   - Geração/emissão de `Certificados` (pode ser apenas o registro no DB inicialmente).
3. **Painel do Gestor (Endpoints):** Endpoints específicos para gestores gerenciarem todo o conteúdo e visualizarem progresso dos usuários.
4. **CRUD Desafios e Etapas:** Rotas e controllers para gerenciar desafios gamificados.
5. **Avaliações em Desafios:** Associar `Avaliacao` a `DesafioEtapa`.

### Prioridade Baixa (Melhorias e Funcionalidades Adicionais)

1. **Loja de Recompensas:**
   - CRUD Recompensas.
   - Lógica para resgate (`UsuarioRecompensa`) usando moedas.
2. **Relatórios:** Endpoints para exportar dados de progresso, pontuações, etc.
3. **Melhorias de Segurança:** MFA (Multi-Factor Authentication), logs de auditoria detalhados.
4. **Otimizações de Performance:** Indexação de banco de dados, caching.
5. **Integrações:** Webhooks ou APIs para sistemas externos.

## 5. API Endpoints (Planejados)

- `/auth/login` (POST) - **Implementado**
- `/auth/verificar` (GET) - **Implementado** (requer token)
- `/usuarios` (GET) - **Implementado** (requer gestor/admin)
- `/usuarios` (POST) - **Implementado** (requer gestor/admin)
- `/usuarios/{id}` (GET) - **Implementado** (requer próprio usuário ou gestor/admin)
- `/usuarios/{id}` (PUT) - **Implementado** (requer próprio usuário ou gestor/admin)
- `/usuarios/{id}` (DELETE) - **Implementado** (requer gestor/admin)
- `/modulos` (GET, POST)
- `/modulos/{id}` (GET, PUT, DELETE)
- `/conteudos` (GET, POST) - (Filtrar por módulo?)
- `/conteudos/{id}` (GET, PUT, DELETE)
- `/trilhas` (GET, POST)
- `/trilhas/{id}` (GET, PUT, DELETE)
- `/trilhas/{trilhaId}/modulos` (POST, DELETE) - (Gerenciar `ItemTrilha`)
- `/conteudos/{conteudoId}/check` (POST) - (Marcar como assistido)
- `/usuarios/{usuarioId}/progresso/trilhas/{trilhaId}` (GET)
- `/avaliacoes` (GET, POST)
- `/avaliacoes/{id}` (GET, PUT, DELETE)
- `/avaliacoes/{avaliacaoId}/questoes` (GET, POST)
- `/questoes/{id}` (GET, PUT, DELETE)
- `/questoes/{questaoId}/alternativas` (GET, POST)
- `/alternativas/{id}` (GET, PUT, DELETE)
- `/avaliacoes/{avaliacaoId}/respostas` (POST) - (Submeter respostas)
- ... (Endpoints para desafios, recompensas, certificados, etc.)

## 6. Próximos Passos Imediatos

1. Implementar o CRUD para `Modulos`.
2. Implementar o CRUD para `Conteudos`.
3. Implementar o CRUD para `Trilhas de Aprendizagem`.
4. Implementar a associação Módulo-Trilha (`ItemTrilha`).
5. Implementar o rastreamento de progresso básico (`ConteudoCheck`, `TrilhaProgressoUsuario`).
