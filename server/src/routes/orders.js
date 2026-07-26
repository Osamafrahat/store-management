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

    // Enrich with user and customer names
    const enriched = await Promise.all((data || []).map(async (order) => {
      let user_name = null
      let customer_name = null
      if (order.user_id) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', order.user_id).single()
        user_name = u?.full_name || null
      }
      if (order.customer_id) {
        const { data: c } = await supabase.from('customers').select('name').eq('id', order.customer_id).single()
        customer_name = c?.name || null
      }
      return { ...order, users: user_name ? { full_name: user_name } : null, customers: customer_name ? { name: customer_name } : null }
    }))

    res.json(enriched)
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

    // Get user name
    let user_name = null
    if (order.user_id) {
      const { data: u } = await supabase.from('users').select('full_name').eq('id', order.user_id).single()
      user_name = u?.full_name || null
    }

    // Get customer name
    let customer_name = null
    if (order.customer_id) {
      const { data: c } = await supabase.from('customers').select('name').eq('id', order.customer_id).single()
      customer_name = c?.name || null
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

    res.json({
      ...order,
      users: user_name ? { full_name: user_name } : null,
      customers: customer_name ? { name: customer_name } : null,
      items: items || [],
      payments: payments || []
    })
  } catch (err) {
    next(err)
  }
})

// Create order
router.post('/', async (req, res, next) => {
  try {
    const { order_number, items, subtotal, discount_amount, tax_amount, total,
      payment_method, payment_status, payments, user_id, customer_id } = req.body

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
        user_id: user_id || req.user?.id || null,
        customer_id: customer_id || null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Award loyalty points to customer if linked
    if (customer_id) {
      // Get loyalty points setting
      const { data: setting } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'loyaltyPointsPerCurrency')
        .single()

      const pointsPerCurrency = parseFloat(setting?.value) || 0

      if (pointsPerCurrency > 0) {
        const pointsEarned = Math.floor(total * pointsPerCurrency)

        // Update customer loyalty points and total spent
        const { data: customer } = await supabase
          .from('customers')
          .select('loyalty_points, total_spent')
          .eq('id', customer_id)
          .single()

        if (customer) {
          await supabase
            .from('customers')
            .update({
              loyalty_points: (customer.loyalty_points || 0) + pointsEarned,
              total_spent: (customer.total_spent || 0) + total,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer_id)
        }
      } else {
        // Still update total spent even if no points
        const { data: customer } = await supabase
          .from('customers')
          .select('total_spent')
          .eq('id', customer_id)
          .single()

        if (customer) {
          await supabase
            .from('customers')
            .update({
              total_spent: (customer.total_spent || 0) + total,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer_id)
        }
      }
    }

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

    // Log activity
    req.logActivity({
      action: 'created',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: order_number,
      details: { total, payment_method, items_count: items.length, customer_id }
    })

    // Auto-post to accounting journal (fire and forget)
    try {
      const { postOrderJournal } = await import('../services/accountingEngine.js')
      await postOrderJournal(order, items)
    } catch (accErr) {
      console.error('Accounting auto-post failed:', accErr.message)
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
