import { Router } from 'express'
import supabase from '../db/supabase.js'
import { createJournalEntry, seedChartOfAccounts } from '../services/accountingEngine.js'

const router = Router()

// Helper: find account by code, auto-seed if missing
async function findAccount(code) {
  let { data } = await supabase.from('accounts').select('id').eq('code', code).single()
  if (!data) {
    await seedChartOfAccounts()
    const retry = await supabase.from('accounts').select('id').eq('code', code).single()
    data = retry.data
  }
  return data
}

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
    const { payment_type, method, amount, partner_type, partner_id, reference, notes, payment_date, order_id } = req.body

    if (!payment_type || !method || !amount) {
      return res.status(400).json({ error: 'Payment type, method, and amount are required' })
    }

    // If this payment is for an order, check if order already has a journal entry
    let existingJournalId = null
    if (order_id) {
      const { data: orderPayment } = await supabase
        .from('payment_splits')
        .select('id')
        .eq('order_id', order_id)
        .limit(1)
        .maybeSingle()

      // Check if order's journal entry already posted the cash/bank debit
      const { data: orderJournal } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('source_type', 'order')
        .eq('source_id', order_id)
        .eq('is_reversed', false)
        .limit(1)
        .maybeSingle()

      if (orderJournal) {
        existingJournalId = orderJournal.id
      }
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

    // Auto-post journal entry only if order doesn't already have one
    if (!existingJournalId) {
      const cashAccount = await findAccount('1010')
      const bankAccount = await findAccount('1020')
      const arAccount = await findAccount('1030')
      const apAccount = await findAccount('2010')

      // Card, check, bank_transfer all settle to bank account
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
        try {
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
        } catch (accErr) {
          console.error('Payment journal entry failed:', accErr.message)
        }
      } else {
        console.error('Payment journal: no lines created. sourceAccount:', !!sourceAccount, 'arAccount:', !!arAccount, 'apAccount:', !!apAccount)
      }
    } else {
      // Order already posted journal — link this payment to existing entry
      await supabase.from('payments').update({ journal_entry_id: existingJournalId }).eq('id', payment.id)
      payment.journal_entry_id = existingJournalId
    }

    res.status(201).json(payment)
  } catch (err) {
    console.error('Create payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update payment (only if not posted)
router.put('/:id', async (req, res) => {
  try {
    const { data: existing } = await supabase.from('payments').select('journal_entry_id').eq('id', req.params.id).single()
    if (existing?.journal_entry_id) {
      return res.status(400).json({ error: 'Cannot edit posted payment' })
    }

    const { payment_type, method, amount, reference, notes, payment_date } = req.body

    if (!payment_type || !method || !amount) {
      return res.status(400).json({ error: 'Payment type, method, and amount are required' })
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        payment_type,
        method,
        amount: parseFloat(amount),
        reference: reference || null,
        notes: notes || null,
        payment_date,
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(payment)
  } catch (err) {
    console.error('Update payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete payment (auto-reverses journal entry if posted)
router.delete('/:id', async (req, res) => {
  try {
    const { data: payment } = await supabase.from('payments').select('*').eq('id', req.params.id).single()
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const { error } = await supabase.from('payments').delete().eq('id', req.params.id)
    if (error) throw error

    // Auto-post accounting: reverse the journal entry if it existed
    // But only if this payment created its own entry (not shared with an order)
    if (payment.journal_entry_id) {
      // Check if this journal entry is also linked to an order
      const { data: orderWithEntry } = await supabase
        .from('orders')
        .select('id')
        .eq('journal_entry_id', payment.journal_entry_id)
        .limit(1)
        .maybeSingle()

      // Only reverse if no order owns this journal entry
      if (!orderWithEntry) {
        try {
          const { reverseJournalEntry } = await import('../services/accountingEngine.js')
          await reverseJournalEntry(payment.journal_entry_id, `Payment deleted: ${payment.payment_number}`, req.user?.id)
        } catch (accErr) {
          console.error('Accounting auto-post failed:', accErr.message)
        }
      }
    }

    res.json({ message: 'Payment deleted' })
  } catch (err) {
    console.error('Delete payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as paymentsRouter }
