-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_gymId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "gymId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
