import jwt from 'jsonwebtoken'
import supabase from '../db/supabase.js'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'

// Cache session checks in memory (per server instance)
const sessionCache = new Map()
const SESSION_CHECK_INTERVAL = 30000 // Check DB every 30 seconds max

export function generateSessionToken() {
  return crypto.randomUUID()
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      sessionToken: user.session_token
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

async function verifySession(userId, jwtSessionToken) {
  const cacheKey = userId
  const cached = sessionCache.get(cacheKey)
  const now = Date.now()

  // Use cached result if recent enough
  if (cached && (now - cached.timestamp) < SESSION_CHECK_INTERVAL) {
    return cached.valid
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('session_token, is_active')
      .eq('id', userId)
      .single()

    if (error || !user) {
      sessionCache.set(cacheKey, { valid: false, timestamp: now })
      return false
    }

    if (!user.is_active) {
      sessionCache.set(cacheKey, { valid: false, timestamp: now })
      return false
    }

    const valid = !(jwtSessionToken && user.session_token && jwtSessionToken !== user.session_token)
    sessionCache.set(cacheKey, { valid, timestamp: now })
    return valid
  } catch {
    return true // Fail open - don't block on DB errors
  }
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded

    // Check session validity (cached, not on every request)
    const isValid = await verifySession(decoded.id, decoded.sessionToken)
    if (!isValid) {
      sessionCache.delete(decoded.id)
      return res.status(401).json({ error: 'Session expired. Please login again.', sessionExpired: true })
    }

    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Clear cache when user logs in (called from login route)
export function clearSessionCache(userId) {
  sessionCache.delete(userId)
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
