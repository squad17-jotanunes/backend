# Documentação - Plataforma de Treinamento Jotanunes (Backend)

## 1. Visão Geral

Este documento descreve a arquitetura, funcionalidades e o roadmap de desenvolvimento do backend da plataforma de treinamento da Jotanunes Construtora. O objetivo é criar um sistema robusto e escalável para gerenciar conteúdos, usuários, progresso, gamificação e certificações.

## 2. Tecnologias Principais

- **Framework:** Hono (Node.js)
- **Banco de Dados:** PostgreSQL (via SQLite no desenvolvimento)
- **ORM:** Prisma
- **Autenticação:** JWT (JSON Web Tokens)
- **Formatação/Linting:** Biome

## 3. Estado Atual (Maio de 2025)

### Funcionalidades Implementadas

- **Estrutura Base do Projeto:** Configuração inicial com Hono, TypeScript, Prisma e Biome.
- **Modelo de Dados:** Schema Prisma definido em `prisma/schema.prisma` cobrindo as principais entidades (Usuários, Módulos, Conteúdos, Trilhas, Avaliações, etc.). Ver `diagram.md` para o diagrama ER.
- **Autenticação:**
  - Rota de Login (`/auth/login`): Valida matrícula e senha, retorna JWT.
  - Rota de Verificação (`/auth/verificar`): Valida um token JWT existente (requer middleware de autenticação).
  - Rota de Refresh Token (`/auth/refresh`): Renova o token JWT usando refresh token.
  - Rota de Logout (`/auth/logout`): Revoga refresh token.
- **CRUD Usuários:**
  - Listar todos os usuários (`/usuarios` - GET, requer gestor/admin).
  - Buscar usuário por ID (`/usuarios/{id}` - GET, requer próprio usuário ou gestor/admin).
  - Criar novo usuário (`/usuarios` - POST, requer gestor/admin).
  - Atualizar usuário existente (`/usuarios/{id}` - PUT, requer próprio usuário ou gestor/admin).
  - Excluir usuário (`/usuarios/{id}` - DELETE, requer gestor/admin).
- **CRUD Módulos:**
  - Listar todos os módulos (`/modulos` - GET).
  - Buscar módulo por ID (`/modulos/{id}` - GET).
  - Criar novo módulo (`/modulos` - POST, requer gestor/admin).
  - Atualizar módulo existente (`/modulos/{id}` - PUT, requer gestor/admin).
  - Excluir módulo (`/modulos/{id}` - DELETE, requer gestor/admin).
- **CRUD Conteúdos:**
  - Listar todos os conteúdos (`/conteudos` - GET).
  - Buscar conteúdo por ID (`/conteudos/{id}` - GET).
  - Listar conteúdos por módulo (`/conteudos/modulo/{moduloId}` - GET).
  - Criar novo conteúdo (`/conteudos` - POST, requer gestor/admin).
  - Atualizar conteúdo existente (`/conteudos/{id}` - PUT, requer gestor/admin).
  - Excluir conteúdo (`/conteudos/{id}` - DELETE, requer gestor/admin).
  - Marcar conteúdo como assistido (`/conteudos/{id}/assistir` - POST).
- **CRUD Trilhas de Aprendizagem:**
  - Listar todas as trilhas (`/trilhas` - GET).
  - Buscar trilha por ID (`/trilhas/{id}` - GET).
  - Criar nova trilha (`/trilhas` - POST, requer gestor/admin).
  - Atualizar trilha existente (`/trilhas/{id}` - PUT, requer gestor/admin).
  - Excluir trilha (`/trilhas/{id}` - DELETE, requer gestor/admin).
- **Gestão de Progresso:**
  - Iniciar trilha para usuário (`/trilhas/{id}/iniciar` - POST).
  - Obter progresso do usuário em uma trilha (`/trilhas/{id}/progresso` - GET).
  - Atribuição de pontos ao assistir conteúdos.
- **Middlewares de Autorização:**
  - `verificarTokenJwt`: Verifica a validade do token JWT em rotas protegidas.
  - `verificarAutoridade`: Verifica se o usuário tem o papel necessário (e.g., 'gestor', 'admin') para acessar a rota.
  - `verificarAcessoPerfil`: Controla o acesso a rotas de perfil de usuário (próprio usuário ou gestor/admin).
- **Configuração Inicial do Servidor:** `src/index.ts` configura o servidor Hono e o CORS.
- **Roteamento Básico:** `src/router.ts` define a estrutura inicial de rotas, incluindo `/auth`, `/usuarios`, `/modulos`, `/conteudos`, `/trilhas` e `/avaliacoes`.

### Arquivos Principais

- `prisma/schema.prisma`: Define a estrutura do banco de dados.
- `src/index.ts`: Ponto de entrada da aplicação, configuração do servidor.
- `src/app.ts`: Instância principal do Hono (atualmente mínima).
- `src/router.ts`: Roteador principal da aplicação.
- `src/routes/auth.ts`: Rotas específicas de autenticação.
- `src/routes/usuarios.ts`: Rotas específicas de usuários.
- `src/routes/modulos.ts`: Rotas específicas de módulos.
- `src/routes/conteudos.ts`: Rotas específicas de conteúdos.
- `src/routes/trilhas.ts`: Rotas específicas de trilhas.
- `src/controllers/authController.ts`: Lógica de negócio para autenticação.
- `src/controllers/usuariosController.ts`: Lógica de negócio para CRUD de usuários.
- `src/controllers/modulosController.ts`: Lógica de negócio para CRUD de módulos.
- `src/controllers/conteudosController.ts`: Lógica de negócio para CRUD de conteúdos.
- `src/controllers/trilhasController.ts`: Lógica de negócio para trilhas de aprendizagem e progresso.
- `src/routes/avaliacoes.ts`: Rotas específicas de avaliações.
- `src/controllers/avaliacoesController.ts`: Lógica de negócio para CRUD de avaliações, questões e alternativas.
- `src/middleware/verificarTokenJwt.ts`: Middleware para validação de token JWT.
- `src/middleware/verificarAutoridade.ts`: Middleware para verificação de papel.
- `src/middleware/verificarAcessoPerfil.ts`: Middleware para controle de acesso a perfis.
- `src/lib/db.ts`: Instância do Prisma Client.

## 4. Roadmap / Funcionalidades Pendentes

### Prioridade Alta (Essencial para MVP)

1. ✅ **CRUD Conteúdos:** Rotas e controllers para adicionar, visualizar, editar e remover conteúdos (vídeos, PDFs) dentro dos módulos.
2. ✅ **CRUD Trilhas de Aprendizagem:** Rotas e controllers para criar, ler, atualizar e deletar trilhas.
3. ✅ **Associação Módulo-Trilha:** Lógica para adicionar/remover módulos de uma trilha (`ItemTrilha`).
4. ✅ **Rastreamento de Progresso Básico:**
   - Marcar conteúdo como assistido (`ConteudoCheck`).
   - Calcular e armazenar progresso na trilha (`TrilhaProgressoUsuario`).
5. ✅ **Sistema de Avaliação (Básico):**
   - CRUD Avaliações (associadas a Conteúdos).
   - CRUD Questões e Alternativas.
   - Submissão de Respostas (`AvaliacaoRespostas`).
   - Cálculo de nota (percentual de alternativas corretas).

### Prioridade Média (Funcionalidades Core)

1. ✅ **Gamificação (Pontos e Moedas):**
   - ✅ Lógica para atribuir pontos ao assistir conteúdo (implementado).
   - ✅ Lógica para atribuir pontos/moedas ao acertar avaliações (implementado).
   - ✅ Lógica para atribuir pontos/moedas ao completar módulos/trilhas (implementado).
   - ✅ Tabela `Pontuacao` (implementado).
   - ✅ Tabela `Moedas` (implementado).
   - ✅ Atualização dos pontos no perfil do `Usuario` (implementado).
2. ✅ **Certificação:**
   - ✅ Lógica para verificar conclusão e aprovação em trilhas (implementado no método `obterProgresso`).
   - ✅ Geração/emissão de `Certificados` (implementado).
3. ✅ **Painel do Gestor (Endpoints):** Os endpoints existentes já suportam as principais ações de gestão de conteúdo.
4. ✅ **CRUD Desafios e Etapas:** Rotas e controllers para gerenciar desafios gamificados (implementado).
5. ✅ **Avaliações em Desafios:** Associar `Avaliacao` a `DesafioEtapa` (implementado).

### Prioridade Baixa (Melhorias e Funcionalidades Adicionais)

1. ✅ **Loja de Recompensas:**
   - ✅ CRUD Recompensas (implementado).
   - ✅ Lógica para resgate (`UsuarioRecompensa`) usando moedas (implementado).
2. **Relatórios:** Endpoints para exportar dados de progresso, pontuações, etc.
3. **Melhorias de Segurança:** MFA (Multi-Factor Authentication), logs de auditoria detalhados.
4. **Otimizações de Performance:** Indexação de banco de dados, caching.
5. **Integrações:** Webhooks ou APIs para sistemas externos.

## 5. API Endpoints (Implementados e Planejados)

### Implementados

- **Autenticação:**
  - `/auth/login` (POST)
  - `/auth/verificar` (GET) - requer token
  - `/auth/refresh` (POST) - requer refresh token
  - `/auth/logout` (POST) - revoga refresh token

- **Usuários:**
  - `/usuarios` (GET) - requer gestor/admin
  - `/usuarios` (POST) - requer gestor/admin
  - `/usuarios/{id}` (GET) - requer próprio usuário ou gestor/admin
  - `/usuarios/{id}` (PUT) - requer próprio usuário ou gestor/admin
  - `/usuarios/{id}` (DELETE) - requer gestor/admin

- **Módulos:**
  - `/modulos` (GET)
  - `/modulos` (POST) - requer gestor/admin
  - `/modulos/{id}` (GET)
  - `/modulos/{id}` (PUT) - requer gestor/admin
  - `/modulos/{id}` (DELETE) - requer gestor/admin

- **Conteúdos:**
  - `/conteudos` (GET)
  - `/conteudos` (POST) - requer gestor/admin
  - `/conteudos/{id}` (GET)
  - `/conteudos/{id}` (PUT) - requer gestor/admin
  - `/conteudos/{id}` (DELETE) - requer gestor/admin
  - `/conteudos/modulo/{moduloId}` (GET) - conteúdos de um módulo específico
  - `/conteudos/{id}/assistir` (POST) - marcar como assistido

- **Trilhas:**
  - `/trilhas` (GET)
  - `/trilhas` (POST) - requer gestor/admin
  - `/trilhas/{id}` (GET)
  - `/trilhas/{id}` (PUT) - requer gestor/admin
  - `/trilhas/{id}` (DELETE) - requer gestor/admin
  - `/trilhas/{id}/iniciar` (POST) - iniciar trilha para o usuário autenticado
  - `/trilhas/{id}/progresso` (GET) - obter progresso do usuário autenticado

- **Avaliações:**
  - `/avaliacoes` (GET)
  - `/avaliacoes` (POST) - requer gestor/admin
  - `/avaliacoes/{id}` (GET)
  - `/avaliacoes/{id}` (PUT) - requer gestor/admin
  - `/avaliacoes/{id}` (DELETE) - requer gestor/admin
  - `/avaliacoes/{id}/responder` (POST) - submeter respostas de avaliação
  - `/avaliacoes/{id}/questoes` (GET) - listar questões de uma avaliação
  - `/avaliacoes/{id}/questoes` (POST) - criar questão para avaliação (requer gestor/admin)
  - `/questoes/{id}` (PUT) - atualizar questão (requer gestor/admin)
  - `/questoes/{id}` (DELETE) - excluir questão (requer gestor/admin)
  - `/questoes/{id}/alternativas` (GET) - listar alternativas de uma questão
  - `/questoes/{id}/alternativas` (POST) - criar alternativa para questão (requer gestor/admin)
  - `/alternativas/{id}` (PUT) - atualizar alternativa (requer gestor/admin)
  - `/alternativas/{id}` (DELETE) - excluir alternativa (requer gestor/admin)

- **Certificados:**
  - `/certificados` (GET) - listar todos os certificados (requer gestor/admin)
  - `/certificados/usuario/:id` (GET) - listar certificados de um usuário específico
  - `/certificados/:id` (GET) - obter detalhes de um certificado específico
  - `/certificados/emitir/:trilhaId` (POST) - emitir certificado para uma trilha concluída
  - `/certificados/:id/download` (GET) - gerar e baixar o PDF do certificado

- **Desafios:**
  - `/desafios` (GET)
  - `/desafios` (POST) - requer gestor/admin
  - `/desafios/{id}` (GET)
  - `/desafios/{id}` (PUT) - requer gestor/admin
  - `/desafios/{id}` (DELETE) - requer gestor/admin
  - `/desafios/{id}/etapas` (GET)
  - `/desafios/{id}/etapas` (POST) - requer gestor/admin
  - `/desafios/etapas/{id}` (PUT) - requer gestor/admin
  - `/desafios/etapas/{id}` (DELETE) - requer gestor/admin

- **Recompensas:**
  - `/recompensas` (GET)
  - `/recompensas` (POST) - requer gestor/admin
  - `/recompensas/{id}` (GET)
  - `/recompensas/{id}` (PUT) - requer gestor/admin
  - `/recompensas/{id}` (DELETE) - requer gestor/admin
  - `/recompensas/{id}/resgatar` (POST)
  - `/recompensas/usuario/minhas` (GET) - recompensas do usuário autenticado
  - `/recompensas/usuario/{id}` (GET) - recompensas de um usuário específico (requer gestor/admin)
  - `/recompensas/saldo/moedas` (GET) - saldo de moedas do usuário autenticado
  - `/recompensas/saldo/usuario/{id}` (GET) - saldo de moedas de um usuário específico (requer gestor/admin)
  - `/recompensas/resgate/{id}/status` (PUT) - alterar status de um resgate (requer gestor/admin)

## 6. Próximos Passos Imediatos

1. ✅ Implementar o CRUD para `Conteudos`. (Concluído)
2. ✅ Implementar o CRUD para `Trilhas de Aprendizagem`. (Concluído)
3. ✅ Implementar a associação Módulo-Trilha (`ItemTrilha`). (Concluído)
4. ✅ Implementar o rastreamento de progresso básico (`ConteudoCheck`, `TrilhaProgressoUsuario`). (Concluído)
5. ✅ Implementar o Sistema de Avaliação (CRUD Avaliações, Questões e Alternativas). (Concluído)
6. ✅ Desenvolver a funcionalidade completa de Certificados. (Concluído)
7. ✅ Implementar a funcionalidade de lógica de resgate de Moedas para a loja de recompensas. (Concluído)
8. ✅ Desenvolver o sistema de Desafios e Etapas. (Concluído)
