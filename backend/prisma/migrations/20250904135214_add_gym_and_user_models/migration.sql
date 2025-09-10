/*
  Warnings:

  - Added the required column `gymId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('OWNER', 'COACH', 'MEMBER');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "gymId" INTEGER NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "public"."Gym" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gym_name_key" ON "public"."Gym"("name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
