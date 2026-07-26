import { Router } from 'express'
import supabase from '../db/supabase.js'
import { createJournalEntry } from '../services/accountingEngine.js'

const router = Router()

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, payment_type, method, date_from, date_to, search } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (payment_type) query = query.eq('payment_type', payment_type)
    if (method) query = query.eq('method', method)
    if (date_from) query = query.gte('payment_date', date_from)
    if (date_to) query = query.lte('payment_date', date_to)
    if (search) query = query.or(`payment_number.ilike.%${search}%,reference.ilike.%${search}%,notes.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    res.json({ data, total: count })
  } catch (err) {
    console.error('Get payments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create payment
router.post('/', async (req, res) => {
  try {
    const { payment_type, method, amount, partner_type, partner_id, reference, notes, payment_date } = req.body

    if (!payment_type || !method || !amount) {
      return res.status(400).json({ error: 'Payment type, method, and amount are required' })
    }

    // Generate payment number
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    const paymentNumber = `PAY-${date}-${rand}`

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        payment_number: paymentNumber,
        payment_type,
        method,
        amount: parseFloat(amount),
        partner_type: partner_type || null,
        partner_id: partner_id || null,
        reference: reference || null,
        notes: notes || null,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        recorded_by: req.user?.id,
      })
      .select()
      .single()

    if (error) throw error

    // Auto-post journal entry
    const { data: cashAccount } = await supabase.from('accounts').select('id').eq('code', '1010').single()
    const { data: bankAccount } = await supabase.from('accounts').select('id').eq('code', '1020').single()
    const { data: arAccount } = await supabase.from('accounts').select('id').eq('code', '1030').single()
    const { data: apAccount } = await supabase.from('accounts').select('id').eq('code', '2010').single()

    const sourceAccount = method === 'cash' ? cashAccount : bankAccount
    const lines = []

    if (payment_type === 'inbound') {
      // Customer pays us: debit cash/bank, credit AR
      if (sourceAccount) lines.push({ accountId: sourceAccount.id, debit: parseFloat(amount), credit: 0, description: `Payment received - ${paymentNumber}` })
      if (arAccount) lines.push({ accountId: arAccount.id, debit: 0, credit: parseFloat(amount), description: `AR reduction - ${paymentNumber}` })
    } else {
      // We pay supplier: debit AP, credit cash/bank
      if (apAccount) lines.push({ accountId: apAccount.id, debit: parseFloat(amount), credit: 0, description: `AP reduction - ${paymentNumber}` })
      if (sourceAccount) lines.push({ accountId: sourceAccount.id, debit: 0, credit: parseFloat(amount), description: `Payment made - ${paymentNumber}` })
    }

    if (lines.length > 0) {
      const entry = await createJournalEntry({
        date: payment.payment_date,
        description: `Payment ${payment_type}: ${paymentNumber}`,
        reference: paymentNumber,
        sourceType: 'payment',
        sourceId: payment.id,
        lines,
        createdBy: req.user?.id,
      })

      await supabase.from('payments').update({ journal_entry_id: entry.id }).eq('id', payment.id)
      payment.journal_entry_id = entry.id
    }

    res.status(201).json(payment)
  } catch (err) {
    console.error('Create payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete payment (only if not posted)
router.delete('/:id', async (req, res) => {
  try {
    const { data: payment } = await supabase.from('payments').select('journal_entry_id').eq('id', req.params.id).single()
    if (payment?.journal_entry_id) {
      return res.status(400).json({ error: 'Cannot delete posted payment' })
    }

    const { error } = await supabase.from('payments').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Payment deleted' })
  } catch (err) {
    console.error('Delete payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as paymentsRouter }
