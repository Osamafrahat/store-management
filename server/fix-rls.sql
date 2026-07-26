-- ============================================================
-- FIX ROW LEVEL SECURITY + SCHEMA UPDATES
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employees table if not exists
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CASHIER',
  phone TEXT,
  email TEXT,
  salary NUMERIC DEFAULT 0,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  user_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table if not exists
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  receipt_image TEXT,
  recorded_by BIGINT REFERENCES users(id),
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create refunds table if not exists
CREATE TABLE IF NOT EXISTS refunds (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  processed_by BIGINT REFERENCES users(id),
  refund_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  promotion_id BIGINT,
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT false;

-- Add min/max stock to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock INTEGER DEFAULT 0;

-- Add user_id to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON customers;
CREATE POLICY "Allow all for service role" ON customers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON employees;
CREATE POLICY "Allow all for service role" ON employees FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON expenses;
CREATE POLICY "Allow all for service role" ON expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON refunds;
CREATE POLICY "Allow all for service role" ON refunds FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON notifications;
CREATE POLICY "Allow all for service role" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INSERT DEFAULT SETTINGS (loyalty points config)
-- ============================================================
INSERT INTO store_settings (key, value) VALUES ('loyaltyPointsPerCurrency', '1')
ON CONFLICT (key) DO NOTHING;
