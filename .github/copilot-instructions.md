We are using Node.js with Hono and Prisma for our backend. Our project is an internal training system for Jotanunes Construtora, designed to standardize knowledge and aid in the integration of new collaborators.
Here are the key details:
User Management:
Users are defined by the following fields:
nome: Full name
matricula: Registration number
senha: Password
setor: Department/sector
pontos: Points accumulated
role: User role in the system (e.g., collaborator, manager)
Modules and Content:
Training is organized in modules. Each module contains lessons, where every lesson is a video with:
URL para o vídeo (url_video)
URL opcional para leitura complementar em PDF (url_pdf)
Quiz: Each video lesson has an associated quiz.
Quizzes:
Quizzes are now directly linked to each lesson rather than being attached to the module. They consist of questions and alternatives, and user responses are recorded.
Learning Trails:
Trails aggregate lessons from different modules. The system tracks progress using the TRILHA_PROGRESO_USUARIO table, and automatically issues certificates upon trail completion.
Challenges:
A new feature called "Desafios" has been added.
Each challenge has multiple steps (etapas).
Each step is represented by a quiz, defined in the DESAFIO_ETAPAS table.
Gamification with Points and Virtual Coins:
Users earn points and virtual coins by:
Watching video lessons
Participating in quizzes
Completing modules and trails
Rewards are redeemed using virtual coins, not points.
Database Schema:
Our schema includes the following tables:
USUARIOS, MODULOS, CONTEUDOS, TRILHAS_APRENDIZAGEM, TRILHA_MODULOS, CONTEUDO_CHECK, QUIZ, QUESTOES, ALTERNATIVAS, QUIZ_RESPOSTAS, PONTUACAO, MOEDAS, CERTIFICADOS, RECOMPENSAS, USUARIO_RECOMPENSAS, TRILHA_PROGRESO_USUARIO, DESAFIOS, and DESAFIO_ETAPAS.
In tables where items are created or configured by managers, a gestor_id field is included to track the creator.
Coding Standards:
All code samples and backend instructions must be fully compatible with Node.js, Hono, and Prisma.
Please follow these guidelines and conventions strictly when providing instructions or code samples.