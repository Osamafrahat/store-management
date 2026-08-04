-- Add client_order_id for offline order deduplication
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_order_id TEXT UNIQUE;

-- Index for fast dedup lookups
CREATE INDEX IF NOT EXISTS idx_orders_client_order_id ON orders(client_order_id);
