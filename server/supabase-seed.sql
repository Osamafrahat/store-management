-- ============================================================
-- INITIAL SEED: Admin User + Default Settings
-- Run AFTER supabase-schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DELETE FROM users WHERE username = 'admin';

INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf', 10)),
  'Admin Manager',
  'MANAGER',
  '["pos_access","inventory_view","inventory_edit","reports_view","suppliers_view","suppliers_edit","promotions_view","promotions_edit","settings_view","settings_edit","user_manage","customers_view","customers_edit","expenses_view","expenses_edit","refunds_view","refunds_edit","employees_view","employees_edit","accounting_view","accounting_edit","accounting_post"]',
  true,
  true
);

INSERT INTO store_settings (key, value) VALUES
  ('storeName', 'متجر النيل'),
  ('storeAddress', ''),
  ('storePhone', ''),
  ('taxRate', '14'),
  ('currency', 'EGP'),
  ('currencySymbol', 'ج.م'),
  ('receiptFooter', 'شكراً لشرائكم!'),
  ('lowStockThreshold', '10'),
  ('loyaltyPointsPerCurrency', '1')
ON CONFLICT (key) DO NOTHING;
