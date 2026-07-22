# Store Management - POS & Stock System

A complete retail store management application with Point of Sale (POS) and Inventory/Stock management features.

## Features

### POS (Point of Sale)
- Product grid with search and category filtering
- Barcode scanning support
- Quick product add to cart
- Multiple payment methods (Cash, Card, Mobile)
- Split payments support
- Promo code application
- Receipt generation and printing

### Stock/Inventory Management
- Product catalog with CRUD operations
- Stock tracking with quantity management
- Low stock alerts and notifications
- Stock movement history
- Category management
- Supplier management

### Reports & Analytics
- Sales reports (daily, weekly, monthly, yearly)
- Top selling products
- Stock value reports
- Low stock alerts
- Sales trend charts

### Settings
- Store information configuration
- Tax rate settings (default 14% VAT)
- Currency settings (default EGP)
- Receipt customization

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, Recharts
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)

## Installation

### Prerequisites
- Node.js 18+ installed

### Setup

1. Clone or download this project

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

5. Start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

6. Open your browser and go to `http://localhost:5173`

## Project Structure

```
store-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state stores
│   │   └── lib/            # Utilities and API client
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── db/             # Database connection and migrations
│   │   └── middleware/     # Express middleware
│   └── package.json
│
└── data/                   # SQLite database
    └── store.db
```

## API Endpoints

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
- `POST /api/orders` - Create order

### Stock
- `GET /api/stock/movements` - Get stock movements
- `POST /api/stock/receive` - Receive stock
- `POST /api/stock/adjust` - Adjust stock

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Promotions
- `GET /api/promotions` - Get all promotions
- `POST /api/promotions/validate` - Validate promo code
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:id` - Update promotion
- `DELETE /api/promotions/:id` - Delete promotion

### Reports
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/stock` - Get stock report
- `GET /api/reports/dashboard` - Get dashboard data

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

## Default Settings

- **Currency:** EGP (ج.م)
- **Tax Rate:** 14% VAT
- **Low Stock Threshold:** 10 units

## License

MIT
