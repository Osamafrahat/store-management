-- Run this in Supabase SQL Editor to fix admin login
DELETE FROM users WHERE username = 'admin';

INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
VALUES (
  'admin',
  '$2a$10$jWk3zHwH/ECfNnbLhg88UeQgGVurfqmn810/QWgSED9jP.t8akobC',
  'Admin Manager',
  'MANAGER',
  '["pos_access","inventory_view","inventory_edit","reports_view","suppliers_view","suppliers_edit","promotions_view","promotions_edit","settings_view","settings_edit","user_manage","customers_view","customers_edit","expenses_view","expenses_edit","refunds_view","refunds_edit","employees_view","employees_edit","accounting_view","accounting_edit","accounting_post"]',
  true,
  false
);

-- Verify it was created
SELECT id, username, full_name, role, is_active FROM users WHERE username = 'admin';
