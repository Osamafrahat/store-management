import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import { runMigrations } from './db/migrations.js'

// Run database migrations
runMigrations()

// Routes
import productsRouter from './routes/products.js'
import categoriesRouter from './routes/categories.js'
import ordersRouter from './routes/orders.js'
import stockRouter from './routes/stock.js'
import suppliersRouter from './routes/suppliers.js'
import promotionsRouter from './routes/promotions.js'
import reportsRouter from './routes/reports.js'
import settingsRouter from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/stock', stockRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/promotions', promotionsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/settings', settingsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Store Management Server (SQLite)           ║
  ║   Running on http://localhost:${PORT}          ║
  ║   API: http://localhost:${PORT}/api            ║
  ╚══════════════════════════════════════════════╝
  `)
})
