import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all suppliers
router.get('/', (req, res, next) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all()
    res.json(suppliers)
  } catch (err) {
    next(err)
  }
})

// Get supplier by ID
router.get('/:id', (req, res, next) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id)

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    res.json(supplier)
  } catch (err) {
    next(err)
  }
})

// Create supplier
router.post('/', (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = db.prepare(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, contact_person || null, email || null, phone || null, address || null, notes || null)

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(supplier)
  } catch (err) {
    next(err)
  }
})

// Update supplier
router.put('/:id', (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body

    const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    db.prepare(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, notes = ?
      WHERE id = ?
    `).run(name, contact_person, email, phone, address, notes, req.params.id)

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id)
    res.json(supplier)
  } catch (err) {
    next(err)
  }
})

// Delete supplier
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id)
    res.json({ message: 'Supplier deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
