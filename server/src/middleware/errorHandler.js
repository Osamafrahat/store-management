export function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  // Don't expose error details in production
  const isProduction = process.env.NODE_ENV === 'production'

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' })
  }

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource already exists' })
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Related resource not found' })
  }

  // Default error
  const statusCode = err.statusCode || 500
  const message = isProduction 
    ? 'Internal server error' 
    : err.message || 'Internal server error'

  res.status(statusCode).json({ 
    error: message,
    ...(isProduction ? {} : { stack: err.stack })
  })
}
