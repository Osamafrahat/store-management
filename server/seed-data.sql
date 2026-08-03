-- ============================================================
-- SEED DATA: Assets Selling Company (Real Estate / Vehicles / Equipment)
-- Deletes all data EXCEPT users and employees, then reseeds.
-- ============================================================

-- ============================================================
-- STEP 1: DELETE ALL DATA (preserve users + employees)
-- Nullify all foreign keys referencing users first
-- ============================================================
UPDATE journal_entries SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE payments SET recorded_by = NULL WHERE recorded_by IS NOT NULL;
UPDATE expenses SET recorded_by = NULL WHERE recorded_by IS NOT NULL;
UPDATE refunds SET processed_by = NULL WHERE processed_by IS NOT NULL;
UPDATE employees SET user_id = NULL WHERE user_id IS NOT NULL;

DELETE FROM journal_entry_lines;
DELETE FROM journal_entries;
DELETE FROM account_balances;
DELETE FROM payments;
DELETE FROM fiscal_periods;
DELETE FROM accounts;
DELETE FROM refunds;
DELETE FROM expenses;
DELETE FROM order_items;
DELETE FROM payment_splits;
DELETE FROM orders;
DELETE FROM stock_movements;
DELETE FROM promotions;
DELETE FROM activity_log;
DELETE FROM store_settings;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM suppliers;
DELETE FROM customers;

-- ============================================================
-- STEP 2: CATEGORIES (Asset Types)
-- ============================================================
INSERT INTO categories (name, description) VALUES
('Sedan Cars', 'Used and new sedan vehicles'),
('SUV Cars', 'Sport utility vehicles'),
('Commercial Vehicles', 'Trucks, vans, and commercial transport'),
('Construction Equipment', 'Heavy machinery and construction tools'),
('Office Equipment', 'Furniture, electronics, and office assets'),
('Industrial Machinery', 'Factory and production machinery')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: SUPPLIERS (Asset Sources / Dealers)
-- ============================================================
INSERT INTO suppliers (name, contact_person, email, phone, address, notes) VALUES
('Cairo Auto Trading', 'Mohamed Salah', 'mohamed@cairoauto.com', '+201012345678', 'Nasr City, Cairo', 'Primary vehicle supplier'),
('Alex Export Motors', 'Ahmed Farouk', 'ahmed@alexexport.com', '+201098765432', 'Smouha, Alexandria', 'Imported vehicles'),
('Delta Heavy Equipment', 'Khaled Mahmoud', 'khaled@deltaheavy.com', '+201055566677', '10th of Ramadan City', 'Construction machinery'),
('Nile Office Solutions', 'Fatma Hassan', 'fatma@nileoffice.com', '+201044433322', '6th of October City', 'Office furniture & IT'),
('Upper Egypt Machinery', 'Youssef Ibrahim', 'youssef@uppermach.com', '+201022211100', 'Assiut', 'Industrial machines'),
('Misr Lease Company', 'Sara Ali', 'sara@misrlease.com', '+201033322211', 'Maadi, Cairo', 'Leased asset returns')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: PRODUCTS (Assets for Sale)
-- ============================================================
INSERT INTO products (name, sku, barcode, category_id, supplier_id, price, cost_price, stock_quantity, low_stock_threshold, min_stock, max_stock, description) VALUES
-- Sedan Cars
('2022 Toyota Camry SE', 'SED-001', 'VEH001001', 1, 1, 650000.00, 520000.00, 3, 1, 1, 10, 'Low mileage, single owner, Cairo plate'),
('2021 Hyundai Elantra GL', 'SED-002', 'VEH001002', 1, 1, 380000.00, 310000.00, 5, 2, 2, 15, 'Full option, maintained at dealership'),
('2023 Kia Cerato EX', 'SED-003', 'VEH001003', 1, 2, 420000.00, 340000.00, 2, 1, 1, 8, 'Brand new, zero km, Egypt warranty'),
('2020 Nissan Sentra SV', 'SED-004', 'VEH001004', 1, 1, 320000.00, 260000.00, 4, 2, 2, 12, 'Good condition, 45k km'),
-- SUV Cars
('2022 Toyota Land Cruiser VX', 'SUV-001', 'VEH002001', 2, 2, 1850000.00, 1500000.00, 2, 1, 1, 5, 'Full option, black, low km'),
('2021 Hyundai Tucson Limited', 'SUV-002', 'VEH002002', 2, 1, 720000.00, 580000.00, 3, 1, 1, 8, 'AWD, panoramic roof, leather seats'),
('2023 MG ZS EV', 'SUV-003', 'VEH002003', 2, 2, 850000.00, 700000.00, 2, 1, 1, 6, 'Electric vehicle, 400km range'),
-- Commercial Vehicles
('2021 Isuzu NLR Truck', 'COM-001', 'VEH003001', 3, 1, 580000.00, 450000.00, 2, 1, 1, 5, '2-ton payload, flatbed'),
('2020 Toyota Hiace Van', 'COM-002', 'VEH003002', 3, 2, 490000.00, 380000.00, 3, 1, 1, 6, '14-seat passenger, mint condition'),
-- Construction Equipment
('Caterpillar 320 Excavator', 'CON-001', 'EQP004001', 4, 3, 2500000.00, 2000000.00, 1, 1, 1, 3, '2020 model, 3000 hours'),
('JCB 3CX Backhoe Loader', 'CON-002', 'EQP004002', 4, 3, 1200000.00, 950000.00, 2, 1, 1, 4, '2021 model, fully serviced'),
('Komatsu D61 Bulldozer', 'CON-003', 'EQP004003', 4, 3, 3200000.00, 2600000.00, 1, 1, 1, 2, 'Low hours, excellent condition'),
-- Office Equipment
('Executive Desk Set', 'OFF-001', 'EQP005001', 5, 4, 15000.00, 8000.00, 20, 5, 5, 50, 'Mahogany desk + chair + cabinet'),
('HP LaserJet Pro MFP', 'OFF-002', 'EQP005002', 5, 4, 12000.00, 7500.00, 10, 3, 3, 30, 'Multi-function printer, network ready'),
('Conference Table (12-person)', 'OFF-003', 'EQP005003', 5, 4, 45000.00, 28000.00, 4, 1, 1, 10, 'Modern design, oak finish'),
-- Industrial Machinery
('CNC Milling Machine DMG', 'IND-001', 'EQP006001', 6, 5, 4500000.00, 3800000.00, 1, 1, 1, 2, 'DMG Mori 2021, 3-axis'),
('Hydraulic Press 200 Ton', 'IND-002', 'EQP006002', 6, 5, 850000.00, 680000.00, 2, 1, 1, 3, 'Brand new, installation included')
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- STEP 5: CUSTOMERS
-- ============================================================
INSERT INTO customers (name, phone, email, address, loyalty_points, total_spent, notes) VALUES
('Hassan Construction Co.', '+201011122233', 'hassan@construction.com', 'New Cairo, Cairo', 0, 2500000.00, 'Regular buyer - construction equipment'),
('Alex Logistics LLC', '+201022233344', 'info@alexlogistics.com', 'Smouha, Alexandria', 0, 1200000.00, 'Fleet purchases'),
('Nile Trading Corp', '+201033344455', 'purchasing@niletrading.com', '6th of October, Giza', 0, 850000.00, 'Office equipment buyer'),
('Delta Motors Fleet', '+201044455566', 'fleet@deltamotors.com', 'Mansoura, Dakahlia', 0, 3200000.00, 'Bulk vehicle purchases'),
('Oasis Real Estate Dev', '+201055566677', 'assets@oasisdev.com', 'New Administrative Capital', 0, 5600000.00, 'Heavy equipment buyer'),
('Green Valley Farms', '+201066677788', 'admin@greenvalley.com', 'Fayoum', 0, 780000.00, 'Tractor and machinery'),
('Cairo Tech Industries', '+201077788899', 'procurement@cairotech.com', '10th of Ramadan City', 0, 1900000.00, 'CNC and industrial'),
('Sinai Development Auth', '+201088899900', 'projects@sinai.gov.eg', 'South Sinai', 0, 4100000.00, 'Government - mixed purchases'),
('Red Sea Hotels Group', '+201099900011', 'ops@redseahotels.com', 'Hurghada, Red Sea', 0, 2200000.00, 'Furniture and vehicles'),
('Upper Egypt Cement Co.', '+201100011122', 'maintenance@uec.com', 'Assiut', 0, 6800000.00, 'Industrial machinery buyer')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 6: USERS (keeping existing, but updating admin password hash)
-- ============================================================
-- Users and employees are preserved. No changes needed.

-- ============================================================
-- STEP 7: ACCOUNTING CHART OF ACCOUNTS
-- ============================================================
INSERT INTO accounts (code, name, account_type, description) VALUES
-- Assets
('1010', 'Cash on Hand', 'asset', 'Physical cash in office and vault'),
('1020', 'Bank Account - CIB', 'asset', 'Commercial International Bank main account'),
('1030', 'Accounts Receivable', 'asset', 'Amounts owed by customers for asset purchases'),
('1040', 'Petty Cash', 'asset', 'Small daily operational cash'),
('1050', 'Inventory - Vehicles', 'asset', 'Vehicles held for resale'),
('1060', 'Inventory - Equipment', 'asset', 'Equipment and machinery held for resale'),
('1100', 'Prepaid Insurance', 'asset', 'Advance insurance payments'),
('1200', 'Security Deposits', 'asset', 'Rental and lease deposits'),

-- Liabilities
('2010', 'Accounts Payable', 'liability', 'Amounts owed to suppliers and dealers'),
('2020', 'Bank Loan - Term', 'liability', 'Business term loan from CIB'),
('2030', 'VAT Payable', 'liability', 'Tax collected on sales less input VAT'),
('2040', 'Accrued Expenses', 'liability', 'Expenses incurred but not yet paid'),

-- Equity
('3010', 'Owner Equity', 'equity', 'Capital invested by owner'),
('3020', 'Retained Earnings', 'equity', 'Accumulated profit retained in business'),
('3030', 'Current Year Earnings', 'equity', 'Net income for current fiscal period'),

-- Revenue
('4010', 'Asset Sales Revenue', 'revenue', 'Revenue from selling vehicles and equipment'),
('4020', 'Service Revenue', 'revenue', 'Inspection, documentation, and transfer fees'),
('4030', 'Commission Income', 'revenue', 'Brokerage and referral commissions'),
('4040', 'Other Income', 'revenue', 'Miscellaneous income sources'),

-- Expenses
('5010', 'Cost of Assets Sold', 'expense', 'Direct cost of assets sold to customers'),
('5020', 'Operating Expenses', 'expense', 'General operating expenses'),
('5030', 'Salary Expense', 'expense', 'Employee salaries and wages'),
('5040', 'Rent Expense', 'expense', 'Office and showroom rent'),
('5050', 'Utilities Expense', 'expense', 'Electricity, water, internet'),
('5060', 'Marketing Expense', 'expense', 'Advertising and promotional costs'),
('5070', 'Vehicle Maintenance', 'expense', 'Maintenance and repair of inventory vehicles'),
('5080', 'Insurance Expense', 'expense', 'Asset and liability insurance'),
('5090', 'Depreciation Expense', 'expense', 'Depreciation on fixed assets'),
('5100', 'Bank Charges', 'expense', 'Transaction and service fees'),
('5110', 'Legal & Professional Fees', 'expense', 'Legal, audit, and consulting fees'),
('5120', 'Travel & Transportation', 'expense', 'Business travel and logistics')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- STEP 8: FISCAL PERIODS
-- ============================================================
INSERT INTO fiscal_periods (name, start_date, end_date, is_closed) VALUES
('FY 2026 Q1', '2026-01-01', '2026-03-31', false),
('FY 2026 Q2', '2026-04-01', '2026-06-30', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 9: OPENING BALANCES (January 1, 2026)
-- ============================================================

-- Journal Entry 1: Owner invests EGP 5,000,000 cash
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-0001', '2026-01-01', 'Owner initial capital investment', 'OPENING', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(1, 1, 3000000.00, 0, 'Cash deposited to CIB bank'),
(1, 2, 2000000.00, 0, 'Cash on hand from owner'),
(1, 8, 0, 5000000.00, 'Owner equity contribution');

-- Journal Entry 2: Initial vehicle inventory purchase
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-0002', '2026-01-01', 'Opening inventory - vehicles purchased', 'OPENING', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(2, 5, 2800000.00, 0, 'Inventory - 4 sedans + 1 SUV'),
(2, 2, 0, 1800000.00, 'Paid via bank transfer'),
(2, 9, 0, 1000000.00, 'Remaining payable to suppliers');

-- Journal Entry 3: Bank loan received
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-0003', '2026-01-01', 'Business term loan from CIB', 'LOAN-001', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(3, 2, 2000000.00, 0, 'Loan disbursed to bank account'),
(3, 10, 0, 2000000.00, '5-year term loan at 12% annual');

-- ============================================================
-- STEP 10: ASSET PURCHASES (Buying inventory from suppliers)
-- ============================================================

-- Purchase 1: 3x Toyota Camry from Cairo Auto Trading
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260110-0004', '2026-01-10', 'Purchase - 3x Toyota Camry SE', 'PUR-20260110-001', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(4, 5, 1560000.00, 0, '3x Camry at 520,000 each'),
(4, 2, 0, 1560000.00, 'Bank transfer to Cairo Auto');

-- Purchase 2: 5x Hyundai Elantra from Cairo Auto
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260115-0005', '2026-01-15', 'Purchase - 5x Hyundai Elantra GL', 'PUR-20260115-002', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(5, 5, 1550000.00, 0, '5x Elantra at 310,000 each'),
(5, 9, 0, 1550000.00, 'Payable to Cairo Auto - 30 day terms');

-- Purchase 3: 2x Land Cruiser from Alex Export
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260120-0006', '2026-01-20', 'Purchase - 2x Toyota Land Cruiser', 'PUR-20260120-003', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(6, 5, 3000000.00, 0, '2x Land Cruiser at 1,500,000 each'),
(6, 2, 0, 2000000.00, 'Partial bank payment'),
(6, 9, 0, 1000000.00, 'Remaining payable');

-- Purchase 4: CAT Excavator from Delta Heavy
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260201-0007', '2026-02-01', 'Purchase - CAT 320 Excavator', 'PUR-20260201-004', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(7, 6, 2000000.00, 0, 'CAT 320 Excavator cost'),
(7, 2, 0, 1500000.00, 'Bank transfer'),
(7, 9, 0, 500000.00, 'Payable to Delta Heavy');

-- Purchase 5: Office furniture from Nile Office
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260210-0008', '2026-02-10', 'Purchase - Office furniture set', 'PUR-20260210-005', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(8, 6, 160000.00, 0, '20x desk sets at 8,000 each'),
(8, 2, 0, 160000.00, 'Bank transfer');

-- Purchase 6: Isuzu trucks and Hiace vans
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260220-0009', '2026-02-20', 'Purchase - 2x Isuzu NLR + 3x Toyota Hiace', 'PUR-20260220-006', 'manual', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(9, 5, 2090000.00, 0, '2x Isuzu 450k + 3x Hiace 396.7k avg'),
(9, 2, 0, 2090000.00, 'Bank transfer');

-- ============================================================
-- STEP 11: ASSET SALES (Revenue + COGS + Journal Entries)
-- ============================================================

-- Sale 1: 1x Toyota Camry to Hassan Construction (CASH)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260125-0001', 575221.24, 0, 80530.97, 655752.21, 'cash', 'paid', 1, 1, '2026-01-25 10:30:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(1, 1, 1, 575221.24, 0, 575221.24);

-- Sale 2: 2x Hyundai Elantra to Alex Logistics (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260205-0002', 666666.67, 20000.00, 90533.33, 737200.00, 'bank_transfer', 'paid', 1, 2, '2026-02-05 14:20:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(2, 2, 2, 353333.33, 20000.00, 686666.67);

-- Sale 3: 1x Land Cruiser to Oasis Real Estate (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260215-0003', 1622807.02, 0, 227192.98, 1850000.00, 'bank_transfer', 'paid', 1, 5, '2026-02-15 11:00:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(3, 5, 1, 1622807.02, 0, 1622807.02);

-- Sale 4: 1x CAT Excavator to Hassan Construction (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260301-0004', 2192982.46, 0, 307017.54, 2500000.00, 'bank_transfer', 'paid', 1, 1, '2026-03-01 13:30:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(4, 8, 1, 2192982.46, 0, 2192982.46);

-- Sale 5: 1x Kia Cerato to Nile Trading (CASH)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260310-0005', 368421.05, 0, 51578.95, 420000.00, 'cash', 'paid', 1, 3, '2026-03-10 09:15:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(5, 3, 1, 368421.05, 0, 368421.05);

-- Sale 6: 3x Office desk sets to Cairo Tech (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260320-0006', 39473.68, 0, 5526.32, 45000.00, 'bank_transfer', 'paid', 2, 7, '2026-03-20 15:20:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(6, 13, 3, 13157.89, 0, 39473.68);

-- Sale 7: 1x JCB Backhoe to Upper Egypt Cement (CASH)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260401-0007', 1052631.58, 50000.00, 140368.42, 1143000.00, 'cash', 'paid', 1, 10, '2026-04-01 09:45:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(7, 9, 1, 1052631.58, 50000.00, 1002631.58);

-- Sale 8: 1x MG ZS EV + 1x Hiace to Sinai Development (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260415-0008', 1131578.95, 30000.00, 154021.05, 1255600.00, 'bank_transfer', 'paid', 1, 8, '2026-04-15 14:10:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(8, 7, 1, 745614.04, 0, 745614.04),
(8, 10, 1, 415789.47, 30000.00, 385789.47);

-- Sale 9: 1x Nissan Sentra to Delta Motors (CASH)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260502-0009', 280701.75, 0, 39298.25, 320000.00, 'cash', 'paid', 2, 4, '2026-05-02 11:30:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(9, 4, 1, 280701.75, 0, 280701.75);

-- Sale 10: 2x Toyota Camry to Red Sea Hotels (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260515-0010', 1140350.88, 40000.00, 153649.12, 1254000.00, 'bank_transfer', 'paid', 1, 9, '2026-05-15 16:00:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(10, 1, 2, 570175.44, 40000.00, 1100350.88);

-- Sale 11: 1x Komatsu Bulldozer to Hassan Construction (BANK TRANSFER)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260601-0011', 2807017.54, 100000.00, 378947.37, 3085964.91, 'bank_transfer', 'paid', 1, 1, '2026-06-01 10:15:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(11, 10, 1, 2807017.54, 100000.00, 2707017.54);

-- Sale 12: 1x Hyundai Tucson to Delta Motors (CARD)
INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total, payment_method, payment_status, user_id, customer_id, completed_at) VALUES
('ORD-20260615-0012', 631578.95, 0, 88421.05, 720000.00, 'card', 'paid', 1, 4, '2026-06-15 13:45:00');
INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total) VALUES
(12, 6, 1, 631578.95, 0, 631578.95);

-- ============================================================
-- STEP 12: SALES JOURNAL ENTRIES (Revenue + VAT)
-- ============================================================

-- JE 10: Sale 1 - Cash received
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260125-0010', '2026-01-25', 'Sale - ORD-20260125-0001', 'ORD-20260125-0001', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(10, 1, 655752.21, 0, 'Cash received from Hassan Construction'),
(10, 11, 0, 575221.24, 'Asset sales revenue'),
(10, 7, 0, 80530.97, 'VAT payable on sale');

-- JE 11: Sale 2 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260205-0011', '2026-02-05', 'Sale - ORD-20260205-0002', 'ORD-20260205-0002', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(11, 2, 737200.00, 0, 'Bank transfer from Alex Logistics'),
(11, 11, 0, 666666.67, 'Asset sales revenue'),
(11, 7, 0, 70533.33, 'VAT payable');

-- JE 12: Sale 3 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260215-0012', '2026-02-15', 'Sale - ORD-20260215-0003', 'ORD-20260215-0003', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(12, 2, 1850000.00, 0, 'Bank transfer from Oasis Real Estate'),
(12, 11, 0, 1622807.02, 'Asset sales revenue'),
(12, 7, 0, 227192.98, 'VAT payable');

-- JE 13: Sale 4 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260301-0013', '2026-03-01', 'Sale - ORD-20260301-0004', 'ORD-20260301-0004', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(13, 2, 2500000.00, 0, 'Bank transfer from Hassan Construction'),
(13, 11, 0, 2192982.46, 'Asset sales revenue'),
(13, 7, 0, 307017.54, 'VAT payable');

-- JE 14: Sale 5 - Cash
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260310-0014', '2026-03-10', 'Sale - ORD-20260310-0005', 'ORD-20260310-0005', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(14, 1, 420000.00, 0, 'Cash received from Nile Trading'),
(14, 11, 0, 368421.05, 'Asset sales revenue'),
(14, 7, 0, 51578.95, 'VAT payable');

-- JE 15: Sale 6 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260320-0015', '2026-03-20', 'Sale - ORD-20260320-0006', 'ORD-20260320-0006', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(15, 2, 45000.00, 0, 'Bank transfer from Cairo Tech'),
(15, 11, 0, 39473.68, 'Service revenue - office furniture'),
(15, 7, 0, 5526.32, 'VAT payable');

-- JE 16: Sale 7 - Cash
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260401-0016', '2026-04-01', 'Sale - ORD-20260401-0007', 'ORD-20260401-0007', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(16, 1, 1143000.00, 0, 'Cash received from Upper Egypt Cement'),
(16, 11, 0, 1052631.58, 'Asset sales revenue'),
(16, 7, 0, 90368.42, 'VAT payable');

-- JE 17: Sale 8 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260415-0017', '2026-04-15', 'Sale - ORD-20260415-0008', 'ORD-20260415-0008', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(17, 2, 1255600.00, 0, 'Bank transfer from Sinai Development'),
(17, 11, 0, 1131578.95, 'Asset sales revenue'),
(17, 7, 0, 124021.05, 'VAT payable');

-- JE 18: Sale 9 - Cash
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260502-0018', '2026-05-02', 'Sale - ORD-20260502-0009', 'ORD-20260502-0009', 'order', true, 2);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(18, 1, 320000.00, 0, 'Cash received from Delta Motors'),
(18, 11, 0, 280701.75, 'Asset sales revenue'),
(18, 7, 0, 39298.25, 'VAT payable');

-- JE 19: Sale 10 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260515-0019', '2026-05-15', 'Sale - ORD-20260515-0010', 'ORD-20260515-0010', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(19, 2, 1254000.00, 0, 'Bank transfer from Red Sea Hotels'),
(19, 11, 0, 1140350.88, 'Asset sales revenue'),
(19, 7, 0, 113649.12, 'VAT payable');

-- JE 20: Sale 11 - Bank transfer
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260601-0020', '2026-06-01', 'Sale - ORD-20260601-0011', 'ORD-20260601-0011', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(20, 2, 3085964.91, 0, 'Bank transfer from Hassan Construction'),
(20, 11, 0, 2807017.54, 'Asset sales revenue'),
(20, 7, 0, 278947.37, 'VAT payable');

-- JE 21: Sale 12 - Card
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260615-0021', '2026-06-15', 'Sale - ORD-20260615-0012', 'ORD-20260615-0012', 'order', true, 1);
INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(21, 2, 720000.00, 0, 'Card payment from Delta Motors'),
(21, 11, 0, 631578.95, 'Asset sales revenue'),
(21, 7, 0, 88421.05, 'VAT payable');

-- ============================================================
-- STEP 13: COGS JOURNAL ENTRIES (Cost of assets sold)
-- ============================================================

-- COGS entries: debit COGS, credit Inventory
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260125-0022', '2026-01-25', 'COGS - ORD-20260125-0001', 'ORD-20260125-0001', 'order', true, 1),
('JE-20260205-0023', '2026-02-05', 'COGS - ORD-20260205-0002', 'ORD-20260205-0002', 'order', true, 1),
('JE-20260215-0024', '2026-02-15', 'COGS - ORD-20260215-0003', 'ORD-20260215-0003', 'order', true, 1),
('JE-20260301-0025', '2026-03-01', 'COGS - ORD-20260301-0004', 'ORD-20260301-0004', 'order', true, 1),
('JE-20260310-0026', '2026-03-10', 'COGS - ORD-20260310-0005', 'ORD-20260310-0005', 'order', true, 2),
('JE-20260320-0027', '2026-03-20', 'COGS - ORD-20260320-0006', 'ORD-20260320-0006', 'order', true, 2),
('JE-20260401-0028', '2026-04-01', 'COGS - ORD-20260401-0007', 'ORD-20260401-0007', 'order', true, 1),
('JE-20260415-0029', '2026-04-15', 'COGS - ORD-20260415-0008', 'ORD-20260415-0008', 'order', true, 1),
('JE-20260502-0030', '2026-05-02', 'COGS - ORD-20260502-0009', 'ORD-20260502-0009', 'order', true, 2),
('JE-20260515-0031', '2026-05-15', 'COGS - ORD-20260515-0010', 'ORD-20260515-0010', 'order', true, 1),
('JE-20260601-0032', '2026-06-01', 'COGS - ORD-20260601-0011', 'ORD-20260601-0011', 'order', true, 1),
('JE-20260615-0033', 'COGS - ORD-20260615-0012', 'ORD-20260615-0012', 'order', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
-- COGS Sale 1: Camry cost 520,000
(22, 14, 520000.00, 0, 'COGS - Camry SE'),
(22, 5, 0, 520000.00, 'Inventory out - Camry SE'),
-- COGS Sale 2: 2x Elantra cost 620,000
(23, 14, 620000.00, 0, 'COGS - 2x Elantra'),
(23, 5, 0, 620000.00, 'Inventory out - 2x Elantra'),
-- COGS Sale 3: Land Cruiser cost 1,500,000
(24, 14, 1500000.00, 0, 'COGS - Land Cruiser VX'),
(24, 5, 0, 1500000.00, 'Inventory out - Land Cruiser'),
-- COGS Sale 4: CAT Excavator cost 2,000,000
(25, 14, 2000000.00, 0, 'COGS - CAT 320 Excavator'),
(25, 6, 0, 2000000.00, 'Inventory out - CAT 320'),
-- COGS Sale 5: Kia Cerato cost 340,000
(26, 14, 340000.00, 0, 'COGS - Kia Cerato EX'),
(26, 5, 0, 340000.00, 'Inventory out - Kia Cerato'),
-- COGS Sale 6: 3x Office desk cost 24,000
(27, 14, 24000.00, 0, 'COGS - 3x Executive Desk'),
(27, 6, 0, 24000.00, 'Inventory out - Desk sets'),
-- COGS Sale 7: JCB Backhoe cost 950,000
(28, 14, 950000.00, 0, 'COGS - JCB 3CX Backhoe'),
(28, 6, 0, 950000.00, 'Inventory out - JCB Backhoe'),
-- COGS Sale 8: MG ZS EV 700,000 + Hiace 380,000
(29, 14, 1080000.00, 0, 'COGS - MG ZS EV + Hiace'),
(29, 5, 0, 700000.00, 'Inventory out - MG ZS EV'),
(29, 5, 0, 380000.00, 'Inventory out - Hiace'),
-- COGS Sale 9: Nissan Sentra cost 260,000
(30, 14, 260000.00, 0, 'COGS - Nissan Sentra'),
(30, 5, 0, 260000.00, 'Inventory out - Sentra'),
-- COGS Sale 10: 2x Camry cost 1,040,000
(31, 14, 1040000.00, 0, 'COGS - 2x Camry SE'),
(31, 5, 0, 1040000.00, 'Inventory out - 2x Camry'),
-- COGS Sale 11: Komatsu Bulldozer cost 2,600,000
(32, 14, 2600000.00, 0, 'COGS - Komatsu D61'),
(32, 6, 0, 2600000.00, 'Inventory out - Komatsu'),
-- COGS Sale 12: Hyundai Tucson cost 580,000
(33, 14, 580000.00, 0, 'COGS - Hyundai Tucson'),
(33, 5, 0, 580000.00, 'Inventory out - Tucson');

-- ============================================================
-- STEP 14: EXPENSES (Operating costs Jan-Jun 2026)
-- ============================================================
INSERT INTO expenses (category, amount, description, recorded_by, expense_date) VALUES
('Rent', 85000.00, 'January showroom + office rent - Maadi', 1, '2026-01-01'),
('Utilities', 12000.00, 'Electricity + water + internet - January', 1, '2026-01-15'),
('Salaries', 185000.00, 'Staff salaries January (12 employees)', 1, '2026-01-28'),
('Insurance', 35000.00, 'Annual vehicle insurance premium - Q1', 1, '2026-01-10'),
('Marketing', 25000.00, 'Facebook + Google Ads - January', 1, '2026-01-20'),
('Vehicle Maintenance', 8500.00, 'Pre-sale inspection and detailing - 3 cars', 1, '2026-01-22'),
('Rent', 85000.00, 'February showroom + office rent', 1, '2026-02-01'),
('Utilities', 11500.00, 'Electricity + water + internet - February', 1, '2026-02-15'),
('Salaries', 185000.00, 'Staff salaries February', 1, '2026-02-28'),
('Vehicle Maintenance', 15000.00, 'Pre-sale service - 5 vehicles', 1, '2026-02-18'),
('Legal Fees', 12000.00, 'Vehicle transfer documentation fees', 1, '2026-02-25'),
('Rent', 85000.00, 'March showroom + office rent', 1, '2026-03-01'),
('Utilities', 13000.00, 'Electricity + water + internet - March', 1, '2026-03-15'),
('Salaries', 185000.00, 'Staff salaries March', 1, '2026-03-28'),
('Vehicle Maintenance', 22000.00, 'CAT excavator pre-sale service', 1, '2026-03-05'),
('Bank Charges', 4500.00, 'Q1 bank transaction fees', 1, '2026-03-31'),
('Travel', 6000.00, 'Alexandria trip - vehicle inspection', 1, '2026-03-12'),
('Rent', 85000.00, 'April showroom + office rent', 1, '2026-04-01'),
('Utilities', 14000.00, 'Electricity + water + internet - April', 1, '2026-04-15'),
('Salaries', 185000.00, 'Staff salaries April', 1, '2026-04-28'),
('Marketing', 35000.00, 'Spring campaign - billboards + digital', 1, '2026-04-10'),
('Vehicle Maintenance', 12000.00, 'Fleet prep - 4 vehicles', 1, '2026-04-20'),
('Rent', 85000.00, 'May showroom + office rent', 1, '2026-05-01'),
('Utilities', 15500.00, 'Electricity + water + internet - May', 1, '2026-05-15'),
('Salaries', 185000.00, 'Staff salaries May', 1, '2026-05-28'),
('Vehicle Maintenance', 18000.00, 'Bulldozer transport + inspection', 1, '2026-05-05'),
('Travel', 8500.00, 'South Sinai - government project delivery', 1, '2026-05-22'),
('Rent', 85000.00, 'June showroom + office rent', 1, '2026-06-01'),
('Utilities', 16000.00, 'Electricity + water + internet - June', 1, '2026-06-15'),
('Salaries', 185000.00, 'Staff salaries June', 1, '2026-06-28'),
('Marketing', 20000.00, 'Summer promotion - social media', 1, '2026-06-10'),
('Vehicle Maintenance', 9500.00, 'Final prep - 2 vehicles', 1, '2026-06-20'),
('Bank Charges', 5200.00, 'Q2 bank transaction fees', 1, '2026-06-30'),
('Insurance', 28000.00, 'Vehicle liability insurance renewal', 1, '2026-06-01');

-- ============================================================
-- STEP 15: EXPENSE JOURNAL ENTRIES
-- ============================================================

-- Jan expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260101-034', '2026-01-01', 'Rent expense - January', NULL, 'expense', true, 1),
('JE-20260115-035', '2026-01-15', 'Utilities expense - January', NULL, 'expense', true, 1),
('JE-20260128-036', '2026-01-28', 'Salary expense - January', NULL, 'expense', true, 1),
('JE-20260110-037', '2026-01-10', 'Insurance expense - Q1', NULL, 'expense', true, 1),
('JE-20260120-038', '2026-01-20', 'Marketing expense - January', NULL, 'expense', true, 1),
('JE-20260122-039', '2026-01-22', 'Vehicle maintenance - January', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(34, 18, 85000.00, 0, 'Rent expense - January'),
(34, 2, 0, 85000.00, 'Bank payment - January rent'),
(35, 19, 12000.00, 0, 'Utilities expense - January'),
(35, 1, 0, 12000.00, 'Cash payment - January utilities'),
(36, 17, 185000.00, 0, 'Salary expense - January'),
(36, 2, 0, 185000.00, 'Bank transfer - January salaries'),
(37, 22, 35000.00, 0, 'Insurance expense - Q1'),
(37, 2, 0, 35000.00, 'Bank payment - insurance'),
(38, 20, 25000.00, 0, 'Marketing expense - January'),
(38, 1, 0, 25000.00, 'Cash payment - marketing'),
(39, 21, 8500.00, 0, 'Vehicle maintenance - January'),
(39, 1, 0, 8500.00, 'Cash payment - maintenance');

-- Feb expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260201-040', '2026-02-01', 'Rent expense - February', NULL, 'expense', true, 1),
('JE-20260215-041', '2026-02-15', 'Utilities expense - February', NULL, 'expense', true, 1),
('JE-20260228-042', '2026-02-28', 'Salary expense - February', NULL, 'expense', true, 1),
('JE-20260218-043', '2026-02-18', 'Vehicle maintenance - February', NULL, 'expense', true, 1),
('JE-20260225-044', '2026-02-25', 'Legal fees - February', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(40, 18, 85000.00, 0, 'Rent expense - February'),
(40, 2, 0, 85000.00, 'Bank payment - February rent'),
(41, 19, 11500.00, 0, 'Utilities expense - February'),
(41, 1, 0, 11500.00, 'Cash payment - February utilities'),
(42, 17, 185000.00, 0, 'Salary expense - February'),
(42, 2, 0, 185000.00, 'Bank transfer - February salaries'),
(43, 21, 15000.00, 0, 'Vehicle maintenance - February'),
(43, 1, 0, 15000.00, 'Cash payment - maintenance'),
(44, 25, 12000.00, 0, 'Legal fees - vehicle transfers'),
(44, 2, 0, 12000.00, 'Bank payment - legal fees');

-- Mar expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260301-045', '2026-03-01', 'Rent expense - March', NULL, 'expense', true, 1),
('JE-20260315-046', '2026-03-15', 'Utilities expense - March', NULL, 'expense', true, 1),
('JE-20260328-047', '2026-03-28', 'Salary expense - March', NULL, 'expense', true, 1),
('JE-20260305-048', '2026-03-05', 'Vehicle maintenance - March', NULL, 'expense', true, 1),
('JE-20260331-049', '2026-03-31', 'Bank charges - Q1', NULL, 'expense', true, 1),
('JE-20260312-050', '2026-03-12', 'Travel expense - March', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(45, 18, 85000.00, 0, 'Rent expense - March'),
(45, 2, 0, 85000.00, 'Bank payment - March rent'),
(46, 19, 13000.00, 0, 'Utilities expense - March'),
(46, 1, 0, 13000.00, 'Cash payment - March utilities'),
(47, 17, 185000.00, 0, 'Salary expense - March'),
(47, 2, 0, 185000.00, 'Bank transfer - March salaries'),
(48, 21, 22000.00, 0, 'Vehicle maintenance - CAT service'),
(48, 1, 0, 22000.00, 'Cash payment - maintenance'),
(49, 24, 4500.00, 0, 'Bank charges - Q1'),
(49, 2, 0, 4500.00, 'Bank deduction - fees'),
(50, 26, 6000.00, 0, 'Travel - Alexandria inspection'),
(50, 1, 0, 6000.00, 'Cash payment - travel');

-- Apr expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260401-051', '2026-04-01', 'Rent expense - April', NULL, 'expense', true, 1),
('JE-20260415-052', '2026-04-15', 'Utilities expense - April', NULL, 'expense', true, 1),
('JE-20260428-053', '2026-04-28', 'Salary expense - April', NULL, 'expense', true, 1),
('JE-20260410-054', '2026-04-10', 'Marketing expense - April', NULL, 'expense', true, 1),
('JE-20260420-055', '2026-04-20', 'Vehicle maintenance - April', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(51, 18, 85000.00, 0, 'Rent expense - April'),
(51, 2, 0, 85000.00, 'Bank payment - April rent'),
(52, 19, 14000.00, 0, 'Utilities expense - April'),
(52, 1, 0, 14000.00, 'Cash payment - April utilities'),
(53, 17, 185000.00, 0, 'Salary expense - April'),
(53, 2, 0, 185000.00, 'Bank transfer - April salaries'),
(54, 20, 35000.00, 0, 'Marketing - spring campaign'),
(54, 2, 0, 35000.00, 'Bank payment - marketing'),
(55, 21, 12000.00, 0, 'Vehicle maintenance - April'),
(55, 1, 0, 12000.00, 'Cash payment - maintenance');

-- May expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260501-056', '2026-05-01', 'Rent expense - May', NULL, 'expense', true, 1),
('JE-20260515-057', '2026-05-15', 'Utilities expense - May', NULL, 'expense', true, 1),
('JE-20260528-058', '2026-05-28', 'Salary expense - May', NULL, 'expense', true, 1),
('JE-20260505-059', '2026-05-05', 'Vehicle maintenance - May', NULL, 'expense', true, 1),
('JE-20260522-060', '2026-05-22', 'Travel expense - May', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(56, 18, 85000.00, 0, 'Rent expense - May'),
(56, 2, 0, 85000.00, 'Bank payment - May rent'),
(57, 19, 15500.00, 0, 'Utilities expense - May'),
(57, 1, 0, 15500.00, 'Cash payment - May utilities'),
(58, 17, 185000.00, 0, 'Salary expense - May'),
(58, 2, 0, 185000.00, 'Bank transfer - May salaries'),
(59, 21, 18000.00, 0, 'Vehicle maintenance - bulldozer transport'),
(59, 1, 0, 18000.00, 'Cash payment - maintenance'),
(60, 26, 8500.00, 0, 'Travel - South Sinai delivery'),
(60, 1, 0, 8500.00, 'Cash payment - travel');

-- Jun expenses
INSERT INTO journal_entries (entry_number, date, description, reference, source_type, is_posted, created_by) VALUES
('JE-20260601-061', '2026-06-01', 'Rent expense - June', NULL, 'expense', true, 1),
('JE-20260615-062', '2026-06-15', 'Utilities expense - June', NULL, 'expense', true, 1),
('JE-20260628-063', '2026-06-28', 'Salary expense - June', NULL, 'expense', true, 1),
('JE-20260610-064', '2026-06-10', 'Marketing expense - June', NULL, 'expense', true, 1),
('JE-20260620-065', '2026-06-20', 'Vehicle maintenance - June', NULL, 'expense', true, 1),
('JE-20260630-066', '2026-06-30', 'Bank charges - Q2', NULL, 'expense', true, 1),
('JE-20260601-067', '2026-06-01', 'Insurance renewal - June', NULL, 'expense', true, 1);

INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES
(61, 18, 85000.00, 0, 'Rent expense - June'),
(61, 2, 0, 85000.00, 'Bank payment - June rent'),
(62, 19, 16000.00, 0, 'Utilities expense - June'),
(62, 1, 0, 16000.00, 'Cash payment - June utilities'),
(63, 17, 185000.00, 0, 'Salary expense - June'),
(63, 2, 0, 185000.00, 'Bank transfer - June salaries'),
(64, 20, 20000.00, 0, 'Marketing - summer promo'),
(64, 2, 0, 20000.00, 'Bank payment - marketing'),
(65, 21, 9500.00, 0, 'Vehicle maintenance - June'),
(65, 1, 0, 9500.00, 'Cash payment - maintenance'),
(66, 24, 5200.00, 0, 'Bank charges - Q2'),
(66, 2, 0, 5200.00, 'Bank deduction - fees'),
(67, 22, 28000.00, 0, 'Insurance renewal'),
(67, 2, 0, 28000.00, 'Bank payment - insurance');

-- ============================================================
-- STEP 16: PAYMENTS TRACKING
-- ============================================================
INSERT INTO payments (payment_number, payment_type, method, amount, partner_type, partner_id, reference, payment_date, recorded_by) VALUES
-- Outbound: Supplier payments
('PAY-20260110-0001', 'outbound', 'bank_transfer', 1560000.00, 'supplier', 1, '3x Toyota Camry purchase', '2026-01-10', 1),
('PAY-20260120-0002', 'outbound', 'bank_transfer', 2000000.00, 'supplier', 2, '2x Land Cruiser partial', '2026-01-20', 1),
('PAY-20260201-0003', 'outbound', 'bank_transfer', 1500000.00, 'supplier', 3, 'CAT Excavator partial', '2026-02-01', 1),
('PAY-20260210-0004', 'outbound', 'bank_transfer', 160000.00, 'supplier', 4, 'Office furniture', '2026-02-10', 1),
('PAY-20260220-0005', 'outbound', 'bank_transfer', 2090000.00, 'supplier', 1, 'Trucks + Vans purchase', '2026-02-20', 1),
-- Outbound: Operating expenses
('PAY-20260101-0006', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'January rent', '2026-01-01', 1),
('PAY-20260128-0007', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'January salaries', '2026-01-28', 1),
('PAY-20260201-0008', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'February rent', '2026-02-01', 1),
('PAY-20260228-0009', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'February salaries', '2026-02-28', 1),
('PAY-20260301-0010', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'March rent', '2026-03-01', 1),
('PAY-20260328-0011', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'March salaries', '2026-03-28', 1),
('PAY-20260401-0012', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'April rent', '2026-04-01', 1),
('PAY-20260428-0013', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'April salaries', '2026-04-28', 1),
('PAY-20260501-0014', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'May rent', '2026-05-01', 1),
('PAY-20260528-0015', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'May salaries', '2026-05-28', 1),
('PAY-20260601-0016', 'outbound', 'bank_transfer', 85000.00, NULL, NULL, 'June rent', '2026-06-01', 1),
('PAY-20260628-0017', 'outbound', 'bank_transfer', 185000.00, NULL, NULL, 'June salaries', '2026-06-28', 1),
-- Inbound: Customer payments
('PAY-20260125-0018', 'inbound', 'cash', 655752.21, 'customer', 1, 'Camry sale - Hassan Construction', '2026-01-25', 1),
('PAY-20260205-0019', 'inbound', 'bank_transfer', 737200.00, 'customer', 2, '2x Elantra - Alex Logistics', '2026-02-05', 1),
('PAY-20260215-0020', 'inbound', 'bank_transfer', 1850000.00, 'customer', 5, 'Land Cruiser - Oasis Real Estate', '2026-02-15', 1),
('PAY-20260301-0021', 'inbound', 'bank_transfer', 2500000.00, 'customer', 1, 'CAT Excavator - Hassan Construction', '2026-03-01', 1),
('PAY-20260310-0022', 'inbound', 'cash', 420000.00, 'customer', 3, 'Kia Cerato - Nile Trading', '2026-03-10', 2),
('PAY-20260320-0023', 'inbound', 'bank_transfer', 45000.00, 'customer', 7, 'Office desks - Cairo Tech', '2026-03-20', 2),
('PAY-20260401-0024', 'inbound', 'cash', 1143000.00, 'customer', 10, 'JCB Backhoe - Upper Egypt Cement', '2026-04-01', 1),
('PAY-20260415-0025', 'inbound', 'bank_transfer', 1255600.00, 'customer', 8, 'MG ZS EV + Hiace - Sinai Dev', '2026-04-15', 1),
('PAY-20260502-0026', 'inbound', 'cash', 320000.00, 'customer', 4, 'Nissan Sentra - Delta Motors', '2026-05-02', 2),
('PAY-20260515-0027', 'inbound', 'bank_transfer', 1254000.00, 'customer', 9, '2x Camry - Red Sea Hotels', '2026-05-15', 1),
('PAY-20260601-0028', 'inbound', 'bank_transfer', 3085964.91, 'customer', 1, 'Komatsu Bulldozer - Hassan Const', '2026-06-01', 1),
('PAY-20260615-0029', 'inbound', 'card', 720000.00, 'customer', 4, 'Tucson - Delta Motors', '2026-06-15', 1);

-- ============================================================
-- STEP 17: UPDATE ACCOUNT BALANCES
-- ============================================================

-- Cash on Hand (1010): Opening 2M + cash sales - cash expenses
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1010')
) WHERE code = '1010';

-- Bank Account (1020): Opening 3M + loan 2M + bank sales - bank payments
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1020')
) WHERE code = '1020';

-- Accounts Receivable (1030): All customer payments received, should be 0
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1030')
) WHERE code = '1030';

-- Petty Cash (1040)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1040')
) WHERE code = '1040';

-- Inventory - Vehicles (1050): Opening + purchases - COGS
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1050')
) WHERE code = '1050';

-- Inventory - Equipment (1060): Purchases - COGS
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1060')
) WHERE code = '1060';

-- Prepaid Insurance (1100)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1100')
) WHERE code = '1100';

-- Security Deposits (1200)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '1200')
) WHERE code = '1200';

-- Accounts Payable (2010): Supplier purchases on credit
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '2010')
) WHERE code = '2010';

-- Bank Loan (2020): 2M term loan
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '2020')
) WHERE code = '2020';

-- VAT Payable (2030): Collected from sales
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '2030')
) WHERE code = '2030';

-- Owner Equity (3010): 5M
UPDATE accounts SET balance = 5000000.00 WHERE code = '3010';

-- Asset Sales Revenue (4010): All order subtotals
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '4010')
) WHERE code = '4010';

-- Service Revenue (4020): Office furniture sales
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(credit - debit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '4020')
) WHERE code = '4020';

-- Cost of Assets Sold (5010): Total COGS
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5010')
) WHERE code = '5010';

-- Salary Expense (5030)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5030')
) WHERE code = '5030';

-- Rent Expense (5040)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5040')
) WHERE code = '5040';

-- Utilities Expense (5050)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5050')
) WHERE code = '5050';

-- Marketing Expense (5060)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5060')
) WHERE code = '5060';

-- Vehicle Maintenance (5070)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5070')
) WHERE code = '5070';

-- Insurance Expense (5080)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5080')
) WHERE code = '5080';

-- Bank Charges (5100)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5100')
) WHERE code = '5100';

-- Legal Fees (5110)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5110')
) WHERE code = '5110';

-- Travel (5120)
UPDATE accounts SET balance = (
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM journal_entry_lines
  WHERE account_id = (SELECT id FROM accounts WHERE code = '5120')
) WHERE code = '5120';
