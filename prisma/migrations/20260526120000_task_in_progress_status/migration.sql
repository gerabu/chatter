-- Map legacy MIGRATED tasks before replacing the enum
UPDATE "Task" SET "status" = 'TODO' WHERE "status" = 'MIGRATED';

-- Replace TaskStatus enum: drop MIGRATED, add IN_PROGRESS
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING ("status"::text::"TaskStatus");
DROP TYPE "TaskStatus_old";
