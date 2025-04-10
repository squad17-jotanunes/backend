/*
  Warnings:

  - You are about to drop the `trofeus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario_trofeus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `url_certificado` on the `certificados` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `conteudos` table. All the data in the column will be lost.
  - You are about to drop the column `modulo_id` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `conteudo_id` on the `trilha_modulos` table. All the data in the column will be lost.
  - You are about to drop the column `cargo` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `usuarios` table. All the data in the column will be lost.
  - Added the required column `url_video` to the `conteudos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conteudo_id` to the `quizzes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modulo_id` to the `trilha_modulos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `funcao` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setor` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "trofeus";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "usuario_trofeus";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "desafios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "desafios_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "desafio_etapas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "desafio_id" INTEGER NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "desafio_etapas_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "desafio_etapas_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_certificados" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "trilha_id" INTEGER NOT NULL,
    "data_emissao" DATETIME NOT NULL,
    CONSTRAINT "certificados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "certificados_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_certificados" ("data_emissao", "id", "trilha_id", "usuario_id") SELECT "data_emissao", "id", "trilha_id", "usuario_id" FROM "certificados";
DROP TABLE "certificados";
ALTER TABLE "new_certificados" RENAME TO "certificados";
CREATE TABLE "new_conteudos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "url_video" TEXT NOT NULL,
    "url_pdf" TEXT,
    "ordem" INTEGER NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "conteudos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "conteudos_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_conteudos" ("descricao", "gestor_id", "id", "modulo_id", "ordem", "tipo", "titulo") SELECT "descricao", "gestor_id", "id", "modulo_id", "ordem", "tipo", "titulo" FROM "conteudos";
DROP TABLE "conteudos";
ALTER TABLE "new_conteudos" RENAME TO "conteudos";
CREATE TABLE "new_quizzes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conteudo_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "quizzes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quizzes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_quizzes" ("descricao", "gestor_id", "id", "titulo") SELECT "descricao", "gestor_id", "id", "titulo" FROM "quizzes";
DROP TABLE "quizzes";
ALTER TABLE "new_quizzes" RENAME TO "quizzes";
CREATE TABLE "new_trilha_modulos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trilha_id" INTEGER NOT NULL,
    "modulo_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "trilha_modulos_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trilha_modulos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_trilha_modulos" ("id", "ordem", "trilha_id") SELECT "id", "ordem", "trilha_id" FROM "trilha_modulos";
DROP TABLE "trilha_modulos";
ALTER TABLE "new_trilha_modulos" RENAME TO "trilha_modulos";
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "funcao" TEXT NOT NULL
);
INSERT INTO "new_usuarios" ("id", "matricula", "nome", "pontos", "senha") SELECT "id", "matricula", "nome", "pontos", "senha" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
