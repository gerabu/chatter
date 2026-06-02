-- AlterTable
ALTER TABLE "Task" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "deleted_at" TIMESTAMP(3);
