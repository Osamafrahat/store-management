import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import supabase from '../db/supabase.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// Get stock movements
router.get('/movements', async (req, res, next) => {
  try {
    const { product_id, limit = 100 } = req.query

    let query = supabase
      .from('stock_movements')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (product_id) {
      query = query.eq('product_id', product_id)
    }

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Receive stock
router.post('/receive', [
  body('product_id').isNumeric().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], validate, async (req, res, next) => {
  try {
    const { product_id, quantity, notes } = req.body

    // Get current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Update stock
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: product.stock_quantity + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (updateError) throw updateError

    // Record movement
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        type: 'receive',
        quantity,
        notes: notes || 'Stock received'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Adjust stock
router.post('/adjust', [
  body('product_id').isNumeric().withMessage('Product ID is required'),
  body('quantity').isInt().withMessage('Quantity is required'),
], validate, async (req, res, next) => {
  try {
    const { product_id, quantity, notes } = req.body

    // Get current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const newQuantity = Math.max(0, product.stock_quantity + quantity)

    // Update stock
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (updateError) throw updateError

    // Record movement
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        type: 'adjust',
        quantity,
        notes: notes || 'Stock adjusted'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
