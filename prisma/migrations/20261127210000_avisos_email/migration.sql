-- Avisos por e-mail: dá para desligar os e-mails para um cliente específico
ALTER TABLE "Project" ADD COLUMN "notifyClient" BOOLEAN NOT NULL DEFAULT true;
