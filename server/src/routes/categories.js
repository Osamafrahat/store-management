import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get all categories
router.get('/', (req, res, next) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
    res.json(categories)
  } catch (err) {
    next(err)
  }
})

// Create category
router.post('/', (req, res, next) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = db.prepare(
      'INSERT INTO categories (name, description) VALUES (?, ?)'
    ).run(name, description || null)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
})

// Update category
router.put('/:id', (req, res, next) => {
  try {
    const { name, description } = req.body

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' })
    }

    db.prepare(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?'
    ).run(name, description, req.params.id)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
    res.json(category)
  } catch (err) {
    next(err)
  }
})

// Delete category
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' })
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
    res.json({ message: 'Category deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
