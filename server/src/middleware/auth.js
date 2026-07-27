import jwt from 'jsonwebtoken'
import supabase from '../db/supabase.js'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'

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

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    // Check session token against DB (single session enforcement)
    try {
      const { data: user } = await supabase
        .from('users')
        .select('session_token, is_active')
        .eq('id', decoded.id)
        .single()

      if (user && !user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' })
      }

      if (user && decoded.sessionToken && user.session_token && decoded.sessionToken !== user.session_token) {
        return res.status(401).json({ error: 'Session expired. Another login was detected.', sessionExpired: true })
      }
    } catch {
      // If session_token column doesn't exist yet, skip check
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
