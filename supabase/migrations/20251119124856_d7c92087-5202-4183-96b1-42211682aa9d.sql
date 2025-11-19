-- Add column to disable VAT calculation for specific entries
ALTER TABLE finance_entries 
ADD COLUMN disable_vat boolean NOT NULL DEFAULT false;

-- Add the same column to deleted_entries for consistency
ALTER TABLE deleted_entries 
ADD COLUMN disable_vat boolean NOT NULL DEFAULT false;