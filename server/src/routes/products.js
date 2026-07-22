import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all products
router.get('/', (req, res, next) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `).all()

    res.json(products)
  } catch (err) {
    next(err)
  }
})

// Get product by barcode (must be before /:id)
router.get('/barcode/:barcode', (req, res, next) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.is_active = 1
    `).get(req.params.barcode)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (err) {
    next(err)
  }
})

// Search products (must be before /:id)
router.get('/search', (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])

    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
        AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
      ORDER BY p.name
    `).all(`%${q}%`, `%${q}%`, `%${q}%`)

    res.json(products)
  } catch (err) {
    next(err)
  }
})

// Get product by ID
router.get('/:id', (req, res, next) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (err) {
    next(err)
  }
})

// Create product
router.post('/', (req, res, next) => {
  try {
    const {
      name, sku, barcode, category_id, price, cost_price,
      stock_quantity, low_stock_threshold, image_url, description,
      is_active, supplier_id
    } = req.body

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' })
    }

    const result = db.prepare(`
      INSERT INTO products (name, sku, barcode, category_id, price, cost_price,
        stock_quantity, low_stock_threshold, image_url, description, is_active, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, sku || null, barcode || null, category_id || null,
      price, cost_price || null, stock_quantity || 0,
      low_stock_threshold || 10, image_url || null, description || null,
      is_active !== false ? 1 : 0, supplier_id || null
    )

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
})

// Update product
router.put('/:id', (req, res, next) => {
  try {
    const {
      name, sku, barcode, category_id, price, cost_price,
      stock_quantity, low_stock_threshold, image_url, description,
      is_active, supplier_id
    } = req.body

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' })
    }

    db.prepare(`
      UPDATE products
      SET name = ?, sku = ?, barcode = ?, category_id = ?, price = ?, cost_price = ?,
          stock_quantity = ?, low_stock_threshold = ?, image_url = ?, description = ?,
          is_active = ?, supplier_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name, sku, barcode, category_id, price, cost_price,
      stock_quantity, low_stock_threshold, image_url, description,
      is_active ? 1 : 0, supplier_id, req.params.id
    )

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    res.json(product)
  } catch (err) {
    next(err)
  }
})

// Delete product
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' })
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    res.json({ message: 'Product deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
