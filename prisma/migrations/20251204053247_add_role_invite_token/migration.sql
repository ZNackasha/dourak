/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "inviteToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Role_inviteToken_key" ON "Role"("inviteToken");
