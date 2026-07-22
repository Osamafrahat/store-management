import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all promotions
router.get('/', (req, res, next) => {
  try {
    const promotions = db.prepare(
      'SELECT * FROM promotions ORDER BY created_at DESC'
    ).all()

    res.json(promotions)
  } catch (err) {
    next(err)
  }
})

// Validate promo code
router.post('/validate', (req, res, next) => {
  try {
    const { code, orderAmount } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' })
    }

    const promo = db.prepare(
      'SELECT * FROM promotions WHERE code = ? AND is_active = 1'
    ).get(code.toUpperCase())

    if (!promo) {
      return res.status(404).json({ error: 'Invalid promo code' })
    }

    // Check if expired
    if (promo.end_date && new Date(promo.end_date) < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' })
    }

    // Check max uses
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' })
    }

    // Check minimum order amount
    if (promo.min_order_amount && orderAmount < promo.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount is ${promo.min_order_amount}`
      })
    }

    res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value
    })
  } catch (err) {
    next(err)
  }
})

// Create promotion
router.post('/', (req, res, next) => {
  try {
    const { code, type, value, min_order_amount, max_uses, start_date, end_date, is_active } = req.body

    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'Code, type, and value are required' })
    }

    const result = db.prepare(`
      INSERT INTO promotions (code, type, value, min_order_amount, max_uses, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.toUpperCase(), type, value,
      min_order_amount || null, max_uses || null,
      start_date || null, end_date || null,
      is_active !== false ? 1 : 0
    )

    const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(promo)
  } catch (err) {
    next(err)
  }
})

// Update promotion
router.put('/:id', (req, res, next) => {
  try {
    const { code, type, value, min_order_amount, max_uses, start_date, end_date, is_active } = req.body

    const existing = db.prepare('SELECT id FROM promotions WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Promotion not found' })
    }

    db.prepare(`
      UPDATE promotions
      SET code = ?, type = ?, value = ?, min_order_amount = ?, max_uses = ?,
          start_date = ?, end_date = ?, is_active = ?
      WHERE id = ?
    `).run(
      code?.toUpperCase(), type, value, min_order_amount, max_uses,
      start_date, end_date, is_active ? 1 : 0, req.params.id
    )

    const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id)
    res.json(promo)
  } catch (err) {
    next(err)
  }
})

// Delete promotion
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM promotions WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Promotion not found' })
    }

    db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id)
    res.json({ message: 'Promotion deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
