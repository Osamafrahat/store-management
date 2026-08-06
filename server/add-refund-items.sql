-- Create refund_items table for item-level refunds
CREATE TABLE IF NOT EXISTS refund_items (
  id BIGSERIAL PRIMARY KEY,
  refund_id BIGINT NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_partial column to refunds table
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_items_refund ON refund_items(refund_id);
CREATE INDEX IF NOT EXISTS idx_refund_items_order_item ON refund_items(order_item_id);

-- RLS
ALTER TABLE refund_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON refund_items;
CREATE POLICY "Allow all" ON refund_items FOR ALL USING (true) WITH CHECK (true);
