INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
VALUES (
  'admin',
  '$2a$10$KRjZnXMQXIBfegnUHTqUf.A7A17QTq92ySu69CThcN8mQfI4Gx/x.',
  'Administrator',
  'MANAGER',
  '["pos_access","inventory_view","inventory_edit","reports_view","suppliers_view","suppliers_edit","promotions_view","promotions_edit","settings_view","settings_edit","user_manage"]',
  true,
  true
) ON CONFLICT (username) DO NOTHING;

INSERT INTO store_settings (key, value) VALUES
  ('storeName', 'My Store'),
  ('storeAddress', ''),
  ('storePhone', ''),
  ('taxRate', '14'),
  ('currency', 'EGP'),
  ('currencySymbol', 'ج.م'),
  ('receiptFooter', 'Thank you for your purchase!'),
  ('lowStockThreshold', '10')
ON CONFLICT (key) DO NOTHING;
