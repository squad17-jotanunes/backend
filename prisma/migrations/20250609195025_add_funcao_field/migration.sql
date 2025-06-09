/*
  Warnings:

  - Added the required column `funcao` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestor_id" INTEGER,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "autoridade" TEXT NOT NULL,
    CONSTRAINT "usuarios_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usuarios" ("autoridade", "gestor_id", "id", "matricula", "nome", "pontos", "senha", "setor", "funcao")
SELECT "autoridade", "gestor_id", "id", "matricula", "nome", "pontos", "senha", "setor",
  CASE
    WHEN "autoridade" = 'admin' THEN 'Administrador'
    WHEN "autoridade" = 'gestor' THEN 'Gestor'
    WHEN "autoridade" = 'colaborador' THEN 'Colaborador'
    ELSE 'Colaborador'
  END as "funcao"
FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
