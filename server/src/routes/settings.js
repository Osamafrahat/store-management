import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all settings
router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM store_settings').all()

    const settingsObj = {}
    for (const row of rows) {
      settingsObj[row.key] = row.value
    }
    res.json(settingsObj)
  } catch (err) {
    next(err)
  }
})

// Update settings
router.put('/', (req, res, next) => {
  try {
    const updates = req.body

    const upsert = db.prepare(`
      INSERT INTO store_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)

    db.exec('BEGIN')
    try {
      for (const [key, value] of Object.entries(updates)) {
        upsert.run(key, String(value))
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }

    // Return updated settings
    const rows = db.prepare('SELECT * FROM store_settings').all()

    const settingsObj = {}
    for (const row of rows) {
      settingsObj[row.key] = row.value
    }
    res.json(settingsObj)
  } catch (err) {
    next(err)
  }
})

export default router
