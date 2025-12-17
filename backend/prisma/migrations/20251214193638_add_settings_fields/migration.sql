-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "custom_permissions" JSONB;
