# Instruções para o GitHub Copilot - Plataforma de Treinamento Jotanunes

## Visão Geral do Projeto

O objetivo é desenvolver uma plataforma de treinamento online para a Jotanunes Construtora, visando padronizar conhecimentos, agilizar o onboarding e manter os colaboradores atualizados.

## Tecnologias Principais

- **Backend:** Node.js com Hono
- **Banco de Dados:** PostgreSQL (gerenciado via Prisma ORM)
- **Frontend:** (Não especificado, mas a UI deve ser responsiva)
- **Infraestrutura:** Docker/K8s, CDN (Cloudflare)
- **Formatação/Linting:** Biome

## Estrutura do Banco de Dados (Resumo do Diagrama ER)

O banco de dados modela entidades como:

- `USUARIOS`: Colaboradores e Gestores, com informações de perfil, pontos e autoridade.
- `MODULOS`, `CONTEUDOS`, `TRILHAS_APRENDIZAGEM`, `ITEM_TRILHA`: Estrutura do material de treinamento (vídeos, PDFs, ordem).
- `AVALIACAO`, `QUESTOES`, `ALTERNATIVAS`, `AVALIACAO_RESPOSTAS`: Sistema de quizzes e provas.
- `DESAFIOS`, `DESAFIO_ETAPAS`: Desafios gamificados com etapas e avaliações.
- `PONTUACAO`, `MOEDAS`: Sistema de gamificação (pontos por performance, moedas para loja).
- `RECOMPENSAS`, `USUARIO_RECOMPENSAS`: Loja de recompensas e resgates.
- `CONTEUDO_CHECK`, `TRILHA_PROGRESSO_USUARIO`: Rastreamento do progresso do usuário.
- `CERTIFICADOS`: Emissão de certificados após conclusão e aprovação.

**Relacionamentos Chave:**

- Gestores (`USUARIOS`) criam `MODULOS`, `CONTEUDOS`, `AVALIACAO`, `QUESTOES`, `RECOMPENSAS`, `DESAFIOS`.
- `TRILHAS_APRENDIZAGEM` são compostas por `MODULOS` através de `ITEM_TRILHA`.
- `CONTEUDOS` podem ter `AVALIACAO`.
- `USUARIOS` assistem `CONTEUDOS` (`CONTEUDO_CHECK`), respondem `AVALIACAO` (`AVALIACAO_RESPOSTAS`), acumulam `PONTUACAO` e `MOEDAS`, progridem em `TRILHAS_APRENDIZAGEM` (`TRILHA_PROGRESSO_USUARIO`), recebem `CERTIFICADOS` e resgatam `RECOMPENSAS` (`USUARIO_RECOMPENSAS`).
- `DESAFIOS` são compostos por `DESAFIO_ETAPAS`, que podem ter `AVALIACAO`.

## Funcionalidades Principais

- **Catálogo de Conteúdos:** Vídeo-aulas, PDFs, organizados em Módulos e Trilhas.
- **Avaliações:** Quizzes por aula e Prova Final obrigatória por trilha.
- **Desafios Gamificados:** Missões independentes com quizzes e recompensas bônus.
- **Gamificação:** Sistema de pontos (performance) e moedas (loja), com ranking.
- **Certificação:** Emissão automática de certificados PDF.
- **Loja de Recompensas:** Troca de moedas por itens.
- **Painel do Gestor:** CRUD completo para todo o conteúdo e acompanhamento de progresso.
- **Relatórios:** Exportação de dados e integração via API/Webhooks.

## Fluxos de Usuário

- **Colaborador:** Login -> Escolhe trilha -> Assiste aulas/faz quizzes -> Ganha pontos/moedas -> Conclui trilha -> Faz Prova Final -> Recebe certificado -> Participa de desafios -> Troca moedas na loja.
- **Gestor:** Cria/edita conteúdo (módulos, aulas, provas, desafios, recompensas) -> Acompanha dashboards -> Exporta relatórios.

## Requisitos Não Funcionais Importantes

- **Segurança:** Autenticação, papéis (colaborador, gestor, admin), MFA opcional.
- **Usabilidade:** UI responsiva.
- **Escalabilidade:** Arquitetura preparada para contêineres.
- **Auditoria/LGPD:** Logs de acesso, consentimento, anonimização.
- **Performance:** Metas de TTFB e tempo de carregamento.

## Estilo de Código e Convenções

- Seguir as regras definidas no `biome.json` (indentação com tabs, aspas simples, ponto e vírgula sempre, etc.).
- Manter a consistência com o código existente.
- Usar Prisma Client para todas as interações com o banco de dados.
- Estruturar o código em controllers, routes, lib, middleware conforme o padrão atual.
