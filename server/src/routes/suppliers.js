import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import supabase from '../db/supabase.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// Get all suppliers
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Get supplier by ID
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid supplier ID'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Create supplier
router.post('/', [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
], validate, async (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        contact_person: contact_person || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update supplier
router.put('/:id', [
  param('id').isNumeric().withMessage('Invalid supplier ID'),
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
], validate, async (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body

    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name,
        contact_person: contact_person || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete supplier
router.delete('/:id', [
  param('id').isNumeric().withMessage('Invalid supplier ID'),
], validate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Supplier deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
