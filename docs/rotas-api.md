# Documentação de API - Sistema de Treinamento Jotanunes

## Tecnologias Utilizadas
- **Backend**: Node.js com Hono
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL

## Convenções da API

- Todas as rotas autenticadas requerem o header `Authorization: Bearer {token}`
- As respostas seguem o formato JSON
- Códigos HTTP padrão são utilizados (200, 201, 400, 401, 403, 404, 500)
- Paginação é suportada via query params `?page=1&limit=10`

## 1. Autenticação e Usuários

### Autenticação

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `POST` | `/auth/login` | Autenticar usuários | Público |
| `GET` | `/auth/verificar` | Verificar token JWT | Autenticado |

**Exemplo de requisição para login:**
```json
{
  "matricula": "12345",
  "senha": "senha123"
}
```

**Exemplo de resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "matricula": "12345",
    "setor": "Engenharia",
    "role": "COLABORADOR",
    "pontos": 150
  }
}
```

### Usuários

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/usuarios` | Listar todos os usuários | Gestor |
| `GET` | `/usuarios/:id` | Obter detalhes de um usuário | Gestor ou Próprio Usuário |
| `POST` | `/usuarios` | Criar novo usuário | Gestor |
| `PUT` | `/usuarios/:id` | Atualizar usuário | Gestor ou Próprio Usuário |
| `DELETE` | `/usuarios/:id` | Remover usuário | Gestor |
| `GET` | `/usuarios/perfil` | Obter perfil do usuário logado | Autenticado |

**Exemplo de corpo para criação de usuário:**
```json
{
  "nome": "João Silva",
  "matricula": "12345",
  "senha": "senha123",
  "setor": "Engenharia",
  "role": "COLABORADOR"
}
```

## 2. Módulos

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/modulos` | Listar todos os módulos | Autenticado |
| `GET` | `/modulos/:id` | Obter detalhes de um módulo | Autenticado |
| `POST` | `/modulos` | Criar novo módulo | Gestor |
| `PUT` | `/modulos/:id` | Atualizar módulo | Gestor |
| `DELETE` | `/modulos/:id` | Remover módulo | Gestor |

**Exemplo de corpo para criação de módulo:**
```json
{
  "titulo": "Segurança no Trabalho",
  "descricao": "Fundamentos de segurança para o canteiro de obras",
  "duracao_estimada": 120,
  "gestor_id": 1
}
```

## 3. Conteúdos (Lições)

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/conteudos` | Listar todos os conteúdos | Autenticado |
| `GET` | `/conteudos/modulo/:moduloId` | Listar conteúdos por módulo | Autenticado |
| `GET` | `/conteudos/:id` | Obter detalhes de um conteúdo | Autenticado |
| `POST` | `/conteudos` | Criar novo conteúdo | Gestor |
| `PUT` | `/conteudos/:id` | Atualizar conteúdo | Gestor |
| `DELETE` | `/conteudos/:id` | Remover conteúdo | Gestor |
| `POST` | `/conteudos/:id/marcar-assistido` | Marcar conteúdo como assistido | Autenticado |

**Exemplo de corpo para criação de conteúdo:**
```json
{
  "titulo": "Uso correto de EPI",
  "descricao": "Aprenda a utilizar equipamentos de proteção individual",
  "url_video": "https://storage.jotanunes.com/videos/epi-uso.mp4",
  "url_pdf": "https://storage.jotanunes.com/pdfs/manual-epi.pdf",
  "moduloId": 1,
  "duracao": 15,
  "gestor_id": 1
}
```

**Exemplo de corpo para marcar como assistido:**
```json
{
  "usuario_id": 1,
  "conteudo_id": 3
}
```

## 4. Quizzes e Questões

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/quizzes` | Listar todos os quizzes | Autenticado |
| `GET` | `/quizzes/conteudo/:conteudoId` | Obter quiz de um conteúdo | Autenticado |
| `GET` | `/quizzes/:id` | Obter quiz com questões e alternativas | Autenticado |
| `POST` | `/quizzes` | Criar novo quiz | Gestor |
| `PUT` | `/quizzes/:id` | Atualizar quiz | Gestor |
| `DELETE` | `/quizzes/:id` | Remover quiz | Gestor |
| `POST` | `/quizzes/:id/responder` | Submeter respostas ao quiz | Autenticado |
| `POST` | `/questoes` | Criar nova questão | Gestor |
| `PUT` | `/questoes/:id` | Atualizar questão | Gestor |
| `DELETE` | `/questoes/:id` | Remover questão | Gestor |

**Exemplo de corpo para criação de quiz:**
```json
{
  "titulo": "Quiz sobre EPIs",
  "descricao": "Teste seus conhecimentos",
  "conteudoId": 1,
  "pontos": 50,
  "gestor_id": 1
}
```

**Exemplo de corpo para criação de questão e alternativas:**
```json
{
  "quizId": 1,
  "texto": "Qual EPI deve ser utilizado para proteção da cabeça?",
  "alternativas": [
    {
      "texto": "Capacete de segurança",
      "correta": true
    },
    {
      "texto": "Luvas de borracha",
      "correta": false
    },
    {
      "texto": "Protetor auricular",
      "correta": false
    }
  ]
}
```

**Exemplo de corpo para responder quiz:**
```json
{
  "usuario_id": 1,
  "quiz_id": 1,
  "respostas": [
    {
      "questao_id": 1,
      "alternativa_id": 1
    },
    {
      "questao_id": 2,
      "alternativa_id": 5
    }
  ]
}
```

## 5. Trilhas de Aprendizagem

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/trilhas` | Listar todas as trilhas | Autenticado |
| `GET` | `/trilhas/:id` | Obter detalhes de uma trilha | Autenticado |
| `POST` | `/trilhas` | Criar nova trilha | Gestor |
| `PUT` | `/trilhas/:id` | Atualizar trilha | Gestor |
| `DELETE` | `/trilhas/:id` | Remover trilha | Gestor |
| `POST` | `/trilhas/:id/modulos` | Adicionar módulo a uma trilha | Gestor |
| `DELETE` | `/trilhas/:id/modulos/:moduloId` | Remover módulo de uma trilha | Gestor |
| `GET` | `/trilhas/:id/progresso` | Obter progresso do usuário em uma trilha | Autenticado |

**Exemplo de corpo para criação de trilha:**
```json
{
  "titulo": "Preparação para Campo",
  "descricao": "Trilha completa para preparação de trabalho em campo",
  "pontos_conclusao": 500,
  "gestor_id": 1
}
```

**Exemplo de corpo para adicionar módulo a uma trilha:**
```json
{
  "modulo_id": 1,
  "ordem": 1
}
```

## 6. Desafios

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/desafios` | Listar todos os desafios | Autenticado |
| `GET` | `/desafios/:id` | Obter detalhes de um desafio | Autenticado |
| `POST` | `/desafios` | Criar novo desafio | Gestor |
| `PUT` | `/desafios/:id` | Atualizar desafio | Gestor |
| `DELETE` | `/desafios/:id` | Remover desafio | Gestor |
| `POST` | `/desafios/:id/etapas` | Adicionar etapa a um desafio | Gestor |
| `DELETE` | `/desafios/:id/etapas/:etapaId` | Remover etapa de um desafio | Gestor |
| `GET` | `/desafios/:id/progresso` | Ver progresso em um desafio | Autenticado |

**Exemplo de corpo para criação de desafio:**
```json
{
  "titulo": "Desafio de Segurança",
  "descricao": "Complete todas as etapas de segurança",
  "pontos_conclusao": 300,
  "gestor_id": 1
}
```

**Exemplo de corpo para adicionar etapa a um desafio:**
```json
{
  "quiz_id": 1,
  "ordem": 1,
  "pontos": 100
}
```

## 7. Gamificação (Pontos e Moedas)

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/pontuacao/:usuarioId` | Obter pontuação de um usuário | Autenticado |
| `GET` | `/moedas/:usuarioId` | Obter moedas de um usuário | Autenticado |
| `GET` | `/ranking` | Obter ranking de pontuação | Autenticado |

**Exemplo de resposta de ranking:**
```json
[
  {
    "usuario_id": 1,
    "nome": "João Silva",
    "pontos": 1250,
    "setor": "Engenharia",
    "posicao": 1
  },
  {
    "usuario_id": 3,
    "nome": "Maria Oliveira",
    "pontos": 980,
    "setor": "Arquitetura",
    "posicao": 2
  }
]
```

## 8. Certificados

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/certificados/usuario/:id` | Listar certificados de um usuário | Autenticado |
| `GET` | `/certificados/:id` | Obter detalhes de um certificado | Autenticado |
| `GET` | `/certificados/:id/download` | Baixar certificado em PDF | Autenticado |

**Exemplo de resposta de certificados do usuário:**
```json
[
  {
    "id": 1,
    "trilha_id": 2,
    "usuario_id": 1,
    "titulo_trilha": "Preparação para Campo",
    "nome_usuario": "João Silva",
    "data_emissao": "2025-03-15T14:30:00Z",
    "url_download": "/certificados/1/download"
  }
]
```

## 9. Recompensas

| Método | Rota | Descrição | Permissões |
|--------|------|-----------|------------|
| `GET` | `/recompensas` | Listar recompensas disponíveis | Autenticado |
| `GET` | `/recompensas/:id` | Obter detalhes de uma recompensa | Autenticado |
| `POST` | `/recompensas` | Criar nova recompensa | Gestor |
| `PUT` | `/recompensas/:id` | Atualizar recompensa | Gestor |
| `DELETE` | `/recompensas/:id` | Remover recompensa | Gestor |
| `POST` | `/recompensas/:id/resgatar` | Resgatar uma recompensa | Autenticado |
| `GET` | `/recompensas/usuario/:id` | Listar recompensas resgatadas pelo usuário | Autenticado |

**Exemplo de corpo para criação de recompensa:**
```json
{
  "titulo": "Vale Café",
  "descricao": "Vale um café na cafeteria do prédio",
  "custo_moedas": 50,
  "quantidade_disponivel": 20,
  "gestor_id": 1
}
```

**Exemplo de corpo para resgate de recompensa:**
```json
{
  "usuario_id": 1,
  "recompensa_id": 3
}
```

## Implementação com Hono e Prisma

### Exemplo de rota de autenticação

```typescript
// routes/auth.ts
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();
const auth = new Hono();

auth.post('/login', async (c) => {
  const { matricula, senha } = await c.req.json();
  
  const usuario = await prisma.uSUARIOS.findUnique({
    where: { matricula }
  });
  
  if (!usuario) {
    return c.json({ error: 'Usuário não encontrado' }, 404);
  }
  
  const senhaValida = await compare(senha, usuario.senha);
  
  if (!senhaValida) {
    return c.json({ error: 'Senha inválida' }, 401);
  }
  
  const token = sign(
    { id: usuario.id, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  
  return c.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      matricula: usuario.matricula,
      setor: usuario.setor,
      role: usuario.role,
      pontos: usuario.pontos
    }
  });
});

export default auth;
```

## Considerações sobre Implementação

1. **Middlewares**: Implementar middlewares para autenticação (verificar JWT) e autorização (verificar permissões)
2. **Validação de Entrada**: Utilizar bibliotecas como Zod ou Joi para validar entrada de dados
3. **Logs**: Adicionar logs para monitoramento de atividades
4. **Tratamento de Erros**: Implementar tratamento global de erros
5. **Cache**: Considerar cache para endpoints frequentemente acessados
6. **Upload de Arquivos**: Implementar rotas específicas para upload de vídeos e PDFs