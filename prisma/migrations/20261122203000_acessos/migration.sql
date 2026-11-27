-- Tipos de acesso: adm, equipe e cliente
ALTER TABLE "Designer" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'equipe';
ALTER TABLE "Designer" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Designer" ADD COLUMN "sessionsFrom" DATETIME;
ALTER TABLE "Project" ADD COLUMN "clientAccess" BOOLEAN NOT NULL DEFAULT true;
-- Quem já existia no painel vira adm
UPDATE "Designer" SET "role" = 'adm';
