export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message || err)

  // SQLite errors
  if (err?.code) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A record with this value already exists'
      })
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({
        error: 'Invalid reference',
        message: 'Referenced record does not exist'
      })
    }
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON'
    })
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
}
