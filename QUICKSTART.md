# Store Management - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase SQL Editor:
   - Open `supabase-schema.sql` and copy its contents
   - Paste into Supabase SQL Editor and run
3. Get your Supabase credentials from Project Settings > API
4. Create `.env` file in `server/` directory with your credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3001
   ```

## Start the Application

### Option 1: Start both server and client (Recommended)
```bash
cd C:\Users\Mega Store\store-management
npm run dev
```

### Option 2: Start separately

**Start Backend Server:**
```bash
cd C:\Users\Mega Store\store-management\server
npm run dev
```

**Start Frontend (in new terminal):**
```bash
cd C:\Users\Mega Store\store-management\client
npm run dev
```

## Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Default Settings
- Currency: EGP (ج.م)
- Tax Rate: 14% VAT
- Low Stock Threshold: 10 units

## Features

### POS (Point of Sale)
1. Go to POS page
2. Search products or use barcode scanner
3. Add items to cart
4. Apply promo codes (optional)
5. Click "Proceed to Payment"
6. Select payment method (Cash/Card/Mobile)
7. Complete sale

### Inventory Management
1. Go to Inventory page
2. Add/Edit/Delete products
3. Manage categories
4. Track stock levels

### Reports
1. Go to Reports page
2. View sales analytics
3. Check stock reports
4. Monitor low stock alerts

### Suppliers
1. Go to Suppliers page
2. Add/Edit/Delete suppliers
3. Link suppliers to products

### Promotions
1. Go to Promotions page
2. Create promo codes (percentage or fixed)
3. Set validity periods and usage limits

### Settings
1. Go to Settings page
2. Configure store name, address, phone
3. Adjust tax rate
4. Customize receipt footer

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/products` | GET/POST | List/Create products |
| `/api/products/:id` | GET/PUT/DELETE | Product CRUD |
| `/api/products/barcode/:barcode` | GET | Get by barcode |
| `/api/categories` | GET/POST | List/Create categories |
| `/api/orders` | GET/POST | List/Create orders |
| `/api/stock/receive` | POST | Receive stock |
| `/api/stock/adjust` | POST | Adjust stock |
| `/api/suppliers` | GET/POST | List/Create suppliers |
| `/api/promotions` | GET/POST | List/Create promotions |
| `/api/promotions/validate` | POST | Validate promo code |
| `/api/reports/sales` | GET | Sales report |
| `/api/reports/stock` | GET | Stock report |
| `/api/settings` | GET/PUT | Store settings |

## Project Structure
```
store-management/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Node.js backend (Express + Supabase)
├── supabase-schema.sql  # Database schema
├── package.json     # Root package with scripts
└── README.md        # Full documentation
```

## Troubleshooting

**Server won't start:**
- Make sure port 3001 is not in use
- Check if all dependencies are installed: `cd server && npm install`
- Verify `.env` file exists with correct Supabase credentials

**Frontend can't connect to API:**
- Ensure server is running on port 3001
- Check browser console for CORS errors

**Database issues:**
- Ensure Supabase credentials are correct in `.env`
- Check Supabase dashboard for connection issues
- Re-run `supabase-schema.sql` if tables are missing
