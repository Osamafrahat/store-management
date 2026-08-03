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
      payment_method, payment_status, payments, customer_id } = req.body

    if (!order_number || !items || items.length === 0) {
      return res.status(400).json({ error: 'Order number and items are required' })
    }

    // Always use authenticated user's ID
    const userId = req.user.id
    console.log('Order creation - User ID:', userId, 'Type:', typeof userId)

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
        user_id: userId,
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

    // Create payment splits and journal entries for each payment method
    if (payments && payments.length > 0) {
      const paymentInserts = payments.map(p => ({
        order_id: order.id,
        method: p.method,
        amount: p.amount,
        reference: p.reference || null
      }))

      console.log('Creating payment_splits:', paymentInserts)
      const { error: splitsError } = await supabase
        .from('payment_splits')
        .insert(paymentInserts)
      
      if (splitsError) {
        console.error('Payment splits insert failed:', splitsError)
      } else {
        console.log('Payment splits created successfully')
      }

      // Create journal entries for each split payment (cash/bank)
      try {
        const { createJournalEntry, seedChartOfAccounts } = await import('../services/accountingEngine.js')

        // Ensure accounts exist
        await seedChartOfAccounts()

        // Helper to find account with retry
        async function findAcc(code) {
          let { data } = await supabase.from('accounts').select('id, code').eq('code', code).single()
          if (!data) {
            await seedChartOfAccounts()
            const retry = await supabase.from('accounts').select('id, code').eq('code', code).single()
            data = retry.data
          }
          return data
        }

        const cashAccount = await findAcc('1010')
        const bankAccount = await findAcc('1020')
        const arAccount = await findAcc('1030')

        console.log('Payment journal - Accounts found:', {
          cash: cashAccount?.id,
          bank: bankAccount?.id,
          ar: arAccount?.id,
          paymentsCount: payments.length
        })

        for (const p of payments) {
          const sourceAccount = p.method === 'cash' ? cashAccount : bankAccount
          const date = new Date().toISOString().split('T')[0]
          const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
          const paymentNumber = `PAY-${date.replace(/-/g, '')}-${rand}`

          const lines = []
          if (sourceAccount) {
            lines.push({ accountId: sourceAccount.id, debit: parseFloat(p.amount), credit: 0, description: `Payment received - ${paymentNumber}` })
          }
          if (arAccount) {
            lines.push({ accountId: arAccount.id, debit: 0, credit: parseFloat(p.amount), description: `AR reduction - ${paymentNumber}` })
          }

          console.log('Creating payment journal:', { paymentNumber, method: p.method, amount: p.amount, linesCount: lines.length })

          if (lines.length > 0) {
            const entry = await createJournalEntry({
              date,
              description: `Payment inbound: ${paymentNumber}`,
              reference: paymentNumber,
              sourceType: 'payment',
              sourceId: null,
              lines,
              createdBy: userId,
            })

            console.log('Payment journal created:', { entryId: entry.id, entryNumber: entry.entry_number })

            // Save payment record with journal link
            const paymentRecord = {
              payment_number: paymentNumber,
              payment_type: 'inbound',
              method: p.method,
              amount: parseFloat(p.amount),
              reference: p.reference || null,
              payment_date: date,
              recorded_by: userId,
              journal_entry_id: entry.id,
            }
            console.log('Inserting payment record:', paymentRecord)
            const { error: paymentInsertError } = await supabase.from('payments').insert(paymentRecord)

            if (paymentInsertError) {
              console.error('Payment record insert failed:', paymentInsertError)
              console.error('Payment record that failed:', JSON.stringify(paymentRecord))
            } else {
              console.log('Payment record created successfully:', paymentNumber)
            }
          } else {
            console.warn('No lines for payment journal - missing accounts')
          }
        }
      } catch (payErr) {
        console.error('Payment journal entry failed:', payErr.message)
        console.error('Full error:', payErr)
      }
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
      // Fetch cost_price for each item to enable COGS calculation
      const itemsWithCost = await Promise.all(items.map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('cost_price')
          .eq('id', item.product_id)
          .single()
        return { ...item, cost_price: product?.cost_price || 0 }
      }))
      console.log('Order journal - Order data:', {
        orderId: order.id,
        orderNumber: order.order_number,
        total: order.total,
        subtotal: order.subtotal,
        taxAmount: order.tax_amount,
        itemsCount: itemsWithCost.length
      })
      const journalEntry = await postOrderJournal(order, itemsWithCost)
      // Link journal entry to order for payment deduplication
      if (journalEntry) {
        await supabase.from('orders').update({ journal_entry_id: journalEntry.id }).eq('id', order.id)
        console.log('Order journal created:', { entryId: journalEntry.id, entryNumber: journalEntry.entry_number })
      }
    } catch (accErr) {
      console.error('Accounting auto-post failed:', accErr.message)
      console.error('Full error:', accErr)
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
