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
    const { order_id, amount, reason, items, is_partial } = req.body

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check if order is older than 14 days
    const orderDate = new Date(order.created_at)
    const now = new Date()
    const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
    if (daysSinceOrder > 14) {
      return res.status(400).json({ error: `Refund not allowed. Order is ${daysSinceOrder} days old. Refund window is 14 days.` })
    }

    // For full refunds, check if already fully refunded
    if (!is_partial && order.is_refunded) {
      return res.status(400).json({ error: 'Order already fully refunded' })
    }

    // For partial refunds, check total refunded amount
    if (is_partial) {
      const { data: existingRefunds } = await supabase
        .from('refunds')
        .select('amount')
        .eq('order_id', order_id)

      const totalRefunded = (existingRefunds || []).reduce((sum, r) => sum + parseFloat(r.amount), 0)
      if (totalRefunded + parseFloat(amount) > parseFloat(order.total) + 0.01) {
        return res.status(400).json({ error: 'Refund amount exceeds order total' })
      }
    } else {
      if (parseFloat(amount) > parseFloat(order.total)) {
        return res.status(400).json({ error: 'Refund amount cannot exceed order total' })
      }
    }

    // Create refund
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        order_id,
        amount,
        reason,
        is_partial: is_partial || false,
        processed_by: req.user?.id || null
      })
      .select()
      .single()

    if (refundError) throw refundError

    // Create refund_items records if item-level refund
    if (items && items.length > 0) {
      const refundItemsData = items.map(item => ({
        refund_id: refund.id,
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        total: item.total,
      }))

      const { error: riError } = await supabase
        .from('refund_items')
        .insert(refundItemsData)

      if (riError) {
        console.error('Failed to create refund_items:', riError.message)
      }
    }

    // Restore stock
    if (items && items.length > 0) {
      // Item-level refund: restore only selected items
      for (const item of items) {
        // Get the original order item to find the product
        const { data: orderItem } = await supabase
          .from('order_items')
          .select('product_id')
          .eq('id', item.order_item_id)
          .single()

        if (orderItem) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', orderItem.product_id)
            .single()

          if (product) {
            await supabase
              .from('products')
              .update({
                stock_quantity: product.stock_quantity + item.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', orderItem.product_id)
          }

          await supabase
            .from('stock_movements')
            .insert({
              product_id: orderItem.product_id,
              type: 'refund',
              quantity: item.quantity,
              reference_id: order_id,
              notes: `Partial refund for order ${order.order_number}`
            })
        }
      }
    } else {
      // Full refund: restore all items
      const { data: allItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order_id)

      if (allItems) {
        for (const item of allItems) {
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
    }

    // Determine if order is fully refunded
    if (is_partial) {
      const { data: allRefunds } = await supabase
        .from('refunds')
        .select('amount')
        .eq('order_id', order_id)

      const totalRefunded = (allRefunds || []).reduce((sum, r) => sum + parseFloat(r.amount), 0)
      if (totalRefunded >= parseFloat(order.total) - 0.01) {
        await supabase
          .from('orders')
          .update({ is_refunded: true, payment_status: 'refunded' })
          .eq('id', order_id)
      }
    } else {
      await supabase
        .from('orders')
        .update({ is_refunded: true, payment_status: 'refunded' })
        .eq('id', order_id)
    }

    // Log activity
    req.logActivity({
      action: 'refunded',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: order.order_number,
      details: { amount, reason, original_total: order.total, is_partial: is_partial || false, items_count: items?.length || 0 }
    })

    // Auto-post to accounting journal
    try {
      const { postRefundJournal } = await import('../services/accountingEngine.js')
      await postRefundJournal(refund, items || null)
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

    // Fetch refund items if any
    const { data: refundItems } = await supabase
      .from('refund_items')
      .select('*, products(name)')
      .eq('refund_id', data.id)

    res.json({ ...data, items: refundItems || [] })
  } catch (err) {
    next(err)
  }
})

export default router
