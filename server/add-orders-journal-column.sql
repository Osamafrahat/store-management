-- Add journal_entry_id to orders table for payment deduplication
ALTER TABLE orders ADD COLUMN IF NOT EXISTS journal_entry_id BIGINT REFERENCES journal_entries(id);
