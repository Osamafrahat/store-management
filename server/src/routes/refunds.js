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

// Get all refunds
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Enrich with order and user data
    const enriched = await Promise.all((data || []).map(async (refund) => {
      let order_number = null
      let order_total = null
      if (refund.order_id) {
        const { data: o } = await supabase.from('orders').select('order_number, total').eq('id', refund.order_id).single()
        order_number = o?.order_number || null
        order_total = o?.total || null
      }
      let user_name = null
      if (refund.processed_by) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', refund.processed_by).single()
        user_name = u?.full_name || null
      }
      return {
        ...refund,
        orders: order_number ? { order_number, total: order_total } : null,
        users: user_name ? { full_name: user_name } : null
      }
    }))

    res.json(enriched)
  } catch (err) {
    next(err)
  }
})

// Create refund
router.post('/', [
  body('order_id').isNumeric().withMessage('Invalid order ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('reason').trim().notEmpty().withMessage('Refund reason is required'),
], validate, async (req, res, next) => {
  try {
    const { order_id, amount, reason } = req.body

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.is_refunded) {
      return res.status(400).json({ error: 'Order already refunded' })
    }

    if (amount > order.total) {
      return res.status(400).json({ error: 'Refund amount cannot exceed order total' })
    }

    // Create refund
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        order_id,
        amount,
        reason,
        processed_by: req.user?.id || null
      })
      .select()
      .single()

    if (refundError) throw refundError

    // Mark order as refunded
    await supabase
      .from('orders')
      .update({ is_refunded: true, payment_status: 'refunded' })
      .eq('id', order_id)

    // Get order items to restore stock
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id)

    // Restore stock for each item
    if (items) {
      for (const item of items) {
        // Update product stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({
              stock_quantity: product.stock_quantity + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id)
        }

        // Record stock movement
        await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            type: 'refund',
            quantity: item.quantity,
            reference_id: order_id,
            notes: `Refund for order ${order.order_number}`
          })
      }
    }

    // Log activity
    req.logActivity({
      action: 'refunded',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: order.order_number,
      details: { amount, reason, original_total: order.total }
    })

    // Auto-post to accounting journal
    try {
      const { postRefundJournal } = await import('../services/accountingEngine.js')
      await postRefundJournal(refund)
    } catch (accErr) {
      console.error('Accounting auto-post failed:', accErr.message)
    }

    res.status(201).json(refund)
  } catch (err) {
    console.error('Failed to create refund:', err)
    next(err)
  }
})

// Get refund by ID
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid refund ID'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*, orders(order_number, total), users(full_name)')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Refund not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
