/*
  Warnings:

  - You are about to drop the `quiz_respostas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trilha_modulos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `quiz_id` on the `desafio_etapas` table. All the data in the column will be lost.
  - You are about to drop the column `quiz_id` on the `questoes` table. All the data in the column will be lost.
  - You are about to drop the column `funcao` on the `usuarios` table. All the data in the column will be lost.
  - Added the required column `avaliacao_id` to the `desafio_etapas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avaliacao_id` to the `questoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoridade` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "quiz_respostas";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "quizzes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "trilha_modulos";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "item_trilha" (
    "trilha_id" INTEGER NOT NULL,
    "modulo_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,

    PRIMARY KEY ("trilha_id", "modulo_id"),
    CONSTRAINT "item_trilha_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_trilha_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conteudo_id" INTEGER,
    "etapa_id" INTEGER,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "avaliacoes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "desafio_etapas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacao_respostas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "alternativa_id" INTEGER NOT NULL,
    "data_resposta" DATETIME NOT NULL,
    "questaoId" INTEGER,
    CONSTRAINT "avaliacao_respostas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avaliacao_respostas_alternativa_id_fkey" FOREIGN KEY ("alternativa_id") REFERENCES "alternativas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avaliacao_respostas_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_desafio_etapas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "desafio_id" INTEGER NOT NULL,
    "avaliacao_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "desafio_etapas_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "desafio_etapas_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_desafio_etapas" ("desafio_id", "id", "ordem") SELECT "desafio_id", "id", "ordem" FROM "desafio_etapas";
DROP TABLE "desafio_etapas";
ALTER TABLE "new_desafio_etapas" RENAME TO "desafio_etapas";
CREATE TABLE "new_questoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avaliacao_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "questoes_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questoes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_questoes" ("gestor_id", "id", "texto") SELECT "gestor_id", "id", "texto" FROM "questoes";
DROP TABLE "questoes";
ALTER TABLE "new_questoes" RENAME TO "questoes";
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestor_id" INTEGER,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "autoridade" TEXT NOT NULL,
    CONSTRAINT "usuarios_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usuarios" ("id", "matricula", "nome", "pontos", "senha", "setor") SELECT "id", "matricula", "nome", "pontos", "senha", "setor" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
