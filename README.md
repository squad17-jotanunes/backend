# Plataforma de Treinamento Jotanunes - Backend

Este repositório contém o código-fonte do backend da plataforma de treinamento online da Jotanunes Construtora.

## Visão Geral

O objetivo desta plataforma é padronizar conhecimentos, agilizar o onboarding de novos colaboradores e manter a equipe atualizada sobre processos e tecnologias internas.

## Tecnologias Principais

- **Backend Framework:** [Hono](https://hono.dev/) (executando em Node.js)
- **Banco de Dados:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Formatação/Linting:** [Biome](https://biomejs.dev/)
- **Infraestrutura (Planejada):** Docker/Kubernetes, Cloudflare CDN

## Configuração do Ambiente de Desenvolvimento

1.  **Clonar o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd backend
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto baseado no `.env.example` (se existir) ou adicione as seguintes variáveis:
    ```env
    DATABASE_URL="file:./dev.db"
    JWT_SECRET="SUA_CHAVE_SECRETA_AQUI"
    # Outras variáveis necessárias (ex: portas, configurações de serviços externos)
    ```
    *Substitua `USER`, `PASSWORD`, `HOST`, `PORT`, e `DATABASE` com as credenciais do seu banco de dados PostgreSQL.*

4.  **Executar Migrations do Prisma:**
    Certifique-se de que o banco de dados configurado no `DATABASE_URL` esteja acessível.
    ```bash
    npx prisma migrate dev
    ```
    Isso aplicará as migrações existentes e criará o banco de dados se ele não existir.

## Rodando o Projeto

Para iniciar o servidor de desenvolvimento (com hot-reload):

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000` (ou a porta configurada).

## Formatação e Linting

Este projeto utiliza o Biome para garantir a consistência do código. Para formatar e verificar o código:

```bash
npm run check

```

As configurações do Biome estão definidas no arquivo `biome.json`.

## Estrutura do Projeto (Simplificada)

```
.
├── prisma/           # Schema e migrações do banco de dados
│   └── schema.prisma
├── src/              # Código fonte da aplicação
│   ├── controllers/  # Lógica de requisição/resposta
│   ├── lib/          # Módulos reutilizáveis (ex: db client)
│   ├── middleware/   # Funções de middleware (ex: autenticação)
│   ├── routes/       # Definição das rotas da API
│   ├── app.ts        # Configuração principal do Hono
│   └── index.ts      # Ponto de entrada da aplicação
├── biome.json        # Configuração do Biome
├── package.json      # Dependências e scripts do Node.js
├── tsconfig.json     # Configuração do TypeScript
└── README.md         # Este arquivo
```

*(Esta é uma visão simplificada. Consulte o código para a estrutura completa.)*
