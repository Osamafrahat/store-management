import { Router } from 'express'
import supabase from '../db/supabase.js'

const router = Router()

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 100 } = req.query

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (start_date) {
      query = query.gte('created_at', start_date)
    }
    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Get order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order.id)

    // Get payments
    const { data: payments } = await supabase
      .from('payment_splits')
      .select('*')
      .eq('order_id', order.id)

    res.json({ ...order, items: items || [], payments: payments || [] })
  } catch (err) {
    next(err)
  }
})

// Create order
router.post('/', async (req, res, next) => {
  try {
    const { order_number, items, subtotal, discount_amount, tax_amount, total,
      payment_method, payment_status, payments } = req.body

    if (!order_number || !items || items.length === 0) {
      return res.status(400).json({ error: 'Order number and items are required' })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        subtotal: subtotal || 0,
        discount_amount: discount_amount || 0,
        tax_amount: tax_amount || 0,
        total,
        payment_method: payment_method || 'cash',
        payment_status: payment_status || 'paid',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items and update stock
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price - (item.discount || 0)

      // Insert order item
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          total: itemTotal
        })

      // Update product stock
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity
      }).then(async () => {
        // Fallback: manual update if RPC doesn't exist
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({
              stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id)
        }
      }).catch(() => {})

      // Record stock movement
      await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product_id,
          type: 'sale',
          quantity: -item.quantity,
          reference_id: order.id,
          notes: `Order ${order_number}`
        })
    }

    // Create payment splits
    if (payments && payments.length > 0) {
      const paymentInserts = payments.map(p => ({
        order_id: order.id,
        method: p.method,
        amount: p.amount,
        reference: p.reference || null
      }))

      await supabase
        .from('payment_splits')
        .insert(paymentInserts)
    }

    res.status(201).json(order)
  } catch (err) {
    console.error('Failed to create order:', err)
    next(err)
  }
})

// Update order status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
