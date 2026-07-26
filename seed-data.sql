-- ============================================================
-- SEED DATA FOR STORE MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor
-- WARNING: This will DELETE existing data
-- ============================================================

-- Clear existing data (order matters due to foreign keys)
DELETE FROM payment_splits;
DELETE FROM order_items;
DELETE FROM stock_movements;
DELETE FROM refunds;
DELETE FROM expenses;
DELETE FROM orders;
DELETE FROM promotions;
DELETE FROM employees;
DELETE FROM users;
DELETE FROM customers;
DELETE FROM products;
DELETE FROM suppliers;
DELETE FROM categories;
DELETE FROM store_settings;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE suppliers_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE promotions_id_seq RESTART WITH 1;
ALTER SEQUENCE expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_movements_id_seq RESTART WITH 1;

-- ============================================================
-- USERS (password for all: admin123 / cashier123 / etc.)
-- ============================================================
INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password) VALUES
  ('admin', '$2a$10$Dww.z8cSTU6pmT7XEd6X9eL8lmfLOo.o8.9pTEOWPGinCAyvr1b12', 'System Admin', 'MANAGER', '["pos_access","inventory_view","inventory_edit","reports_view","suppliers_view","suppliers_edit","promotions_view","promotions_edit","settings_view","settings_edit","user_manage","customers_view","customers_edit","expenses_view","expenses_edit","refunds_view","refunds_edit","employees_view","employees_edit"]', true, false),
  ('khaled', '$2a$10$nrevKrPnQWk4NObbOsQKP.IrZJKxqnYzBMMT1sRsfj.VKcgDtqLuW', 'Khaled Omar', 'SALES_MANAGER', '["pos_access","inventory_view","reports_view","suppliers_view","promotions_view","promotions_edit","customers_view","customers_edit","refunds_view","refunds_edit","expenses_view","employees_view"]', true, false),
  ('amira', '$2a$10$fMWbcWJ1ZlVlmAsmSfDuIehhofFkAlxW05xPO8Z7eCz/jcXsA4Hdm', 'Amira Salah', 'SENIOR_CASHIER', '["pos_access","inventory_view","reports_view","customers_view","customers_edit","refunds_view","refunds_edit","promotions_view"]', true, false),
  ('hassan', '$2a$10$fMWbcWJ1ZlVlmAsmSfDuIehhofFkAlxW05xPO8Z7eCz/jcXsA4Hdm', 'Hassan Youssef', 'CASHIER', '["pos_access","reports_view","customers_view","customers_edit","refunds_view"]', true, false),
  ('layla', '$2a$10$fMWbcWJ1ZlVlmAsmSfDuIehhofFkAlxW05xPO8Z7eCz/jcXsA4Hdm', 'Layla Nabil', 'INVENTORY_CLERK', '["pos_access","inventory_view","inventory_edit","suppliers_view","suppliers_edit"]', true, false),
  ('viewer', '$2a$10$SFHexTiJRiF48dFo3Auoh.5xgEVGw1U2QQhtczfpSf.neZug7Jpgy', 'Read Only User', 'VIEWER', '["pos_access","inventory_view","reports_view","suppliers_view","promotions_view","customers_view","expenses_view","refunds_view","employees_view"]', true, false);

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Smartphones, laptops, tablets, and accessories'),
  ('Groceries', 'Food items, beverages, and daily essentials'),
  ('Clothing', 'Men and women clothing and apparel'),
  ('Home & Kitchen', 'Furniture, appliances, and kitchenware'),
  ('Beauty & Health', 'Cosmetics, skincare, and health products'),
  ('Sports & Outdoors', 'Sportswear, equipment, and outdoor gear'),
  ('Books & Stationery', 'Books, notebooks, and office supplies'),
  ('Toys & Games', 'Children toys and board games');

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (name, contact_person, email, phone, address, notes) VALUES
  ('Al-Futtaim Electronics', 'Ahmed Hassan', 'ahmed@alfuttaim.com', '+20 100 111 2222', 'Nasr City, Cairo', 'Main electronics supplier'),
  ('Cairo Fresh Markets', 'Fatma Ali', 'fatma@cairofresh.com', '+20 111 222 3333', 'Shoubra, Cairo', 'Fresh produce supplier'),
  ('Textile Express', 'Mohamed Saeed', 'mohamed@textilex.com', '+20 122 333 4444', 'Alexandria', 'Clothing and fabrics'),
  ('Home Comfort Co.', 'Sara Ibrahim', 'sara@homecomfort.com', '+20 133 444 5555', '6th October City', 'Furniture and home goods'),
  ('Beauty World', 'Nour Khalil', 'nour@beautyworld.com', '+20 144 555 6666', 'Maadi, Cairo', 'Cosmetics and beauty'),
  ('Sport Zone', 'Omar Farouk', 'omar@sportzone.com', '+20 155 666 7777', 'Heliopolis, Cairo', 'Sports equipment');

-- ============================================================
-- PRODUCTS
-- ============================================================
-- Electronics (category_id = 1)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('iPhone 15 Pro Max 256GB', 'IPH15PM256', '6901234567890', 1, 75000, 62000, 25, 5, 'Apple iPhone 15 Pro Max', 1),
  ('Samsung Galaxy S24 Ultra', 'SAM24U', '6901234567891', 1, 65000, 54000, 30, 5, 'Samsung Galaxy S24 Ultra 256GB', 1),
  ('MacBook Air M3 13"', 'MBA13M3', '6901234567892', 1, 55000, 46000, 15, 3, 'Apple MacBook Air M3', 1),
  ('iPad Pro 11" M4', 'IPDP11M4', '6901234567893', 1, 42000, 35000, 20, 5, 'Apple iPad Pro 11-inch', 1),
  ('Sony WH-1000XM5', 'SNYWH5', '6901234567894', 1, 12000, 9500, 40, 10, 'Sony noise-cancelling headphones', 1),
  ('AirPods Pro 2nd Gen', 'APP2', '6901234567895', 1, 9500, 7800, 50, 10, 'Apple AirPods Pro USB-C', 1),
  ('Samsung 55" Smart TV 4K', 'SAM55TV', '6901234567896', 1, 28000, 23000, 10, 3, 'Samsung 55-inch 4K Smart TV', 1),
  ('Xiaomi Redmi Note 13', 'XRN13', '6901234567897', 1, 8500, 6800, 60, 15, 'Xiaomi Redmi Note 13 128GB', 1),
  ('USB-C Fast Charger 65W', 'USB65W', '6901234567899', 1, 850, 550, 100, 20, '65W USB-C fast charger', 1);

-- Groceries (category_id = 2)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('Premium Olive Oil 1L', 'POO1L', '6902345678900', 2, 350, 250, 80, 20, 'Extra virgin olive oil', 2),
  ('Egyptian Rice 5kg', 'EGYR5', '6902345678901', 2, 180, 130, 120, 30, 'Premium Egyptian rice 5kg', 2),
  ('Ful Medames 400g x6', 'FUL6', '6902345678902', 2, 95, 65, 150, 30, 'Ful medames 6-pack', 2),
  ('Pepsi 1.5L x6', 'PEP6', '6902345678903', 2, 120, 85, 100, 25, 'Pepsi 1.5L 6-pack', 2),
  ('Lipton Tea 100 bags', 'LIPT100', '6902345678904', 2, 85, 55, 90, 20, 'Lipton yellow label tea', 2),
  ('Nido Milk Powder 900g', 'NID900', '6902345678905', 2, 320, 260, 60, 15, 'Nido full cream milk', 2),
  ('Sunflower Oil 1.5L', 'SFO15', '6902345678906', 2, 145, 105, 70, 20, 'Cooking sunflower oil', 2),
  ('Sugar 2kg', 'DSG2', '6902345678907', 2, 65, 45, 200, 40, 'White sugar 2kg', 2),
  ('Cowboy Coffee 250g', 'CWBY250', '6902345678908', 2, 110, 75, 45, 10, 'Cowboy instant coffee', 2);

-- Clothing (category_id = 3)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('Men Cotton T-Shirt', 'MTSHRT', '6903456789010', 3, 250, 140, 100, 20, 'Cotton t-shirt for men', 3),
  ('Women Summer Dress', 'WSDRESS', '6903456789011', 3, 450, 280, 50, 10, 'Floral summer dress', 3),
  ('Men Jeans Slim Fit', 'MJEANS', '6903456789012', 3, 550, 350, 60, 15, 'Slim fit denim jeans', 3),
  ('Unisex Hoodie', 'UHOOD', '6903456789013', 3, 400, 240, 70, 15, 'Cotton blend hoodie', 3),
  ('Kids Polo Shirt', 'KPOLO', '6903456789014', 3, 180, 100, 80, 20, 'Cotton polo for kids', 3);

-- Home & Kitchen (category_id = 4)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('Non-Stick Pan Set', 'NSFP3', '6904567890120', 4, 850, 520, 35, 8, '3-piece frying pan set', 4),
  ('Blender 1200W', 'BLND12', '6904567890121', 4, 1500, 950, 20, 5, 'High-power blender', 4),
  ('Robot Vacuum', 'VCRBT', '6904567890122', 4, 8500, 6500, 12, 3, 'Robot vacuum cleaner', 4),
  ('Cookware Set 10pc', 'SSCS10', '6904567890123', 4, 2200, 1400, 15, 5, 'Stainless steel cookware', 4),
  ('Electric Kettle', 'EKTL17', '6904567890125', 4, 650, 400, 40, 10, 'Electric kettle 1.7L', 4);

-- Beauty (category_id = 5)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('Vitamin C Serum 30ml', 'VCS30', '6905678901230', 5, 450, 280, 60, 15, 'Vitamin C face serum', 5),
  ('Moisturizing Cream', 'MCR50', '6905678901231', 5, 320, 200, 70, 15, 'Daily face cream', 5),
  ('Anti-Hair Loss Shampoo', 'SAHL', '6905678901232', 5, 180, 110, 90, 20, 'Shampoo 400ml', 5),
  ('Perfume Oriental Musk', 'POM', '6905678901233', 5, 1200, 750, 30, 5, 'Oriental musk 100ml', 5),
  ('Sunscreen SPF50', 'SUN50', '6905678901234', 5, 280, 170, 50, 15, 'SPF50 sunscreen 100ml', 5);

-- Sports (category_id = 6)
INSERT INTO products (name, sku, barcode, category_id, price, cost_price, stock_quantity, low_stock_threshold, description, supplier_id) VALUES
  ('Running Shoes', 'RSNK', '6906789012340', 6, 3500, 2400, 30, 5, 'Nike running shoes', 6),
  ('Yoga Mat Premium', 'YMPREM', '6906789012341', 6, 650, 400, 40, 10, 'Non-slip yoga mat', 6),
  ('Dumbbells 20kg Set', 'DB20', '6906789012342', 6, 1800, 1200, 20, 5, 'Adjustable dumbbells', 6),
  ('Gym Bag Large', 'GBAG', '6906789012343', 6, 450, 280, 35, 8, 'Waterproof gym bag', 6),
  ('Water Bottle 1L', 'WB1L', '6906789012344', 6, 280, 160, 60, 15, 'Insulated bottle', 6);

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO customers (name, phone, email, loyalty_points, total_spent, notes) VALUES
  ('Ahmed Mohamed', '+20 101 234 5678', 'ahmed@email.com', 1500, 45000, 'Regular customer'),
  ('Sara Ali', '+20 102 345 6789', 'sara@email.com', 2200, 68000, 'VIP customer'),
  ('Omar Hassan', '+20 103 456 7890', 'omar@email.com', 800, 22000, NULL),
  ('Fatma Khalil', '+20 104 567 8901', 'fatma@email.com', 3100, 95000, 'Wholesale buyer'),
  ('Youssef Ibrahim', '+20 105 678 9012', 'youssef@email.com', 450, 12000, NULL),
  ('Nour Abdel Rahman', '+20 106 789 0123', 'nour@email.com', 1800, 52000, 'Frequent buyer'),
  ('Mohamed Saad', '+20 107 890 1234', 'mo@email.com', 600, 18000, NULL),
  ('Hana Mahmoud', '+20 108 901 2345', 'hana@email.com', 950, 28000, 'Loyalty member'),
  ('Tamer Adel', '+20 109 012 3456', 'tamer@email.com', 320, 9500, NULL),
  ('Mona Farouk', '+20 110 123 4567', 'mona@email.com', 2700, 82000, 'VIP customer');

-- ============================================================
-- EMPLOYEES (linked to users where applicable)
-- ============================================================
INSERT INTO employees (name, role, phone, email, salary, hire_date, is_active, user_id) VALUES
  ('Khaled Omar', 'MANAGER', '+20 112 234 5678', 'khaled@store.com', 15000, '2022-01-15', true, 2),
  ('Amira Salah', 'CASHIER', '+20 113 345 6789', 'amira@store.com', 6000, '2023-03-20', true, 3),
  ('Hassan Youssef', 'CASHIER', '+20 114 456 7890', 'hassan@store.com', 5000, '2023-06-10', true, 4),
  ('Layla Nabil', 'INVENTORY_CLERK', '+20 115 567 8901', 'layla@store.com', 7000, '2022-09-01', true, 5),
  ('Omar Sherif', 'SALES', '+20 116 678 9012', 'omar@store.com', 5500, '2024-01-05', true, NULL),
  ('Dina Mostafa', 'CASHIER', '+20 117 789 0123', 'dina@store.com', 5000, '2024-02-15', true, NULL);

-- Link employees back to users
UPDATE users SET employee_id = 1 WHERE id = 2;
UPDATE users SET employee_id = 2 WHERE id = 3;
UPDATE users SET employee_id = 3 WHERE id = 4;
UPDATE users SET employee_id = 4 WHERE id = 5;

-- ============================================================
-- PROMOTIONS
-- ============================================================
INSERT INTO promotions (code, type, value, min_order_amount, max_uses, used_count, start_date, end_date, is_active) VALUES
  ('WELCOME10', 'percentage', 10, 200, 1000, 156, '2024-01-01', '2025-12-31', true),
  ('SAVE50', 'fixed', 50, 500, 500, 89, '2024-06-01', '2025-06-30', true),
  ('SUMMER20', 'percentage', 20, 300, 200, 45, '2024-06-15', '2025-08-31', true),
  ('VIP100', 'fixed', 100, 1000, 100, 23, '2024-01-01', '2025-12-31', true),
  ('FREESHIP', 'percentage', 0, 150, NULL, 312, '2024-01-01', '2025-12-31', true);

-- ============================================================
-- ORDERS (last 30 days)
-- ============================================================
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at, created_at) VALUES
  ('ORD-2024-001', 8500, 0, 1190, 9690, 'cash', 'paid', 3, 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('ORD-2024-002', 12500, 500, 1680, 13680, 'card', 'paid', 3, 2, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('ORD-2024-003', 3200, 0, 448, 3648, 'mobile', 'paid', 4, 3, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ('ORD-2024-004', 45000, 2000, 5880, 48880, 'card', 'paid', 3, 4, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ORD-2024-005', 1800, 0, 252, 2052, 'cash', 'paid', 4, 5, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('ORD-2024-006', 7500, 50, 1036, 8486, 'cash', 'paid', 3, 6, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('ORD-2024-007', 2800, 0, 392, 3192, 'mobile', 'paid', 4, 7, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('ORD-2024-008', 65000, 1000, 8820, 72820, 'card', 'paid', 3, 4, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('ORD-2024-009', 4200, 0, 588, 4788, 'cash', 'paid', 3, 8, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('ORD-2024-010', 1500, 0, 210, 1710, 'cash', 'paid', 4, 9, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('ORD-2024-011', 9500, 0, 1330, 10830, 'card', 'paid', 3, 10, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('ORD-2024-012', 2500, 0, 350, 2850, 'mobile', 'paid', 3, 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
  (1, 1, 1, 7500, 0, 7500),
  (1, 9, 2, 850, 0, 1700),
  (2, 2, 1, 6500, 0, 6500),
  (2, 6, 1, 9500, 500, 9000),
  (3, 10, 5, 350, 0, 1750),
  (3, 11, 3, 180, 0, 540),
  (3, 12, 10, 95, 0, 950),
  (4, 1, 1, 7500, 0, 7500),
  (4, 3, 1, 55000, 0, 55000),
  (5, 19, 5, 250, 0, 1250),
  (5, 20, 2, 450, 0, 900),
  (6, 5, 1, 12000, 0, 12000),
  (6, 7, 1, 2800, 0, 2800),
  (7, 10, 4, 350, 0, 1400),
  (7, 14, 2, 320, 0, 640),
  (8, 2, 1, 65000, 0, 65000),
  (9, 31, 2, 450, 0, 900),
  (9, 32, 3, 320, 0, 960),
  (10, 11, 10, 180, 0, 1800),
  (10, 12, 3, 85, 0, 255);

-- ============================================================
-- EXPENSES
-- ============================================================
INSERT INTO expenses (category, amount, description, recorded_by, expense_date) VALUES
  ('Rent', 25000, 'Monthly store rent', 1, CURRENT_DATE - INTERVAL '5 days'),
  ('Utilities', 3500, 'Electricity and water bill', 1, CURRENT_DATE - INTERVAL '4 days'),
  ('Salaries', 55000, 'Employee salaries', 1, CURRENT_DATE - INTERVAL '3 days'),
  ('Maintenance', 2200, 'AC maintenance', 1, CURRENT_DATE - INTERVAL '2 days'),
  ('Marketing', 5000, 'Social media ads', 1, CURRENT_DATE - INTERVAL '1 day'),
  ('Supplies', 800, 'Receipt paper and packaging', 1, CURRENT_DATE);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
INSERT INTO stock_movements (product_id, type, quantity, notes, created_by, created_at) VALUES
  (1, 'receive', 50, 'Initial stock', 'system', NOW() - INTERVAL '30 days'),
  (2, 'receive', 60, 'Initial stock', 'system', NOW() - INTERVAL '30 days'),
  (3, 'receive', 30, 'Initial stock', 'system', NOW() - INTERVAL '30 days'),
  (1, 'sale', -1, 'Order ORD-2024-001', 'system', NOW() - INTERVAL '25 days'),
  (2, 'sale', -1, 'Order ORD-2024-002', 'system', NOW() - INTERVAL '24 days'),
  (1, 'sale', -1, 'Order ORD-2024-011', 'system', NOW() - INTERVAL '3 days'),
  (10, 'adjust', -5, 'Damaged items', 'admin', NOW() - INTERVAL '10 days'),
  (11, 'receive', 200, 'Fresh stock', 'system', NOW() - INTERVAL '15 days');
