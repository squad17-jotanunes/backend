/*
  Warnings:

  - You are about to drop the `ALTERNATIVAS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CERTIFICADOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CONTEUDOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CONTEUDO_CHECK` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MODULOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MOEDAS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PONTUACAO` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QUESTOES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QUIZ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QUIZ_RESPOSTAS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RECOMPENSAS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRILHAS_APRENDIZAGEM` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRILHA_MODULOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRILHA_PROGRESO_USUARIO` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TROFEUS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `USUARIOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `USUARIO_RECOMPENSAS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `USUARIO_TROFEUS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ALTERNATIVAS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CERTIFICADOS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CONTEUDOS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CONTEUDO_CHECK";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MODULOS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MOEDAS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PONTUACAO";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QUESTOES";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QUIZ";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QUIZ_RESPOSTAS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RECOMPENSAS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TRILHAS_APRENDIZAGEM";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TRILHA_MODULOS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TRILHA_PROGRESO_USUARIO";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TROFEUS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "USUARIOS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "USUARIO_RECOMPENSAS";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "USUARIO_TROFEUS";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "matricula" INTEGER NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "modulos_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conteudos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "conteudos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "conteudos_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trilhas_aprendizagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "trilhas_aprendizagem_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trilha_modulos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trilha_id" INTEGER NOT NULL,
    "conteudo_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "trilha_modulos_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trilha_modulos_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conteudo_check" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "conteudo_id" INTEGER NOT NULL,
    "data_assistido" DATETIME NOT NULL,
    CONSTRAINT "conteudo_check_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "conteudo_check_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "quizzes_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quizzes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quiz_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "questoes_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questoes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alternativas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questao_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,
    CONSTRAINT "alternativas_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz_respostas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "questao_id" INTEGER NOT NULL,
    "alternativa_id" INTEGER NOT NULL,
    "data_resposta" DATETIME NOT NULL,
    CONSTRAINT "quiz_respostas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quiz_respostas_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quiz_respostas_alternativa_id_fkey" FOREIGN KEY ("alternativa_id") REFERENCES "alternativas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pontuacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "referencia_id" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL,
    "data_evento" DATETIME NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "pontuacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "moedas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "referencia_id" INTEGER NOT NULL,
    "moedas" INTEGER NOT NULL,
    "data_evento" DATETIME NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "moedas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trofeus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "quantidade_minima" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "trofeus_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario_trofeus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "trofeu_id" INTEGER NOT NULL,
    "data_aquisicao" DATETIME NOT NULL,
    CONSTRAINT "usuario_trofeus_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "usuario_trofeus_trofeu_id_fkey" FOREIGN KEY ("trofeu_id") REFERENCES "trofeus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "trilha_id" INTEGER NOT NULL,
    "url_certificado" TEXT NOT NULL,
    "data_emissao" DATETIME NOT NULL,
    CONSTRAINT "certificados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "certificados_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recompensas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "moedas_requeridas" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade_disponivel" INTEGER,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "recompensas_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario_recompensas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "recompensa_id" INTEGER NOT NULL,
    "data_resgate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "usuario_recompensas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "usuario_recompensas_recompensa_id_fkey" FOREIGN KEY ("recompensa_id") REFERENCES "recompensas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trilha_progresso_usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "trilha_id" INTEGER NOT NULL,
    "percentual" REAL NOT NULL,
    "finalizado" BOOLEAN NOT NULL,
    "data_inicio" DATETIME NOT NULL,
    "data_finalizacao" DATETIME,
    CONSTRAINT "trilha_progresso_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trilha_progresso_usuario_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");
