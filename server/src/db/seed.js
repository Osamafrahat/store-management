import supabase from './supabase.js'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Checking Supabase tables...')

  // Check if users table exists by trying to select
  const { error: checkError } = await supabase.from('users').select('id').limit(1)

  if (checkError && checkError.code === '42P01') {
    // Table doesn't exist - print SQL instructions
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  Your Supabase database needs tables. Go to your Supabase dashboard ║
║  (https://supabase.com/dashboard) → SQL Editor and run this SQL:    ║
╚══════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_splits (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id BIGINT,
  notes TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);

-- Default store settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'My Store'),
  ('store_address', ''),
  ('store_phone', ''),
  ('currency', 'EGP'),
  ('currency_symbol', 'ج.م'),
  ('tax_rate', '14'),
  ('low_stock_threshold', '10'),
  ('receipt_header', 'Thank you for your purchase!'),
  ('receipt_footer', 'Come again!')
ON CONFLICT (key) DO NOTHING;

-- Default admin user
`)
    process.exit(1)
  }

  if (checkError) {
    console.error('Error checking tables:', checkError)
    process.exit(1)
  }

  // Tables exist - check for admin user
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'admin')
    .single()

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('admin123', salt)

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        password: hashedPassword,
        full_name: 'Administrator',
        role: 'MANAGER',
        permissions: [
          'pos_access', 'inventory_view', 'inventory_edit',
          'reports_view', 'suppliers_view', 'suppliers_edit',
          'promotions_view', 'promotions_edit', 'settings_view',
          'settings_edit', 'user_manage'
        ],
        is_active: true,
        must_change_password: true
      })

    if (insertError) {
      console.error('Error creating admin user:', insertError)
      process.exit(1)
    }

    console.log('Default admin user created (admin / admin123)')
  } else {
    console.log('Admin user already exists')
  }

  // Seed default store settings
  const defaultSettings = [
    { key: 'store_name', value: 'My Store' },
    { key: 'currency', value: 'EGP' },
    { key: 'currency_symbol', value: 'ج.م' },
    { key: 'tax_rate', value: '14' },
    { key: 'low_stock_threshold', value: '10' },
    { key: 'receipt_header', value: 'Thank you for your purchase!' },
    { key: 'receipt_footer', value: 'Come again!' }
  ]

  for (const setting of defaultSettings) {
    await supabase
      .from('store_settings')
      .upsert(setting, { onConflict: 'key' })
  }

  console.log('Seed completed successfully!')
}

seed().catch(console.error)
