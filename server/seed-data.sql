-- ============================================================
-- SEED DATA FOR TESTING - Store Management POS & Accounting
-- ============================================================

-- Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Groceries', 'Food and household items'),
('Stationery', 'Office and school supplies'),
('Home & Garden', 'Home appliances and garden tools')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, notes) VALUES
('Tech Distributors Co.', 'Ahmed Hassan', 'ahmed@techdist.com', '+201012345678', 'Cairo, Egypt', 'Main electronics supplier'),
('Fashion Hub Ltd.', 'Sara Mohamed', 'sara@fashionhub.com', '+201098765432', 'Alexandria, Egypt', 'Clothing supplier'),
('Fresh Foods Wholesale', 'Omar Ali', 'omar@freshfoods.com', '+201055566677', 'Giza, Egypt', 'Groceries and food'),
('Office World', 'Fatma Ibrahim', 'fatma@officeworld.com', '+201044433322', 'Cairo, Egypt', 'Stationery supplier'),
('Home Essentials', 'Khaled Nabil', 'khaled@homeess.com', '+201022211100', 'Luxor, Egypt', 'Home and garden')
ON CONFLICT DO NOTHING;

-- Products (linked to suppliers)
INSERT INTO products (name, sku, barcode, category_id, supplier_id, price, cost_price, stock_quantity, low_stock_threshold, min_stock, max_stock) VALUES
('Wireless Mouse', 'ELEC-001', '8901234567890', 1, 1, 250.00, 120.00, 50, 10, 20, 200),
('USB-C Cable 1m', 'ELEC-002', '8901234567891', 1, 1, 75.00, 30.00, 200, 20, 50, 500),
('Bluetooth Speaker', 'ELEC-003', '8901234567892', 1, 1, 899.00, 450.00, 25, 5, 10, 100),
('Laptop Stand', 'ELEC-004', '8901234567893', 1, 1, 450.00, 200.00, 30, 5, 10, 80),
('LED Desk Lamp', 'ELEC-005', '8901234567894', 1, 1, 320.00, 150.00, 40, 8, 15, 100),
('T-Shirt Basic', 'CLTH-001', '8901234567895', 2, 2, 150.00, 60.00, 100, 15, 30, 300),
('Denim Jeans', 'CLTH-002', '8901234567896', 2, 2, 450.00, 180.00, 60, 10, 20, 150),
('Cotton Shirt', 'CLTH-003', '8901234567897', 2, 2, 280.00, 110.00, 75, 10, 20, 200),
('Winter Jacket', 'CLTH-004', '8901234567898', 2, 2, 1200.00, 500.00, 15, 3, 5, 50),
('Sneakers Classic', 'CLTH-005', '8901234567899', 2, 2, 800.00, 350.00, 40, 8, 15, 100),
('Rice 5kg', 'GROC-001', '8901234567900', 3, 3, 120.00, 80.00, 150, 20, 50, 500),
('Olive Oil 1L', 'GROC-002', '8901234567901', 3, 3, 180.00, 110.00, 80, 10, 30, 200),
('Sugar 2kg', 'GROC-003', '8901234567902', 3, 3, 60.00, 35.00, 200, 25, 50, 500),
('Pasta 500g', 'GROC-004', '8901234567903', 3, 3, 25.00, 12.00, 300, 30, 100, 600),
('Canned Beans', 'GROC-005', '8901234567904', 3, 3, 18.00, 8.00, 250, 25, 50, 500),
('Notebook A5', 'STAT-001', '8901234567905', 4, 4, 35.00, 15.00, 120, 15, 30, 300),
('Ballpoint Pens (10)', 'STAT-002', '8901234567906', 4, 4, 45.00, 20.00, 180, 20, 40, 400),
('Sticky Notes Pack', 'STAT-003', '8901234567907', 4, 4, 25.00, 10.00, 200, 20, 50, 500),
('File Folder Set', 'STAT-004', '8901234567908', 4, 4, 80.00, 35.00, 60, 8, 20, 150),
('Printer Paper A4', 'STAT-005', '8901234567909', 4, 4, 95.00, 55.00, 100, 10, 30, 250),
('Garden Chair', 'HOME-001', '8901234567910', 5, 5, 650.00, 300.00, 20, 3, 5, 50),
('Plant Pot Set', 'HOME-002', '8901234567911', 5, 5, 120.00, 50.00, 45, 5, 15, 100),
('Hose Pipe 30m', 'HOME-003', '8901234567912', 5, 5, 280.00, 130.00, 25, 5, 10, 60),
('Watering Can', 'HOME-004', '8901234567913', 5, 5, 65.00, 25.00, 80, 10, 20, 200),
('LED Bulb Pack', 'HOME-005', '8901234567914', 5, 5, 150.00, 70.00, 90, 10, 30, 250)
ON CONFLICT (sku) DO NOTHING;

-- Customers
INSERT INTO customers (name, phone, email, loyalty_points, total_spent) VALUES
('Mohamed Ali', '+201011122233', 'mohamed.ali@email.com', 150, 5500.00),
('Fatma Hassan', '+201022233344', 'fatma.h@email.com', 220, 8200.00),
('Omar Khaled', '+201033344455', 'omar.k@email.com', 80, 2800.00),
('Sara Mahmoud', '+201044455566', 'sara.m@email.com', 350, 12500.00),
('Ahmed Youssef', '+201055566677', 'ahmed.y@email.com', 60, 1900.00),
('Nour Ibrahim', '+201066677788', 'nour.i@email.com', 180, 6700.00),
('Yasmin Adel', '+201077788899', 'yasmin.a@email.com', 90, 3200.00),
('Hassan Mostafa', '+201088899900', 'hassan.m@email.com', 420, 15800.00)
ON CONFLICT DO NOTHING;

-- Employees
INSERT INTO employees (name, role, phone, email, salary, hire_date, is_active) VALUES
('Ali Abdullah', 'MANAGER', '+201112223333', 'ali@store.com', 15000.00, '2023-01-15', true),
('Mona Said', 'CASHIER', '+201123334444', 'mona@store.com', 6000.00, '2023-03-20', true),
('Tamer Reda', 'INVENTORY_CLERK', '+201134445555', 'tamer@store.com', 7000.00, '2023-06-10', true),
('Layla Hussein', 'CASHIER', '+201145556666', 'layla@store.com', 5500.00, '2024-01-05', true),
('Karim Fawzy', 'SALES_ASSOCIATE', '+201156667777', 'karim@store.com', 5000.00, '2024-02-15', true)
ON CONFLICT DO NOTHING;

-- Users (passwords are bcrypt hashed 'admin123')
INSERT INTO users (username, password, full_name, phone, email, role, is_active, must_change_password) VALUES
('admin', '$2a$10$rOZlGNXmU2UuL4tMqjGKWOxLl7Gz3j3j3j3j3j3j3j3j3j3j3j3j', 'Admin Manager', '+201000000001', 'admin@store.com', 'MANAGER', true, false),
('mona', '$2a$10$rOZlGNXmU2UuL4tMqjGKWOxLl7Gz3j3j3j3j3j3j3j3j3j3j3j3j', 'Mona Said', '+201000000002', 'mona@store.com', 'CASHIER', true, false),
('tamer', '$2a$10$rOZlGNXmU2UuL4tMqjGKWOxLl7Gz3j3j3j3j3j3j3j3j3j3j3j3j', 'Tamer Reda', '+201000000003', 'tamer@store.com', 'INVENTORY_CLERK', true, false),
('accountant', '$2a$10$rOZlGNXmU2UuL4tMqjGKWOxLl7Gz3j3j3j3j3j3j3j3j3j3j3j3j', 'Sara Accounting', '+201000000004', 'sara@store.com', 'ACCOUNTANT', true, false)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SEED ACCOUNTING DATA
-- ============================================================

-- Chart of Accounts
INSERT INTO accounts (code, name, account_type) VALUES
('1010', 'Cash', 'asset'),
('1020', 'Bank Account', 'asset'),
('1030', 'Accounts Receivable', 'asset'),
('1050', 'Inventory', 'asset'),
('2010', 'Accounts Payable', 'liability'),
('2020', 'Loans Payable', 'liability'),
('2030', 'VAT Payable', 'liability'),
('3010', 'Owner Equity', 'equity'),
('3020', 'Retained Earnings', 'equity'),
('4010', 'Sales Revenue', 'revenue'),
('4020', 'Sales Returns', 'revenue'),
('4030', 'Other Income', 'revenue'),
('5010', 'Cost of Goods Sold', 'expense'),
('5020', 'Operating Expenses', 'expense'),
('5030', 'Salary Expense', 'expense'),
('5040', 'Rent Expense', 'expense'),
('5050', 'Utilities Expense', 'expense')
ON CONFLICT (code) DO NOTHING;

-- Fiscal Period
INSERT INTO fiscal_periods (name, start_date, end_date, is_closed) VALUES
('FY 2026', '2026-01-01', '2026-12-31', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED TRANSACTIONS (Orders, Expenses, Payments, Journal Entries)
-- ============================================================

-- Sample Orders (January - June 2026)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, completed_at) VALUES
('ORD-20260115-0001', 750.00, 0, 105.00, 855.00, 'cash', 'paid', 1, '2026-01-15 10:30:00'),
('ORD-20260118-0002', 1200.00, 50.00, 161.00, 1311.00, 'card', 'paid', 1, '2026-01-18 14:20:00'),
('ORD-20260203-0003', 320.00, 0, 44.80, 364.80, 'cash', 'paid', 2, '2026-02-03 09:15:00'),
('ORD-20260210-0004', 2500.00, 100.00, 336.00, 2736.00, 'bank_transfer', 'paid', 1, '2026-02-10 16:45:00'),
('ORD-20260220-0005', 450.00, 0, 63.00, 513.00, 'cash', 'paid', 2, '2026-02-20 11:00:00'),
('ORD-20260301-0006', 899.00, 0, 125.86, 1024.86, 'card', 'paid', 1, '2026-03-01 13:30:00'),
('ORD-20260312-0007', 150.00, 0, 21.00, 171.00, 'cash', 'paid', 2, '2026-03-12 10:00:00'),
('ORD-20260325-0008', 3200.00, 200.00, 420.00, 3420.00, 'bank_transfer', 'paid', 1, '2026-03-25 15:20:00'),
('ORD-20260405-0009', 600.00, 0, 84.00, 684.00, 'cash', 'paid', 2, '2026-04-05 09:45:00'),
('ORD-20260418-0010', 1800.00, 100.00, 238.00, 1938.00, 'card', 'paid', 1, '2026-04-18 14:10:00'),
('ORD-20260502-0011', 450.00, 0, 63.00, 513.00, 'cash', 'paid', 2, '2026-05-02 11:30:00'),
('ORD-20260515-0012', 2100.00, 150.00, 273.00, 2223.00, 'bank_transfer', 'paid', 1, '2026-05-15 16:00:00'),
('ORD-20260601-0013', 850.00, 0, 119.00, 969.00, 'cash', 'paid', 2, '2026-06-01 10:15:00'),
('ORD-20260615-0014', 1500.00, 50.00, 203.00, 1653.00, 'card', 'paid', 1, '2026-06-15 13:45:00'),
('ORD-20260625-0015', 3500.00, 200.00, 462.00, 3762.00, 'bank_transfer', 'paid', 1, '2026-06-25 17:00:00')
ON CONFLICT (order_number) DO NOTHING;

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(1, 1, 2, 250.00, 0, 500.00),
(1, 2, 3, 75.00, 0, 225.00),
(2, 3, 1, 899.00, 0, 899.00),
(2, 5, 1, 320.00, 50, 270.00),
(3, 6, 2, 150.00, 0, 300.00),
(4, 3, 2, 899.00, 0, 1798.00),
(4, 10, 1, 800.00, 100, 700.00),
(5, 7, 1, 450.00, 0, 450.00),
(6, 3, 1, 899.00, 0, 899.00),
(7, 6, 1, 150.00, 0, 150.00),
(8, 9, 2, 1200.00, 0, 2400.00),
(8, 10, 1, 800.00, 200, 600.00),
(9, 11, 5, 120.00, 0, 600.00),
(10, 10, 2, 800.00, 0, 1600.00),
(10, 21, 1, 650.00, 100, 550.00),
(11, 7, 1, 450.00, 0, 450.00),
(12, 9, 1, 1200.00, 0, 1200.00),
(12, 10, 1, 800.00, 150, 650.00),
(13, 4, 1, 450.00, 0, 450.00),
(13, 5, 1, 320.00, 0, 320.00),
(14, 3, 1, 899.00, 0, 899.00),
(14, 10, 1, 800.00, 50, 750.00),
(15, 9, 2, 1200.00, 0, 2400.00),
(15, 21, 1, 650.00, 0, 650.00),
(15, 5, 1, 320.00, 200, 120.00);

-- Expenses
INSERT INTO expenses (category, amount, description, recorded_by, expense_date) VALUES
('Rent', 25000.00, 'January rent', 1, '2026-01-01'),
('Utilities', 3500.00, 'Electricity bill - January', 1, '2026-01-15'),
('Salaries', 42000.00, 'Staff salaries January', 1, '2026-01-28'),
('Rent', 25000.00, 'February rent', 1, '2026-02-01'),
('Utilities', 3200.00, 'Electricity bill - February', 1, '2026-02-15'),
('Salaries', 42000.00, 'Staff salaries February', 1, '2026-02-28'),
('Maintenance', 2500.00, 'AC repair', 1, '2026-03-10'),
('Rent', 25000.00, 'March rent', 1, '2026-03-01'),
('Utilities', 3800.00, 'Electricity bill - March', 1, '2026-03-15'),
('Salaries', 42000.00, 'Staff salaries March', 1, '2026-03-28'),
('Marketing', 5000.00, 'Social media ads', 1, '2026-04-05'),
('Rent', 25000.00, 'April rent', 1, '2026-04-01'),
('Utilities', 4100.00, 'Electricity bill - April', 1, '2026-04-15'),
('Salaries', 42000.00, 'Staff salaries April', 1, '2026-04-28'),
('Supplies', 1200.00, 'Office supplies restocking', 3, '2026-05-10'),
('Rent', 25000.00, 'May rent', 1, '2026-05-01'),
('Utilities', 4500.00, 'Electricity bill - May', 1, '2026-05-15'),
('Salaries', 42000.00, 'Staff salaries May', 1, '2026-05-28'),
('Rent', 25000.00, 'June rent', 1, '2026-06-01'),
('Utilities', 4800.00, 'Electricity bill - June', 1, '2026-06-15'),
('Salaries', 42000.00, 'Staff salaries June', 1, '2026-06-28'),
('Marketing', 8000.00, 'Summer promotion campaign', 1, '2026-06-20');

-- Payments
INSERT INTO payments (payment_number, payment_type, method, amount, partner_type, partner_id, reference, payment_date, recorded_by) VALUES
('PAY-20260101-0001', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'January Rent', '2026-01-01', 1),
('PAY-20260115-0002', 'outbound', 'bank_transfer', 3500.00, 'supplier', 3, 'January Utilities', '2026-01-15', 1),
('PAY-20260128-0003', 'outbound', 'bank_transfer', 42000.00, 'employee', NULL, 'January Salaries', '2026-01-28', 1),
('PAY-20260201-0004', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'February Rent', '2026-02-01', 1),
('PAY-20260215-0005', 'outbound', 'bank_transfer', 3200.00, 'supplier', 3, 'February Utilities', '2026-02-15', 1),
('PAY-20260228-0006', 'outbound', 'bank_transfer', 42000.00, 'employee', NULL, 'February Salaries', '2026-02-28', 1),
('PAY-20260301-0007', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'March Rent', '2026-03-01', 1),
('PAY-20260310-0008', 'outbound', 'cash', 2500.00, 'supplier', 2, 'AC Repair', '2026-03-10', 1),
('PAY-20260401-0009', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'April Rent', '2026-04-01', 1),
('PAY-20260501-0010', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'May Rent', '2026-05-01', 1),
('PAY-20260601-0011', 'outbound', 'bank_transfer', 25000.00, 'supplier', 1, 'June Rent', '2026-06-01', 1);

-- ============================================================
-- JOURNAL ENTRIES (Complete double-entry bookkeeping)
-- ============================================================

-- Opening Balance Entries
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-0001', '2026-01-01', 'Owner initial investment', 'OPENING', 'manual', true, 1),
('JE-20260101-0002', '2026-01-01', 'Initial inventory purchase', 'OPENING', 'manual', true, 1);

-- Opening: Cash 100000 ← Owner Equity 100000
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(1, 1, 100000.00, 0, 'Cash from owner investment'),
(1, 8, 0, 100000.00, 'Owner equity contribution');

-- Opening: Inventory 50000 → Cash 50000
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(2, 4, 50000.00, 0, 'Initial inventory stock'),
(2, 1, 0, 50000.00, 'Cash used for inventory purchase');

-- ============================================================
-- ORDER REVENUE ENTRIES (15 orders)
-- ============================================================

-- Entry 3: ORD-20260115-0001 (Cash sale 855, revenue 750, VAT 105)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260115-0003', '2026-01-15', 'Sale - ORD-20260115-0001', 'ORD-20260115-0001', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(3, 1, 855.00, 0, 'Cash received'),
(3, 10, 0, 750.00, 'Sales revenue'),
(3, 7, 0, 105.00, 'VAT payable');

-- Entry 4: ORD-20260118-0002 (Card sale 1311, revenue 1150, VAT 161)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260118-0004', '2026-01-18', 'Sale - ORD-20260118-0002', 'ORD-20260118-0002', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(4, 2, 1311.00, 0, 'Card received'),
(4, 10, 0, 1150.00, 'Sales revenue'),
(4, 7, 0, 161.00, 'VAT payable');

-- Entry 5: ORD-20260203-0003 (Cash sale 364.80, revenue 320, VAT 44.80)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260203-0005', '2026-02-03', 'Sale - ORD-20260203-0003', 'ORD-20260203-0003', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(5, 1, 364.80, 0, 'Cash received'),
(5, 10, 0, 320.00, 'Sales revenue'),
(5, 7, 0, 44.80, 'VAT payable');

-- Entry 6: ORD-20260210-0004 (Bank sale 2736, revenue 2400, VAT 336)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260210-0006', '2026-02-10', 'Sale - ORD-20260210-0004', 'ORD-20260210-0004', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(6, 2, 2736.00, 0, 'Bank received'),
(6, 10, 0, 2400.00, 'Sales revenue'),
(6, 7, 0, 336.00, 'VAT payable');

-- Entry 7: ORD-20260220-0005 (Cash sale 513, revenue 450, VAT 63)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260220-0007', '2026-02-20', 'Sale - ORD-20260220-0005', 'ORD-20260220-0005', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(7, 1, 513.00, 0, 'Cash received'),
(7, 10, 0, 450.00, 'Sales revenue'),
(7, 7, 0, 63.00, 'VAT payable');

-- Entry 8: ORD-20260301-0006 (Card sale 1024.86, revenue 899, VAT 125.86)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260301-0008', '2026-03-01', 'Sale - ORD-20260301-0006', 'ORD-20260301-0006', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(8, 2, 1024.86, 0, 'Card received'),
(8, 10, 0, 899.00, 'Sales revenue'),
(8, 7, 0, 125.86, 'VAT payable');

-- Entry 9: ORD-20260312-0007 (Cash sale 171, revenue 150, VAT 21)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260312-0009', '2026-03-12', 'Sale - ORD-20260312-0007', 'ORD-20260312-0007', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(9, 1, 171.00, 0, 'Cash received'),
(9, 10, 0, 150.00, 'Sales revenue'),
(9, 7, 0, 21.00, 'VAT payable');

-- Entry 10: ORD-20260325-0008 (Bank sale 3420, revenue 3000, VAT 420)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260325-0010', '2026-03-25', 'Sale - ORD-20260325-0008', 'ORD-20260325-0008', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(10, 2, 3420.00, 0, 'Bank received'),
(10, 10, 0, 3000.00, 'Sales revenue'),
(10, 7, 0, 420.00, 'VAT payable');

-- Entry 11: ORD-20260405-0009 (Cash sale 684, revenue 600, VAT 84)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260405-0011', '2026-04-05', 'Sale - ORD-20260405-0009', 'ORD-20260405-0009', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(11, 1, 684.00, 0, 'Cash received'),
(11, 10, 0, 600.00, 'Sales revenue'),
(11, 7, 0, 84.00, 'VAT payable');

-- Entry 12: ORD-20260418-0010 (Card sale 1938, revenue 1700, VAT 238)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260418-0012', '2026-04-18', 'Sale - ORD-20260418-0010', 'ORD-20260418-0010', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(12, 2, 1938.00, 0, 'Card received'),
(12, 10, 0, 1700.00, 'Sales revenue'),
(12, 7, 0, 238.00, 'VAT payable');

-- Entry 13: ORD-20260502-0011 (Cash sale 513, revenue 450, VAT 63)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260502-0013', '2026-05-02', 'Sale - ORD-20260502-0011', 'ORD-20260502-0011', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(13, 1, 513.00, 0, 'Cash received'),
(13, 10, 0, 450.00, 'Sales revenue'),
(13, 7, 0, 63.00, 'VAT payable');

-- Entry 14: ORD-20260515-0012 (Bank sale 2223, revenue 1950, VAT 273)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260515-0014', '2026-05-15', 'Sale - ORD-20260515-0012', 'ORD-20260515-0012', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(14, 2, 2223.00, 0, 'Bank received'),
(14, 10, 0, 1950.00, 'Sales revenue'),
(14, 7, 0, 273.00, 'VAT payable');

-- Entry 15: ORD-20260601-0013 (Cash sale 969, revenue 850, VAT 119)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260601-0015', '2026-06-01', 'Sale - ORD-20260601-0013', 'ORD-20260601-0013', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(15, 1, 969.00, 0, 'Cash received'),
(15, 10, 0, 850.00, 'Sales revenue'),
(15, 7, 0, 119.00, 'VAT payable');

-- Entry 16: ORD-20260615-0014 (Card sale 1653, revenue 1450, VAT 203)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260615-0016', '2026-06-15', 'Sale - ORD-20260615-0014', 'ORD-20260615-0014', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(16, 2, 1653.00, 0, 'Card received'),
(16, 10, 0, 1450.00, 'Sales revenue'),
(16, 7, 0, 203.00, 'VAT payable');

-- Entry 17: ORD-20260625-0015 (Bank sale 3762, revenue 3300, VAT 462)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260625-0017', '2026-06-25', 'Sale - ORD-20260625-0015', 'ORD-20260625-0015', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(17, 2, 3762.00, 0, 'Bank received'),
(17, 10, 0, 3300.00, 'Sales revenue'),
(17, 7, 0, 462.00, 'VAT payable');

-- ============================================================
-- ORDER COGS ENTRIES (15 orders - debit COGS, credit Inventory)
-- ============================================================

-- Entry 18: COGS ORD-0001 (2×Mouse 240 + 3×Cable 90 = 330)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260115-0018', '2026-01-15', 'COGS - ORD-20260115-0001', 'ORD-20260115-0001', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(18, 13, 330.00, 0, 'COGS - ORD-0001'),
(18, 4, 0, 330.00, 'Inventory out - ORD-0001');

-- Entry 19: COGS ORD-0002 (1×Speaker 450 + 1×Lamp 150 = 600)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260118-0019', '2026-01-18', 'COGS - ORD-20260118-0002', 'ORD-20260118-0002', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(19, 13, 600.00, 0, 'COGS - ORD-0002'),
(19, 4, 0, 600.00, 'Inventory out - ORD-0002');

-- Entry 20: COGS ORD-0003 (2×T-Shirt 120)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260203-0020', '2026-02-03', 'COGS - ORD-20260203-0003', 'ORD-20260203-0003', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(20, 13, 120.00, 0, 'COGS - ORD-0003'),
(20, 4, 0, 120.00, 'Inventory out - ORD-0003');

-- Entry 21: COGS ORD-0004 (2×Speaker 900 + 1×Sneakers 350 = 1250)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260210-0021', '2026-02-10', 'COGS - ORD-20260210-0004', 'ORD-20260210-0004', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(21, 13, 1250.00, 0, 'COGS - ORD-0004'),
(21, 4, 0, 1250.00, 'Inventory out - ORD-0004');

-- Entry 22: COGS ORD-0005 (1×Jeans 180)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260220-0022', '2026-02-20', 'COGS - ORD-20260220-0005', 'ORD-20260220-0005', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(22, 13, 180.00, 0, 'COGS - ORD-0005'),
(22, 4, 0, 180.00, 'Inventory out - ORD-0005');

-- Entry 23: COGS ORD-0006 (1×Speaker 450)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260301-0023', '2026-03-01', 'COGS - ORD-20260301-0006', 'ORD-20260301-0006', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(23, 13, 450.00, 0, 'COGS - ORD-0006'),
(23, 4, 0, 450.00, 'Inventory out - ORD-0006');

-- Entry 24: COGS ORD-0007 (1×T-Shirt 60)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260312-0024', '2026-03-12', 'COGS - ORD-20260312-0007', 'ORD-20260312-0007', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(24, 13, 60.00, 0, 'COGS - ORD-0007'),
(24, 4, 0, 60.00, 'Inventory out - ORD-0007');

-- Entry 25: COGS ORD-0008 (2×Jacket 1000 + 1×Sneakers 350 = 1350)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260325-0025', '2026-03-25', 'COGS - ORD-20260325-0008', 'ORD-20260325-0008', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(25, 13, 1350.00, 0, 'COGS - ORD-0008'),
(25, 4, 0, 1350.00, 'Inventory out - ORD-0008');

-- Entry 26: COGS ORD-0009 (5×Rice 400)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260405-0026', '2026-04-05', 'COGS - ORD-20260405-0009', 'ORD-20260405-0009', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(26, 13, 400.00, 0, 'COGS - ORD-0009'),
(26, 4, 0, 400.00, 'Inventory out - ORD-0009');

-- Entry 27: COGS ORD-0010 (2×Sneakers 700 + 1×Garden Chair 300 = 1000)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260418-0027', '2026-04-18', 'COGS - ORD-20260418-0010', 'ORD-20260418-0010', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(27, 13, 1000.00, 0, 'COGS - ORD-0010'),
(27, 4, 0, 1000.00, 'Inventory out - ORD-0010');

-- Entry 28: COGS ORD-0011 (1×Jeans 180)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260502-0028', '2026-05-02', 'COGS - ORD-20260502-0011', 'ORD-20260502-0011', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(28, 13, 180.00, 0, 'COGS - ORD-0011'),
(28, 4, 0, 180.00, 'Inventory out - ORD-0011');

-- Entry 29: COGS ORD-0012 (1×Jacket 500 + 1×Sneakers 350 = 850)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260515-0029', '2026-05-15', 'COGS - ORD-20260515-0012', 'ORD-20260515-0012', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(29, 13, 850.00, 0, 'COGS - ORD-0012'),
(29, 4, 0, 850.00, 'Inventory out - ORD-0012');

-- Entry 30: COGS ORD-0013 (1×LampStand 200 + 1×DeskLamp 150 = 350)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260601-0030', '2026-06-01', 'COGS - ORD-20260601-0013', 'ORD-20260601-0013', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(30, 13, 350.00, 0, 'COGS - ORD-0013'),
(30, 4, 0, 350.00, 'Inventory out - ORD-0013');

-- Entry 31: COGS ORD-0014 (1×Speaker 450 + 1×Sneakers 350 = 800)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260615-0031', '2026-06-15', 'COGS - ORD-20260615-0014', 'ORD-20260615-0014', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(31, 13, 800.00, 0, 'COGS - ORD-0014'),
(31, 4, 0, 800.00, 'Inventory out - ORD-0014');

-- Entry 32: COGS ORD-0015 (2×Jacket 1000 + 1×GardenChair 300 + 1×Lamp 150 = 1450)
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260625-0032', '2026-06-25', 'COGS - ORD-20260625-0015', 'ORD-20260625-0015', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(32, 13, 1450.00, 0, 'COGS - ORD-0015'),
(32, 4, 0, 1450.00, 'Inventory out - ORD-0015');

-- ============================================================
-- EXPENSE ENTRIES (22 expenses - cash basis: debit expense, credit cash)
-- ============================================================

-- January expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-0033', '2026-01-01', 'Rent expense - January', NULL, 'expense', true, 1),
('JE-20260115-0034', '2026-01-15', 'Utilities expense - January', NULL, 'expense', true, 1),
('JE-20260128-0035', '2026-01-28', 'Salary expense - January', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(33, 16, 25000.00, 0, 'Rent expense - January'),
(33, 1, 0, 25000.00, 'Cash - January rent'),
(34, 17, 3500.00, 0, 'Utilities expense - January'),
(34, 1, 0, 3500.00, 'Cash - January utilities'),
(35, 15, 42000.00, 0, 'Salary expense - January'),
(35, 1, 0, 42000.00, 'Cash - January salaries');

-- February expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260201-0036', '2026-02-01', 'Rent expense - February', NULL, 'expense', true, 1),
('JE-20260215-0037', '2026-02-15', 'Utilities expense - February', NULL, 'expense', true, 1),
('JE-20260228-0038', '2026-02-28', 'Salary expense - February', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(36, 16, 25000.00, 0, 'Rent expense - February'),
(36, 1, 0, 25000.00, 'Cash - February rent'),
(37, 17, 3200.00, 0, 'Utilities expense - February'),
(37, 1, 0, 3200.00, 'Cash - February utilities'),
(38, 15, 42000.00, 0, 'Salary expense - February'),
(38, 1, 0, 42000.00, 'Cash - February salaries');

-- March expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260310-0039', '2026-03-10', 'Maintenance expense - March', NULL, 'expense', true, 1),
('JE-20260301-0040', '2026-03-01', 'Rent expense - March', NULL, 'expense', true, 1),
('JE-20260315-0041', '2026-03-15', 'Utilities expense - March', NULL, 'expense', true, 1),
('JE-20260328-0042', '2026-03-28', 'Salary expense - March', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(39, 14, 2500.00, 0, 'Maintenance expense - March'),
(39, 1, 0, 2500.00, 'Cash - March maintenance'),
(40, 16, 25000.00, 0, 'Rent expense - March'),
(40, 1, 0, 25000.00, 'Cash - March rent'),
(41, 17, 3800.00, 0, 'Utilities expense - March'),
(41, 1, 0, 3800.00, 'Cash - March utilities'),
(42, 15, 42000.00, 0, 'Salary expense - March'),
(42, 1, 0, 42000.00, 'Cash - March salaries');

-- April expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260405-0043', '2026-04-05', 'Marketing expense - April', NULL, 'expense', true, 1),
('JE-20260401-0044', '2026-04-01', 'Rent expense - April', NULL, 'expense', true, 1),
('JE-20260415-0045', '2026-04-15', 'Utilities expense - April', NULL, 'expense', true, 1),
('JE-20260428-0046', '2026-04-28', 'Salary expense - April', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(43, 14, 5000.00, 0, 'Marketing expense - April'),
(43, 1, 0, 5000.00, 'Cash - April marketing'),
(44, 16, 25000.00, 0, 'Rent expense - April'),
(44, 1, 0, 25000.00, 'Cash - April rent'),
(45, 17, 4100.00, 0, 'Utilities expense - April'),
(45, 1, 0, 4100.00, 'Cash - April utilities'),
(46, 15, 42000.00, 0, 'Salary expense - April'),
(46, 1, 0, 42000.00, 'Cash - April salaries');

-- May expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260510-0047', '2026-05-10', 'Supplies expense - May', NULL, 'expense', true, 3),
('JE-20260501-0048', '2026-05-01', 'Rent expense - May', NULL, 'expense', true, 1),
('JE-20260515-0049', '2026-05-15', 'Utilities expense - May', NULL, 'expense', true, 1),
('JE-20260528-0050', '2026-05-28', 'Salary expense - May', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(47, 14, 1200.00, 0, 'Supplies expense - May'),
(47, 1, 0, 1200.00, 'Cash - May supplies'),
(48, 16, 25000.00, 0, 'Rent expense - May'),
(48, 1, 0, 25000.00, 'Cash - May rent'),
(49, 17, 4500.00, 0, 'Utilities expense - May'),
(49, 1, 0, 4500.00, 'Cash - May utilities'),
(50, 15, 42000.00, 0, 'Salary expense - May'),
(50, 1, 0, 42000.00, 'Cash - May salaries');

-- June expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260601-0051', '2026-06-01', 'Rent expense - June', NULL, 'expense', true, 1),
('JE-20260615-0052', '2026-06-15', 'Utilities expense - June', NULL, 'expense', true, 1),
('JE-20260628-0053', '2026-06-28', 'Salary expense - June', NULL, 'expense', true, 1),
('JE-20260620-0054', '2026-06-20', 'Marketing expense - June', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(51, 16, 25000.00, 0, 'Rent expense - June'),
(51, 1, 0, 25000.00, 'Cash - June rent'),
(52, 17, 4800.00, 0, 'Utilities expense - June'),
(52, 1, 0, 4800.00, 'Cash - June utilities'),
(53, 15, 42000.00, 0, 'Salary expense - June'),
(53, 1, 0, 42000.00, 'Cash - June salaries'),
(54, 14, 8000.00, 0, 'Marketing expense - June'),
(54, 1, 0, 8000.00, 'Cash - June marketing');

-- ============================================================
-- UPDATE ACCOUNT BALANCES (calculated from journal entries)
-- ============================================================

-- Cash (1010): opening 100000 - 50000 (inventory) + 4069.80 (sales) - 442600 (expenses) = -388530.20
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1010')
) WHERE code = '1010';

-- Bank (1020): 18067.86 from card/bank sales
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1020')
) WHERE code = '1020';

-- Inventory (1050): opening 50000 - 9370 COGS = 40630
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1050')
) WHERE code = '1050';

-- VAT Payable (2030): 2718.66 from sales
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '2030')
) WHERE code = '2030';

-- Owner Equity (3010): 100000
UPDATE accounts SET balance = 100000.00 WHERE code = '3010';

-- Sales Revenue (4010): 19419 from all orders
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '4010')
) WHERE code = '4010';

-- COGS (5010): 9370 total cost
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5010')
) WHERE code = '5010';

-- Operating Expenses (5020): 16700
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5020')
) WHERE code = '5020';

-- Salary Expense (5030): 252000
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5030')
) WHERE code = '5030';

-- Rent Expense (5040): 150000
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5040')
) WHERE code = '5040';

-- Utilities Expense (5050): 23900
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5050')
) WHERE code = '5050';
