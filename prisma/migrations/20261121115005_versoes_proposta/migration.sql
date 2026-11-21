-- AlterTable
ALTER TABLE "Project" ADD COLUMN "publishedAt" DATETIME;

-- CreateTable
CREATE TABLE "ProposalVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision" TEXT,
    "decisionNote" TEXT,
    "decisionAt" DATETIME,
    CONSTRAINT "ProposalVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVersion_projectId_number_key" ON "ProposalVersion"("projectId", "number");
