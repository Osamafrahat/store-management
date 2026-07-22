import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get stock movements
router.get('/movements', (req, res, next) => {
  try {
    const { product_id, type, limit = 100 } = req.query

    let sql = `
      SELECT sm.*, p.name as product_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
    `
    const conditions = []
    const params = []

    if (product_id) {
      conditions.push('sm.product_id = ?')
      params.push(product_id)
    }
    if (type) {
      conditions.push('sm.type = ?')
      params.push(type)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY sm.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const movements = db.prepare(sql).all(...params)
    res.json(movements)
  } catch (err) {
    next(err)
  }
})

// Receive stock
router.post('/receive', (req, res, next) => {
  try {
    const { product_id, quantity, supplier_id, notes } = req.body

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and positive quantity are required' })
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(quantity, product_id)

    db.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, notes, created_by)
      VALUES (?, 'receive', ?, ?, 'system')
    `).run(product_id, quantity, notes || `Received ${quantity} units`)

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// Adjust stock
router.post('/adjust', (req, res, next) => {
  try {
    const { product_id, quantity, reason } = req.body

    if (!product_id || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID and quantity are required' })
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const newQuantity = product.stock_quantity + quantity
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Adjustment would result in negative stock' })
    }

    db.prepare(`
      UPDATE products
      SET stock_quantity = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newQuantity, product_id)

    db.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, notes, created_by)
      VALUES (?, 'adjust', ?, ?, 'system')
    `).run(product_id, quantity, reason || `Stock adjustment: ${quantity > 0 ? '+' : ''}${quantity}`)

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
