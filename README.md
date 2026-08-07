# Store Management - POS & Stock System

A full-stack retail store management application with Point of Sale (POS), Inventory/Stock management, Accounting, HR, and Reporting features. Supports English and Arabic with full RTL layout. Includes offline POS support and PWA installability.

## Features

### POS (Point of Sale)
- Product grid with search, category filtering, and barcode scanning
- Continuous barcode scanner mode with scan counter and green flash feedback
- Quick product add to cart with quantity adjustment
- Multiple payment methods (Cash, Card, Mobile Payment)
- Split payments support
- Promo code application with discount calculation
- Receipt generation and printing (new-window print)
- Cart persists across sessions
- Browser zoom-safe layout (cart stays visible at any zoom level)
- **Offline POS**: IndexedDB caching of products, categories, customers, settings; orders queued locally when offline and synced automatically when back online

### Stock/Inventory Management
- Full product catalog with CRUD operations (name, SKU, barcode, price, cost, stock)
- Supplier assignment per product
- Stock tracking with quantity management
- Stock receive with supplier selection (auto-posts AP journal)
- Stock adjustments
- Low stock alerts and notifications
- Category management with Arabic/English support
- Bulk inventory print report (GARD / جرد) — one-click A4 print layout

### Supplier Management
- Supplier directory with contact info (name, phone, email, address)
- **Per-supplier AP tracking** — each supplier gets a unique Accounts Payable account (e.g., `2010-S1`)
- **Remaining balance display** on each supplier card (what you owe them)
- Link suppliers to products
- Activity logging on all CRUD operations

### Customer Management
- Customer directory with purchase history
- Customer selection during POS checkout
- Loyalty points tracking

### Promotions & Discounts
- Percentage and fixed-amount discounts
- Date-range validity with start/end dates
- Usage limits and per-customer limits
- Minimum purchase requirements
- WhatsApp promotion sending via Resend

### Refunds
- **Item-level refunds** — select specific items to refund, not just full order
- **Full order refund** — refund everything at once
- Automatic proportional VAT and promotion discount calculation on partial refunds
- Reason tracking per refund
- Automatic stock restoration (only for refunded items)
- Accounting journal auto-posted for refunds (including COGS/inventory reversal)
- Partial refund tracking (order can have multiple partial refunds until fully refunded)

### Expenses
- Expense tracking with categories (Rent, Utilities, Salaries, Supplies, Marketing, Other)
- Monthly expense overview with charts
- Accounting journal auto-posted per expense (category-aware account mapping)

### Invoices
- View all orders with status badges (Paid, Refunded)
- Search and filter orders
- Print receipt for any order

### Full Accounting System (Double-Entry)
- **Chart of Accounts** — 21 default accounts (Assets, Liabilities, Equity, Revenue, Expenses). Custom accounts supported. Per-supplier AP accounts auto-created.
- **Journal Entries** — Double-entry bookkeeping with multi-line entries. Debit/credit validation, auto-balancing, reversal support.
- **Payments** — Inbound (customer payments) and outbound (supplier/expense payments). Auto-generates journal entries.
- **Auto-Posting Engine** — Orders, refunds, expenses, stock receives, and product lifecycle events automatically generate balanced journal entries.
  - **Orders**: Debit AR (1030), Credit Sales (4010), Credit VAT (2030), Debit COGS (5010), Credit Inventory (1050)
  - **Payments**: Debit Cash/Bank (1010/1020), Credit AR (1030) — separate journal per payment split
  - **Refunds**: Debit Sales Returns (4020), Credit Cash (1010), Debit Inventory (1050), Credit COGS (5010) — item-level cost lookup from products table
  - **Expenses**: Debit Expense Account (5020-5050), Credit Cash (1010) — category-aware mapping
  - **Stock Receive**: Debit Inventory (1050), Credit Supplier AP (2010-Sx) — per-supplier tracking
  - **Product create/update/delete**: COGS and inventory adjustments auto-posted
- **Financial Reports** (4 tabs):
  - Trial Balance
  - Balance Sheet
  - Profit & Loss Statement
  - Fiscal Period management (open/close periods)
  - Account Ledger with date filtering
- **Set Initial Capital** — record opening equity balance
- **Recalculate Balances** — recompute all account balances from journal entries
- **Print Reports** — clean print window for inventory, accounting reports in A4 layout
- **Permissions:** `ACCOUNTING_VIEW`, `ACCOUNTING_EDIT`, `ACCOUNTING_POST`

### HR / Employees
- Employee directory with roles, contact info, salary
- Link employees to system users
- Activity logging

### Activity Log / Audit Trail
- Automatic logging of 25+ action types across all modules
- Tracks: created, updated, deleted, toggled_active, status changes, toggled_paid, refunds
- Filterable by entity type, action, date range
- Paginated table with user attribution
- Manager-only access control

### Role-Based Access Control (RBAC)
- **9 roles:** Manager, Sales Manager, Cashier, Senior Cashier, Inventory Clerk, Sales Associate, Viewer, Accountant
- 20+ granular permissions: `pos_access`, `inventory_view/edit`, `reports_view`, `suppliers_view/edit`, `promotions_view/edit`, `settings_view/edit`, `user_manage`, `customers_view/edit`, `expenses_view/edit`, `refunds_view/edit`, `employees_view/edit`, `accounting_view/edit/post`
- Role-based dashboard — each role sees only relevant widgets and stats
- Manager has full access to all features

### Force Password Change
- New users (created by admin) are forced to change password on first login
- Profile page password change logs out user after saving
- Modal blocks entire UI until password is changed

### Session Timeout
- Automatic session expiry after configurable inactivity period
- Session timeout handler redirects to login

### User Profile
- Read-only user data display (name, username, role, status, last login, member since)
- Editable phone and email fields
- Change password functionality with logout after save

### Reports & Analytics
- Sales reports (daily, weekly, monthly, yearly)
- Top selling products
- Stock value reports with total cost and potential profit
- Low stock alerts
- Expense reports with daily breakdown
- Profit & Loss report
- Sales trend charts (Recharts)
- Role-based dashboard visibility

### Settings
- **Store logo upload** — PNG/JPG/SVG (max 512KB), displayed in sidebar, login page, and collapsed sidebar
- Store name, address, phone configuration
- Tax rate settings (default 14% VAT)
- Currency settings (default EGP / ج.م)
- Low stock threshold configuration
- Loyalty points per currency unit
- Receipt footer customization
- Settings stored in Supabase database (not localStorage)

### Bilingual Support
- Full English and Arabic translation (300+ keys)
- RTL layout support with `text-start`/`text-end` alignment
- Language preference persists in localStorage
- Arabic store name: متجرى

### Theme
- Dark mode and Light mode toggle
- Theme preference persists in localStorage
- Sidebar always dark gradient (regardless of theme)

### Offline & PWA
- **IndexedDB caching** for products, categories, customers, settings
- **Offline order queue** — orders created offline are synced when connection is restored
- **Sync panel** in header — shows online/offline status, pending orders count, sync progress
- **PWA manifest** — installable on mobile and desktop

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS, Zustand, Recharts, Lucide React icons, idb (IndexedDB)
- **Backend:** Node.js, Express 5, bcryptjs, jsonwebtoken
- **Database:** Supabase (PostgreSQL) with Row Level Security (24 tables)
- **Email:** Resend API (not SMTP — Railway blocks outbound SMTP)
- **State Management:** Zustand with localStorage persistence
- **Offline Storage:** IndexedDB via `idb` library

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Osamafrahat/store-management.git
   cd store-management
   ```

2. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project

3. **Run the database schema:**
   - Open `server/supabase-schema.sql` in Supabase SQL Editor and run it
   - This is a **single consolidated file** that creates all 24 tables, indexes, RLS policies, admin user, chart of accounts (21 accounts), and default settings

4. **Get Supabase credentials:**
   - Go to Project Settings > API
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`

5. **Create `.env` file in `server/` directory:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3001
   JWT_SECRET=your_secret_key_here
   RESEND_API_KEY=your_resend_api_key
   ```

6. **Install dependencies and start:**

   **Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

   **Frontend (new terminal):**
   ```bash
   cd client
   npm install
   npm run dev
   ```

7. **Open your browser:** `http://localhost:5173`

### Default Login
- **Username:** `admin`
- **Password:** `admin123`
- On first login, you will be forced to change the password

### Reset Data (Optional)
- Run `server/reset-all-data.sql` in Supabase SQL Editor to clear all transactional data and re-seed settings and chart of accounts. Keeps users intact.

## Project Structure

```
store-management/
├── client/                          # React frontend
│   ├── public/
│   │   └── manifest.json            # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.jsx       # App shell: sidebar, header, mobile nav, offline indicator
│   │   │   ├── inventory/
│   │   │   │   ├── CategoryManager.jsx
│   │   │   │   ├── InventoryPrintSheet.jsx
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   └── ProductList.jsx
│   │   │   ├── pos/
│   │   │   │   ├── BarcodeScanner.jsx   # Continuous barcode scanner
│   │   │   │   ├── Cart.jsx
│   │   │   │   ├── PaymentModal.jsx
│   │   │   │   ├── ProductGrid.jsx
│   │   │   │   └── ReceiptModal.jsx
│   │   │   ├── notifications/
│   │   │   │   └── SendPromotionModal.jsx
│   │   │   ├── BarcodePrinter.jsx
│   │   │   ├── ForcePasswordChange.jsx
│   │   │   ├── SessionTimeout.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── POSPage.jsx
│   │   │   ├── InventoryPage.jsx
│   │   │   ├── SuppliersPage.jsx     # Shows remaining AP balance per supplier
│   │   │   ├── CustomersPage.jsx
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   ├── PromotionsPage.jsx
│   │   │   ├── RefundsPage.jsx       # Item-level refund with VAT/promo calculation
│   │   │   ├── InvoicesPage.jsx      # View/print all invoices
│   │   │   ├── UsersPage.jsx
│   │   │   ├── ActivitiesPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── SettingsPage.jsx      # Store logo upload + all settings
│   │   │   ├── ReportsPage.jsx       # Sales, Stock, Expenses, P&L tabs
│   │   │   ├── ChartOfAccountsPage.jsx
│   │   │   ├── JournalEntriesPage.jsx
│   │   │   ├── PaymentsPage.jsx
│   │   │   └── AccountingReportsPage.jsx
│   │   ├── stores/
│   │   │   ├── appStore.js
│   │   │   ├── userStore.js
│   │   │   ├── cartStore.js
│   │   │   ├── offlineStore.js       # Online/offline state, sync queue
│   │   │   └── productStore.js
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   ├── offlineDB.js          # IndexedDB wrapper
│   │   │   ├── translations.js       # EN/AR (300+ keys)
│   │   │   ├── translateDescription.js
│   │   │   └── utils.js
│   │   └── index.css
│   └── package.json
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   ├── orders.js            # Background processing, payment journals
│   │   │   ├── refunds.js           # Item-level refunds with VAT/promo calculation
│   │   │   ├── expenses.js
│   │   │   ├── suppliers.js         # Returns AP balance per supplier
│   │   │   ├── customers.js
│   │   │   ├── employees.js
│   │   │   ├── promotions.js
│   │   │   ├── users.js
│   │   │   ├── settings.js
│   │   │   ├── activities.js
│   │   │   ├── accounts.js          # Chart of accounts, initial capital
│   │   │   ├── journals.js
│   │   │   ├── payments.js
│   │   │   ├── accountingReports.js
│   │   │   ├── reports.js           # Sales, stock, expenses, P&L reports
│   │   │   ├── stock.js
│   │   │   ├── sync.js              # Offline order sync endpoint
│   │   │   └── email.js
│   │   ├── services/
│   │   │   ├── accountingEngine.js  # Double-entry engine, 21 accounts, auto-posting
│   │   │   ├── emailService.js      # Resend API (not SMTP)
│   │   │   └── whatsappService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── activityLogger.js
│   │   │   └── errorHandler.js
│   │   └── db/
│   │       ├── supabase.js
│   │       └── seed.js
│   ├── supabase-schema.sql          # Complete schema (24 tables, indexes, RLS, seeds)
│   ├── reset-all-data.sql           # Truncate data, re-seed settings & accounts
│   └── package.json
│
├── README.md
├── QUICKSTART.md
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/register` - Register new user (sets must_change_password: true)
- `POST /api/auth/change-password` - Change password (requires auth)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update phone and email

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `POST /api/products` - Create product (auto-posts COGS/inventory journal if initial stock)
- `PUT /api/products/:id` - Update product (auto-posts COGS/inventory adjustment)
- `DELETE /api/products/:id` - Delete product (auto-posts COGS/inventory reversal)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID (with items, payments)
- `POST /api/orders` - Create order (responds immediately, background: stock update, payment journals, accounting)

### Refunds
- `GET /api/refunds` - Get all refunds
- `GET /api/refunds/:id` - Get refund by ID (with refund_items)
- `POST /api/refunds` - Create refund (supports `items[]` for item-level, `is_partial` for partial refunds)

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense (auto-posts accounting journal)

### Suppliers
- `GET /api/suppliers` - Get all suppliers (includes AP balance per supplier)
- `POST /api/suppliers` - Create supplier (auto-assigns account_code)
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Promotions
- `GET /api/promotions` - Get all promotions
- `POST /api/promotions/validate` - Validate promo code
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:id` - Update promotion
- `DELETE /api/promotions/:id` - Delete promotion

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user (must_change_password: true)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-active` - Toggle user active status

### Accounting
- `GET /api/accounting/accounts` - Get all accounts
- `POST /api/accounting/accounts` - Create account
- `PUT /api/accounting/accounts/:id` - Update account
- `DELETE /api/accounting/accounts/:id` - Delete account
- `POST /api/accounting/accounts/seed` - Seed default chart of accounts
- `POST /api/accounting/accounts/recalculate-balances` - Recalculate all balances
- `POST /api/accounting/accounts/initial-capital` - Set initial capital (owner equity)
- `GET /api/accounting/journals` - Get journal entries
- `POST /api/accounting/journals` - Create journal entry
- `GET /api/accounting/journals/:id` - Get journal entry details
- `POST /api/accounting/journals/:id/reverse` - Reverse a journal entry
- `DELETE /api/accounting/journals/:id` - Delete draft journal entry
- `GET /api/accounting/reports/trial-balance` - Trial balance report
- `GET /api/accounting/reports/balance-sheet` - Balance sheet
- `GET /api/accounting/reports/profit-loss` - Profit & loss statement
- `GET /api/accounting/reports/account-ledger/:id` - Account ledger
- `GET /api/accounting/reports/fiscal-periods` - Fiscal periods
- `POST /api/accounting/reports/fiscal-periods/close` - Close fiscal period
- `GET /api/accounting/payments` - Get all payments
- `POST /api/accounting/payments` - Create payment (auto-posts journal)

### Stock
- `POST /api/stock/receive` - Receive stock from supplier (auto-posts AP journal)
- `POST /api/stock/adjust` - Adjust stock

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/stock` - Stock report with total cost and potential profit
- `GET /api/reports/expenses` - Expense report with daily breakdown
- `GET /api/reports/profit-loss` - P&L report

### Sync (Offline)
- `POST /api/sync/order` - Sync a single offline order
- `POST /api/sync/bulk` - Bulk sync multiple offline orders
- `GET /api/sync/status` - Get sync status (pending count)

### Email
- `POST /api/email/send-promotion` - Send promotion via WhatsApp/email (Resend API)

### Activity Log
- `GET /api/activities` - Get activity log (manager-only)
- `GET /api/activities/stats` - Get activity statistics (manager-only)

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings (includes storeLogo)

## Database

- **Schema file:** `server/supabase-schema.sql` — single consolidated file with all 24 tables
- **Reset file:** `server/reset-all-data.sql` — clears transactional data, re-seeds settings & accounts
- **24 tables:** users, categories, suppliers, products, customers, employees, orders, order_items, payment_splits, stock_movements, promotions, store_settings, expenses, refunds, refund_items, notifications, activity_log, accounts, fiscal_periods, journal_entries, journal_entry_lines, payments, account_balances
- **21 chart of accounts:** 1010-5050 (Assets, Liabilities, Equity, Revenue, Expenses)
- **RLS enabled** on all tables with open policies

## Default Settings

- **Store Name:** My Store (configurable via Settings)
- **Currency:** EGP (ج.م)
- **Tax Rate:** 14% VAT
- **Low Stock Threshold:** 10 units

## License

MIT
