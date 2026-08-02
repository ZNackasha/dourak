-- Role-level required/optional moved to the per-shift `required` flag
-- (backfilled in 20260801000000_shift_required). Drop the redundant column.

ALTER TABLE "Role" DROP COLUMN "type";
