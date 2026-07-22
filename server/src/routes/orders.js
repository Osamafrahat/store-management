import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all orders
router.get('/', (req, res, next) => {
  try {
    const { start_date, end_date, limit = 100 } = req.query

    let sql = 'SELECT * FROM orders'
    const conditions = []
    const params = []

    if (start_date) {
      conditions.push('created_at >= ?')
      params.push(start_date)
    }
    if (end_date) {
      conditions.push('created_at <= ?')
      params.push(end_date)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const orders = db.prepare(sql).all(...params)
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

// Get order by ID
router.get('/:id', (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const items = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id)

    const payments = db.prepare(
      'SELECT * FROM payment_splits WHERE order_id = ?'
    ).all(req.params.id)

    res.json({ ...order, items, payments })
  } catch (err) {
    next(err)
  }
})

// Create order
router.post('/', (req, res, next) => {
  try {
    const { order_number, items, subtotal, discount_amount, tax_amount, total,
      payment_method, payment_status, payments } = req.body

    if (!order_number || !items || items.length === 0) {
      return res.status(400).json({ error: 'Order number and items are required' })
    }

    db.exec('BEGIN')

    try {
      // Create order
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, subtotal, discount_amount, tax_amount, total,
          payment_method, payment_status, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        order_number, subtotal, discount_amount || 0, tax_amount || 0,
        total, payment_method || 'cash', payment_status || 'paid'
      )

      const orderId = Number(orderResult.lastInsertRowid)

      // Create order items and update stock
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price - (item.discount || 0)

        db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.unit_price, item.discount || 0, itemTotal)

        // Update product stock
        db.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(item.quantity, item.product_id)

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (product_id, type, quantity, reference_id, notes)
          VALUES (?, 'sale', ?, ?, ?)
        `).run(item.product_id, -item.quantity, orderId, `Order ${order_number}`)
      }

      // Create payment splits
      if (payments && payments.length > 0) {
        const insertPayment = db.prepare(`
          INSERT INTO payment_splits (order_id, method, amount, reference)
          VALUES (?, ?, ?, ?)
        `)

        for (const p of payments) {
          insertPayment.run(orderId, p.method, p.amount, p.reference || null)
        }
      }

      db.exec('COMMIT')

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
      res.status(201).json(order)
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('Failed to create order:', err)
    next(err)
  }
})

// Update order status
router.patch('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body

    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' })
    }

    db.prepare(
      'UPDATE orders SET payment_status = ? WHERE id = ?'
    ).run(status, req.params.id)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    res.json(order)
  } catch (err) {
    next(err)
  }
})

export default router
