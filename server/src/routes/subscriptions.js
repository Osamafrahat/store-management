import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import supabase from '../db/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// Get all subscriptions with joins
router.get('/', async (req, res) => {
  try {
    const { status, customer_id } = req.query
    let query = supabase
      .from('subscriptions')
      .select('*, customer:customers(id, name, phone), service:services(id, name, name_ar, service_type), plan:service_plans(id, name, name_ar, billing_cycle)')
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (customer_id) query = query.eq('customer_id', customer_id)
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get subscription payment history
router.get('/:id/payments', [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', req.params.id)
      .order('payment_date', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get single subscription
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, customer:customers(id, name, phone), service:services(id, name, name_ar), plan:service_plans(id, name, name_ar, billing_cycle)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Subscription not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create subscription
router.post('/', authenticateToken, requirePermission('services_edit'), [
  body('customer_id').isNumeric().withMessage('Customer is required'),
  body('start_date').isISO8601().withMessage('Start date is required'),
  body('billing_amount').isFloat({ min: 0 }).withMessage('Billing amount must be positive'),
], validate, async (req, res) => {
  try {
    const { customer_id, service_id, plan_id, start_date, end_date, next_billing_date, auto_renew, billing_amount, notes } = req.body

    const insertData = {
      customer_id,
      service_id: service_id || null,
      plan_id: plan_id || null,
      start_date,
      end_date: end_date || null,
      next_billing_date: next_billing_date || null,
      auto_renew: auto_renew !== false,
      billing_amount,
      notes,
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(insertData)
      .select('*, customer:customers(id, name, phone), service:services(id, name, name_ar), plan:service_plans(id, name, name_ar, billing_cycle)')
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update subscription
router.put('/:id', authenticateToken, requirePermission('services_edit'), [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { customer_id, service_id, plan_id, start_date, end_date, next_billing_date, auto_renew, billing_amount, notes } = req.body
    const updateData = { updated_at: new Date().toISOString() }
    if (customer_id !== undefined) updateData.customer_id = customer_id
    if (service_id !== undefined) updateData.service_id = service_id
    if (plan_id !== undefined) updateData.plan_id = plan_id
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (next_billing_date !== undefined) updateData.next_billing_date = next_billing_date
    if (auto_renew !== undefined) updateData.auto_renew = auto_renew
    if (billing_amount !== undefined) updateData.billing_amount = billing_amount
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, customer:customers(id, name, phone), service:services(id, name, name_ar), plan:service_plans(id, name, name_ar, billing_cycle)')
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Cancel subscription
router.patch('/:id/cancel', authenticateToken, requirePermission('services_edit'), [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('id', req.params.id)
      .single()
    if (!existing) return res.status(404).json({ error: 'Subscription not found' })
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Subscription is already cancelled' })

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', auto_renew: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Renew subscription
router.patch('/:id/renew', authenticateToken, requirePermission('services_edit'), [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:service_plans(billing_cycle, duration_months)')
      .eq('id', req.params.id)
      .single()
    if (!sub) return res.status(404).json({ error: 'Subscription not found' })
    if (sub.status === 'cancelled') return res.status(400).json({ error: 'Cannot renew a cancelled subscription' })

    const today = new Date()
    let newEndDate = new Date(today)
    const cycle = sub.plan?.billing_cycle || 'monthly'
    const duration = sub.plan?.duration_months || 1

    if (cycle === 'annual') {
      newEndDate.setMonth(newEndDate.getMonth() + (duration * 12))
    } else if (cycle === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + duration)
    } else if (cycle === 'weekly') {
      newEndDate.setDate(newEndDate.getDate() + (duration * 7))
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + duration)
    }

    let nextBilling = null
    if (cycle === 'monthly') {
      nextBilling = new Date(newEndDate)
    } else if (cycle === 'annual') {
      nextBilling = new Date(newEndDate)
    } else if (cycle === 'weekly') {
      nextBilling = new Date(newEndDate)
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: today.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        next_billing_date: nextBilling ? nextBilling.toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error

    // Record the renewal payment
    await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: req.params.id,
        amount: sub.billing_amount,
        payment_method: 'cash',
        notes: 'Renewal payment',
      })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Record payment for subscription
router.post('/:id/payments', authenticateToken, requirePermission('services_edit'), [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
], validate, async (req, res) => {
  try {
    const { amount, payment_method, notes } = req.body
    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: req.params.id,
        amount,
        payment_method: payment_method || 'cash',
        notes,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete subscription
router.delete('/:id', authenticateToken, requirePermission('services_edit'), [
  param('id').isNumeric().withMessage('Invalid subscription ID'),
], validate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
