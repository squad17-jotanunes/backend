-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_avaliacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conteudo_id" INTEGER,
    "etapa_id" INTEGER,
    "trilha_id" INTEGER,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gestor_id" INTEGER NOT NULL,
    CONSTRAINT "avaliacoes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "desafio_etapas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_avaliacoes" ("conteudo_id", "descricao", "etapa_id", "gestor_id", "id", "titulo") SELECT "conteudo_id", "descricao", "etapa_id", "gestor_id", "id", "titulo" FROM "avaliacoes";
DROP TABLE "avaliacoes";
ALTER TABLE "new_avaliacoes" RENAME TO "avaliacoes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
