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

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const { category_id, is_active, search } = req.query

    let query = supabase.from('products').select('*')

    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
    }

    query = query.order('name')

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Get product by ID
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid product ID'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Get product by barcode
router.get('/barcode/:barcode', [
  param('barcode').trim().notEmpty().withMessage('Barcode is required'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', req.params.barcode)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Create product
router.post('/', [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ max: 255 }).withMessage('Name too long'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sku').optional().trim().isLength({ max: 50 }),
  body('barcode').optional().trim().isLength({ max: 100 }),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('low_stock_threshold').optional().isInt({ min: 0 }),
  body('cost_price').optional().isFloat({ min: 0 }),
], validate, async (req, res, next) => {
  try {
    const { name, sku, barcode, category_id, price, cost_price,
            stock_quantity, low_stock_threshold, image_url, description } = req.body

    // Check for duplicate SKU
    if (sku) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .single()
      if (existing) {
        return res.status(409).json({ error: 'SKU already exists' })
      }
    }

    // Check for duplicate barcode
    if (barcode) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .single()
      if (existing) {
        return res.status(409).json({ error: 'Barcode already exists' })
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        sku: sku || null,
        barcode: barcode || null,
        category_id: category_id || null,
        price,
        cost_price: cost_price || 0,
        stock_quantity: stock_quantity || 0,
        low_stock_threshold: low_stock_threshold || 10,
        image_url: image_url || null,
        description: description || null
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update product
router.put('/:id', [
  param('id').isNumeric().withMessage('Invalid product ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
], validate, async (req, res, next) => {
  try {
    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const { name, sku, barcode, category_id, price, cost_price,
            stock_quantity, low_stock_threshold, image_url, description, is_active } = req.body

    // Check for duplicate SKU (excluding current product)
    if (sku && sku !== existing.sku) {
      const { data: dupSku } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .neq('id', req.params.id)
        .single()
      if (dupSku) {
        return res.status(409).json({ error: 'SKU already exists' })
      }
    }

    // Check for duplicate barcode (excluding current product)
    if (barcode && barcode !== existing.barcode) {
      const { data: dupBarcode } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .neq('id', req.params.id)
        .single()
      if (dupBarcode) {
        return res.status(409).json({ error: 'Barcode already exists' })
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        name: name ?? existing.name,
        sku: sku ?? existing.sku,
        barcode: barcode ?? existing.barcode,
        category_id: category_id ?? existing.category_id,
        price: price ?? existing.price,
        cost_price: cost_price ?? existing.cost_price,
        stock_quantity: stock_quantity ?? existing.stock_quantity,
        low_stock_threshold: low_stock_threshold ?? existing.low_stock_threshold,
        image_url: image_url ?? existing.image_url,
        description: description ?? existing.description,
        is_active: is_active ?? existing.is_active,
        updated_at: new Date().toISOString()
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

// Delete product
router.delete('/:id', [
  param('id').isNumeric().withMessage('Invalid product ID'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Product deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
