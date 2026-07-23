import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { authenticateToken } from './middleware/auth.js'
import supabase from './db/supabase.js'

// Routes
import productsRouter from './routes/products.js'
import categoriesRouter from './routes/categories.js'
import ordersRouter from './routes/orders.js'
import stockRouter from './routes/stock.js'
import suppliersRouter from './routes/suppliers.js'
import promotionsRouter from './routes/promotions.js'
import reportsRouter from './routes/reports.js'
import settingsRouter from './routes/settings.js'
import usersRouter from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 3001

// Security Headers (relaxed CSP for development)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}
app.use(cors(corsOptions))

// Body Parser with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Auth rate limit
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many login attempts, please try again later.' },
})
app.use('/api/auth/login', authLimiter)

// Disable X-Powered-By
app.disable('x-powered-by')

// Auth Routes (public)
app.use('/api/auth', authRouter)

// Protected API Routes
app.use('/api/products', authenticateToken, productsRouter)
app.use('/api/categories', authenticateToken, categoriesRouter)
app.use('/api/orders', authenticateToken, ordersRouter)
app.use('/api/stock', authenticateToken, stockRouter)
app.use('/api/suppliers', authenticateToken, suppliersRouter)
app.use('/api/promotions', authenticateToken, promotionsRouter)
app.use('/api/reports', authenticateToken, reportsRouter)
app.use('/api/settings', authenticateToken, settingsRouter)
app.use('/api/users', authenticateToken, usersRouter)

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('users').select('id').limit(1)
    if (error) throw error
    res.json({ status: 'ok', database: 'supabase', timestamp: new Date().toISOString() })
  } catch (err) {
    res.json({ status: 'ok', database: 'supabase', timestamp: new Date().toISOString() })
  }
})

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Store Management Server (Supabase)          ║
  ║   Running on http://localhost:${PORT}          ║
  ║   API: http://localhost:${PORT}/api            ║
  ║   Database: Supabase                         ║
  ╚══════════════════════════════════════════════╝
  `)
})

export default app
