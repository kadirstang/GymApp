-- AlterTable
ALTER TABLE "workout_programs" ADD COLUMN     "category_id" UUID,
ADD COLUMN     "duration_weeks" INTEGER;

-- CreateTable
CREATE TABLE "user_program_selections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "selection_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "completed_weeks" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_program_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_program_selections_user_id_is_active_idx" ON "user_program_selections"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_current_program" ON "user_program_selections"("user_id", "selection_type", "is_active");

-- AddForeignKey
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "program_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_selections" ADD CONSTRAINT "user_program_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_selections" ADD CONSTRAINT "user_program_selections_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "workout_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
