# Store Management - POS & Stock System

A full-stack retail store management application with Point of Sale (POS), Inventory/Stock management, Accounting, HR, and Reporting features. Supports English and Arabic with full RTL layout.

## Features

### POS (Point of Sale)
- Product grid with search, category filtering, and barcode scanning
- Quick product add to cart with quantity adjustment
- Multiple payment methods (Cash, Card, Mobile Payment)
- Split payments support
- Promo code application with discount calculation
- Receipt generation and printing (new-window print)
- Cart persists across sessions
- Browser zoom-safe layout (cart stays visible at any zoom level)

### Stock/Inventory Management
- Full product catalog with CRUD operations (name, SKU, barcode, price, cost, stock)
- Supplier assignment per product
- Stock tracking with quantity management
- Low stock alerts and notifications
- Category management with Arabic/English support
- Bulk inventory print report (GARD / جرد) — one-click print layout with checkbox column

### Supplier Management
- Supplier directory with contact info (name, phone, email, address)
- Link suppliers to products
- Activity logging on all CRUD operations

### Customer Management
- Customer directory with purchase history
- Customer selection during POS checkout
- Loyalty tracking

### Promotions & Discounts
- Percentage and fixed-amount discounts
- Date-range validity with start/end dates
- Usage limits and per-customer limits
- Minimum purchase requirements
- Auto-apply or code-based promotions

### Refunds
- Full and partial refund support
- Reason tracking per refund
- Automatic stock restoration
- Accounting journal auto-posted for refunds (including COGS/inventory reversal)

### Expenses
- Expense tracking with categories (Rent, Utilities, Salaries, Supplies, Marketing, Other)
- Monthly expense overview with charts
- Accounting journal auto-posted per expense (category-aware account mapping)

### Full Accounting System (Odoo-Style Double-Entry)
- **Chart of Accounts** — 17 default accounts (Assets, Liabilities, Equity, Revenue, Expenses) with hierarchical grouping. Create custom accounts. Seed accounts with one click.
- **Journal Entries** — Double-entry bookkeeping with multi-line entries. Debit/credit validation, auto-balancing, reversal support.
- **Payments** — Inbound (customer payments) and outbound (supplier/expense payments). Auto-generates journal entries.
- **Auto-Posting Engine** — Orders, refunds, and expenses automatically generate balanced journal entries.
  - Orders: Debit Cash/Bank, Credit Sales Revenue, Credit VAT Payable, Debit COGS, Credit Inventory
  - Refunds: Reversal entries including COGS/inventory restoration
  - Expenses: Category-aware account mapping (Rent→5040, Utilities→5050, Salary→5030)
- **Financial Reports:**
  - Trial Balance
  - Balance Sheet
  - Profit & Loss Statement
  - Account Ledger
  - Fiscal Period management (open/close periods)
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

### User Profile
- Read-only user data display (name, username, role, status, last login, member since)
- Editable phone and email fields
- Change password functionality with logout after save

### Reports & Analytics
- Sales reports (daily, weekly, monthly, yearly)
- Top selling products
- Stock value reports
- Low stock alerts
- Sales trend charts (Recharts)
- Role-based dashboard visibility

### Settings
- Store name, address, phone, logo configuration
- Tax rate settings (default 14% VAT)
- Currency settings (default EGP / ج.م)
- Low stock threshold configuration
- Settings stored in Supabase database (not localStorage)

### Bilingual Support
- Full English and Arabic translation (250+ keys)
- RTL layout support with `text-start`/`text-end` alignment
- Language preference persists in localStorage
- Arabic store name: متجر النيل

### Theme
- Dark mode and Light mode toggle
- Theme preference persists in localStorage
- Sidebar always dark gradient (regardless of theme)

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS, Zustand, Recharts, Lucide React icons
- **Backend:** Node.js, Express 5, bcryptjs, jsonwebtoken
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **State Management:** Zustand with localStorage persistence

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Osamafrahat/store-management.git
   cd store-management
   ```

2. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project

3. **Run the database schema:**
   - Open `server/supabase-schema.sql` in Supabase SQL Editor and run it
   - This creates all tables: users, products, categories, suppliers, customers, employees, orders, order_items, refunds, expenses, promotions, settings, activity_log, and all accounting tables

4. **Seed sample data (optional):**
   - Run `server/seed-data.sql` in Supabase SQL Editor to populate accounting journal entries and opening balances

5. **Run the phone column migration (if needed):**
   - Run `server/add-phone-column.sql` in Supabase SQL Editor

6. **Get Supabase credentials:**
   - Go to Project Settings > API
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`

7. **Create `.env` file in `server/` directory:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3001
   JWT_SECRET=your_secret_key_here
   ```

8. **Install dependencies and start:**

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

9. **Open your browser:** `http://localhost:5173`

### Default Login
- **Username:** `admin`
- **Password:** `admin123`
- On first login, you will be forced to change the password

## Project Structure

```
store-management/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.jsx       # App shell: Odoo-style grouped sidebar, header, mobile nav
│   │   │   ├── inventory/
│   │   │   │   ├── ProductForm.jsx  # Product create/edit form with supplier dropdown
│   │   │   │   └── InventoryPrintSheet.jsx  # Print-ready inventory report
│   │   │   ├── pos/
│   │   │   │   ├── Cart.jsx         # POS cart with item management
│   │   │   │   ├── PaymentModal.jsx # Multi-method payment processing
│   │   │   │   └── ReceiptModal.jsx # Receipt display and print
│   │   │   ├── BarcodePrinter.jsx   # Barcode label generator
│   │   │   ├── ForcePasswordChange.jsx  # Forced password change modal
│   │   │   └── Toast.jsx            # Toast notification system
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Authentication
│   │   │   ├── DashboardPage.jsx    # Role-based dashboard with charts
│   │   │   ├── POSPage.jsx          # Point of Sale interface
│   │   │   ├── InventoryPage.jsx    # Product & stock management
│   │   │   ├── SuppliersPage.jsx    # Supplier directory
│   │   │   ├── CustomersPage.jsx    # Customer directory
│   │   │   ├── EmployeesPage.jsx    # Employee directory
│   │   │   ├── ExpensesPage.jsx     # Expense tracking
│   │   │   ├── PromotionsPage.jsx   # Discount & promotion management
│   │   │   ├── RefundsPage.jsx      # Refund processing
│   │   │   ├── UsersPage.jsx        # User management with RBAC
│   │   │   ├── ActivitiesPage.jsx   # Activity log / audit trail
│   │   │   ├── ProfilePage.jsx      # User profile with password change
│   │   │   ├── SettingsPage.jsx     # Store settings
│   │   │   ├── ReportsPage.jsx      # Sales & stock reports
│   │   │   ├── ChartOfAccountsPage.jsx   # Accounting: chart of accounts
│   │   │   ├── JournalEntriesPage.jsx    # Accounting: journal entries
│   │   │   ├── PaymentsPage.jsx          # Accounting: payment tracking
│   │   │   └── AccountingReportsPage.jsx # Accounting: trial balance, P&L, balance sheet
│   │   ├── stores/
│   │   │   ├── appStore.js          # App state, settings, theme, language
│   │   │   ├── userStore.js         # Auth, permissions, roles, RBAC logic
│   │   │   └── cartStore.js         # POS cart state
│   │   ├── lib/
│   │   │   ├── api.js               # API client (axios with auth interceptor)
│   │   │   └── translations.js      # EN/AR translation keys (250+)
│   │   └── index.css                # Tailwind + RTL table styles
│   └── package.json
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js              # Login, register, change-password, profile
│   │   │   ├── products.js          # CRUD + activity logging
│   │   │   ├── categories.js        # CRUD + activity logging
│   │   │   ├── orders.js            # Orders + auto-post accounting journal
│   │   │   ├── refunds.js           # Refunds + auto-post accounting journal
│   │   │   ├── expenses.js          # Expenses + auto-post accounting journal
│   │   │   ├── suppliers.js         # CRUD + activity logging
│   │   │   ├── customers.js         # CRUD + activity logging
│   │   │   ├── employees.js         # CRUD + user linking
│   │   │   ├── promotions.js        # CRUD + activity logging
│   │   │   ├── users.js             # User management with password flags
│   │   │   ├── settings.js          # Store settings (Supabase)
│   │   │   ├── activities.js        # Activity log (manager-only)
│   │   │   ├── accounts.js          # Accounting: chart of accounts CRUD
│   │   │   ├── journals.js          # Accounting: journal entries
│   │   │   ├── payments.js          # Accounting: payments with auto-journal
│   │   │   └── accountingReports.js # Accounting: reports (trial balance, P&L, etc.)
│   │   ├── services/
│   │   │   └── accountingEngine.js  # Double-entry bookkeeping engine
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication middleware
│   │   │   └── activityLogger.js    # Audit trail logging middleware
│   │   └── db/
│   │       └── supabase.js          # Supabase client
│   ├── supabase-schema.sql          # Full database schema
│   ├── seed-data.sql                # Sample journal entries (54 entries, 131 lines)
│   └── package.json
│
└── README.md
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
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (auto-posts accounting journal)

### Refunds
- `GET /api/refunds` - Get all refunds
- `POST /api/refunds` - Create refund (auto-posts accounting journal)

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense (auto-posts accounting journal)

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
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
- `POST /api/accounting/accounts/seed` - Seed default chart of accounts
- `POST /api/accounting/accounts/recalculate-balances` - Recalculate all balances
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
- `PUT /api/accounting/payments/:id` - Update payment
- `DELETE /api/accounting/payments/:id` - Delete payment

### Activity Log
- `GET /api/activities` - Get activity log (manager-only)
- `GET /api/activities/stats` - Get activity statistics (manager-only)

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

## Default Settings

- **Store Name:** متجر النيل
- **Currency:** EGP (ج.م)
- **Tax Rate:** 14% VAT
- **Low Stock Threshold:** 10 units

## License

MIT
