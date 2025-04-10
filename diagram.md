```
erDiagram
    USUARIOS {
      integer id "PK - Identificador único do usuário"
      varchar nome "Nome completo do usuário"
      varchar matricula "Matrícula do usuário"
      varchar senha "Senha do usuário"
      varchar setor "Setor do usuário"
      integer pontos "Pontos do usuário"
      varchar funcao "Função do usuário no sistema (ex.: colaborador, gestor)"
    }
    MODULOS {
      integer id "PK - Identificador único do módulo"
      varchar nome "Nome do módulo"
      text descricao "Descrição detalhada do módulo"
      integer gestor_id "FK - Referência ao usuário gestor que criou o módulo"
    }
    CONTEUDOS {
      integer id "PK - Identificador único da aula/conteúdo"
      integer modulo_id "FK - Referência ao módulo"
      varchar tipo "Tipo do conteúdo (video)"
      varchar titulo "Título da aula/conteúdo"
      text descricao "Descrição do conteúdo"
      text url_video "URL para acesso ao vídeo"
      text url_pdf "URL para leitura complementar (PDF, opcional)"
      integer ordem "Ordem de apresentação dentro do módulo"
      integer gestor_id "FK - Referência ao usuário gestor que criou o conteúdo"
    }
    TRILHAS_APRENDIZAGEM {
      integer id "PK - Identificador único da trilha de aprendizagem"
      varchar nome "Nome da trilha de aprendizagem"
      text descricao "Descrição da trilha de aprendizagem"
      integer gestor_id "FK - Referência ao usuário gestor que criou a trilha"
    }
    TRILHA_MODULOS {
      integer id "PK - Identificador único da associação trilha-conteúdo"
      integer trilha_id "FK - Referência à trilha de aprendizagem"
      integer conteudo_id "FK - Referência ao conteúdo (aula/vídeo)"
      integer ordem "Ordem de apresentação do conteúdo na trilha"
    }
    CONTEUDO_CHECK {
      integer id "PK - Identificador único do registro de vídeo assistido"
      integer usuario_id "FK - Referência ao usuário"
      integer conteudo_id "FK - Referência ao conteúdo (vídeo assistido)"
      datetime data_assistido "Data e hora do registro (timestamp)"
    }
    QUIZ {
      integer id "PK - Identificador único do quiz"
      integer conteudo_id "FK - Referência ao conteúdo (aula/vídeo)"
      varchar titulo "Título do quiz"
      text descricao "Descrição do quiz"
      integer gestor_id "FK - Referência ao usuário gestor que criou o quiz"
    }
    QUESTOES {
      integer id "PK - Identificador único da questão"
      integer quiz_id "FK - Referência ao quiz"
      text texto "Texto da questão"
      integer gestor_id "FK - Referência ao usuário gestor que criou a questão"
    }
    ALTERNATIVAS {
      integer id "PK - Identificador único da alternativa"
      integer questao_id "FK - Referência à questão"
      text texto "Texto da alternativa"
      boolean correta "Indicador se a alternativa é a correta"
    }
    QUIZ_RESPOSTAS {
      integer id "PK - Identificador único da resposta"
      integer usuario_id "FK - Referência ao usuário"
      integer questao_id "FK - Referência à questão"
      integer alternativa_id "FK - Referência à alternativa escolhida"
      datetime data_resposta "Data e hora da resposta"
    }
    PONTUACAO {
      integer id "PK - Identificador único do registro de pontos"
      integer usuario_id "FK - Referência ao usuário"
      varchar tipo_evento "Tipo de evento (CONTEUDO, QUIZ, MODULO, TRILHA)"
      integer referencia_id "ID do registro relacionado (ex.: conteúdo, módulo, etc.)"
      integer pontos "Quantidade de pontos ganhos"
      timestamptz data_evento "Data e hora do evento"
      text descricao "Descrição ou detalhes do evento (opcional)"
    }
    MOEDAS {
      integer id "PK - Identificador único do registro de moedas"
      integer usuario_id "FK - Referência ao usuário"
      varchar tipo_evento "Tipo de evento (CONTEUDO, QUIZ, MODULO, TRILHA)"
      integer referencia_id "ID do registro relacionado (ex.: conteúdo, módulo, etc.)"
      integer moedas "Quantidade de moedas ganhas"
      timestamptz data_evento "Data e hora do evento"
      text descricao "Descrição ou detalhes do evento (opcional)"
    }

    CERTIFICADOS {
      integer id "PK - Identificador único do certificado"
      integer usuario_id "FK - Referência ao usuário que completou a trilha"
      integer trilha_id "FK - Referência à trilha de aprendizagem"
      timestamptz data_emissao "Data e hora da emissão"
    }
    RECOMPENSAS {
      integer id "PK - Identificador único da recompensa"
      varchar nome "Nome da recompensa"
      text descricao "Descrição detalhada da recompensa"
      integer moedas_requeridas "Moedas necessárias para o resgate"
      varchar tipo "Tipo da recompensa (ex.: virtual, física, voucher)"
      integer quantidade_disponivel "Quantidade disponível (opcional)"
      integer gestor_id "FK - Referência ao usuário gestor que criou a recompensa"
    }
    USUARIO_RECOMPENSAS {
      integer id "PK - Identificador único do registro de resgate"
      integer usuario_id "FK - Referência ao usuário"
      integer recompensa_id "FK - Referência à recompensa"
      timestamptz data_resgate "Data e hora do resgate"
      varchar status "Status do resgate (ex.: pendente, concluído)"
    }
    TRILHA_PROGRESO_USUARIO {
      integer id "PK - Identificador único do registro de progresso"
      integer usuario_id "FK - Referência ao usuário"
      integer trilha_id "FK - Referência à trilha de aprendizagem"
      float percentual "Percentual de conclusão da trilha"
      boolean finalizado "Flag indicando se a trilha foi concluída"
      timestamptz data_inicio "Data e hora de início da trilha"
      timestamptz data_finalizacao "Data e hora da conclusão (opcional)"
    }
    DESAFIOS {
      integer id "PK - Identificador único do desafio"
      varchar nome "Nome do desafio"
      text descricao "Descrição do desafio"
      integer gestor_id "FK - Referência ao usuário gestor que criou o desafio"
    }
    DESAFIO_ETAPAS {
      integer id "PK - Identificador único da etapa do desafio"
      integer desafio_id "FK - Referência ao desafio"
      integer quiz_id "FK - Referência ao quiz correspondente à etapa"
      integer ordem "Ordem da etapa dentro do desafio"
    }
    
    TRILHA_PROGRESO_USUARIO }|..|| USUARIOS : "Progresso do usuário"
    RECOMPENSAS }|..|| USUARIO_RECOMPENSAS : "Recompensa resgatada por usuário"
    USUARIO_RECOMPENSAS }|..|| USUARIOS : "Usuário que resgatou a recompensa"
    CERTIFICADOS }|..|| USUARIOS : "Certificado emitido para o usuário"
    PONTUACAO }|..|| USUARIOS : "Registro de pontos do usuário"
    MOEDAS }|..|| USUARIOS : "Registro de moedas do usuário"
    CONTEUDOS }|..|{ MODULOS : "Aula/conteúdo pertence a módulo"
    TRILHA_MODULOS }|..|| TRILHAS_APRENDIZAGEM : "Conteúdo ordenado na trilha"
    TRILHA_MODULOS }|..|| MODULOS : "Trilha contém módulo"
    CONTEUDO_CHECK }|..|| USUARIOS : "Usuário marca check em vídeo/conteúdo"
    CONTEUDO_CHECK }|..|| CONTEUDOS : "Conteúdo é marcado como check"
    QUESTOES }|..|| QUIZ : "Questões pertencem a um quiz"
    ALTERNATIVAS }|..|| QUESTOES : "Alternativas associadas à questão"
    QUIZ }|..|| CONTEUDOS : "Quiz associado à aula/conteúdo"
    QUIZ_RESPOSTAS }|..|| ALTERNATIVAS : "Resposta baseada na alternativa"
    DESAFIO_ETAPAS }|..|| DESAFIOS : "Etapa vinculada a um desafio"
    DESAFIO_ETAPAS }|..|| QUIZ : "Etapa consiste em um quiz"
```