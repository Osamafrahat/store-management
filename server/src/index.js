import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler.js'
import { activityLogger } from './middleware/activityLogger.js'
import { authRouter } from './routes/auth.js'
import { authenticateToken, requireManager } from './middleware/auth.js'
import supabase from './db/supabase.js'

dotenv.config()

import productsRouter from './routes/products.js'
import categoriesRouter from './routes/categories.js'
import ordersRouter from './routes/orders.js'
import stockRouter from './routes/stock.js'
import suppliersRouter from './routes/suppliers.js'
import promotionsRouter from './routes/promotions.js'
import reportsRouter from './routes/reports.js'
import settingsRouter from './routes/settings.js'
import usersRouter from './routes/users.js'
import customersRouter from './routes/customers.js'
import employeesRouter from './routes/employees.js'
import expensesRouter from './routes/expenses.js'
import refundsRouter from './routes/refunds.js'
import emailRouter from './routes/email.js'
import activitiesRouter from './routes/activities.js'
import { accountsRouter } from './routes/accounts.js'
import { journalsRouter } from './routes/journals.js'
import { accountingReportsRouter } from './routes/accountingReports.js'
import { paymentsRouter } from './routes/payments.js'
import syncRouter from './routes/sync.js'

const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      }
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}
app.use(cors(corsOptions))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

app.disable('x-powered-by')

app.use('/api/auth', authRouter)

app.use('/api/products', authenticateToken, activityLogger, productsRouter)
app.use('/api/categories', authenticateToken, activityLogger, categoriesRouter)
app.use('/api/orders', authenticateToken, activityLogger, ordersRouter)
app.use('/api/stock', authenticateToken, activityLogger, stockRouter)
app.use('/api/suppliers', authenticateToken, activityLogger, suppliersRouter)
app.use('/api/promotions', authenticateToken, activityLogger, promotionsRouter)
app.use('/api/reports', authenticateToken, activityLogger, reportsRouter)
app.use('/api/settings', authenticateToken, activityLogger, settingsRouter)
app.use('/api/users', authenticateToken, requireManager, activityLogger, usersRouter)
app.use('/api/customers', authenticateToken, activityLogger, customersRouter)
app.use('/api/employees', authenticateToken, activityLogger, employeesRouter)
app.use('/api/expenses', authenticateToken, activityLogger, expensesRouter)
app.use('/api/refunds', authenticateToken, activityLogger, refundsRouter)
app.use('/api/notifications', authenticateToken, activityLogger, emailRouter)
app.use('/api/activities', authenticateToken, requireManager, activitiesRouter)

app.use('/api/accounting/accounts', authenticateToken, activityLogger, accountsRouter)
app.use('/api/accounting/journals', authenticateToken, activityLogger, journalsRouter)
app.use('/api/accounting/reports', authenticateToken, accountingReportsRouter)
app.use('/api/accounting/payments', authenticateToken, activityLogger, paymentsRouter)
app.use('/api/sync', authenticateToken, syncRouter)

app.get('/api/health', (req, res) => {
  const emailConfigured = !!(process.env.RESEND_API_KEY)
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  console.log(`[HEALTH] email=${emailConfigured} smtp=${smtpConfigured} RESEND_API_KEY=${process.env.RESEND_API_KEY ? 'set' : 'MISSING'}`)
  res.json({
    status: 'ok',
    smtp: emailConfigured || smtpConfigured,
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.use(errorHandler)

// Auto-initialize accounting data on startup
async function initAccounting() {
  try {
    const { seedChartOfAccounts, getCurrentPeriod } = await import('./services/accountingEngine.js')
    await seedChartOfAccounts()
    await getCurrentPeriod()
    console.log('Accounting initialized: chart of accounts seeded, fiscal period ready')
  } catch (err) {
    console.error('Accounting init failed (non-fatal):', err.message)
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  initAccounting()
})

export default app
