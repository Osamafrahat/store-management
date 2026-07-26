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

// Get all expenses
router.get('/', async (req, res, next) => {
  try {
    const { start_date, end_date, category } = req.query

    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })

    if (start_date) {
      query = query.gte('expense_date', start_date)
    }
    if (end_date) {
      query = query.lte('expense_date', end_date)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) throw error

    // Enrich with user data
    const enriched = await Promise.all((data || []).map(async (expense) => {
      let user_name = null
      if (expense.recorded_by) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', expense.recorded_by).single()
        user_name = u?.full_name || null
      }
      return { ...expense, users: user_name ? { full_name: user_name } : null }
    }))

    res.json(enriched)
  } catch (err) {
    next(err)
  }
})

// Get expense summary
router.get('/summary', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query

    let query = supabase
      .from('expenses')
      .select('category, amount')

    if (start_date) {
      query = query.gte('expense_date', start_date)
    }
    if (end_date) {
      query = query.lte('expense_date', end_date)
    }

    const { data, error } = await query
    if (error) throw error

    // Group by category
    const summary = {}
    data.forEach(expense => {
      if (!summary[expense.category]) {
        summary[expense.category] = 0
      }
      summary[expense.category] += expense.amount
    })

    const total = data.reduce((sum, e) => sum + e.amount, 0)

    res.json({ summary, total })
  } catch (err) {
    next(err)
  }
})

// Create expense
router.post('/', [
  body('category').trim().notEmpty().withMessage('Expense category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
], validate, async (req, res, next) => {
  try {
    const { category, amount, description, receipt_image, expense_date } = req.body

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category,
        amount,
        description: description || null,
        receipt_image: receipt_image || null,
        recorded_by: req.user?.id || null,
        expense_date: expense_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update expense
router.put('/:id', [
  param('id').isNumeric().withMessage('Invalid expense ID'),
  body('category').trim().notEmpty().withMessage('Expense category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
], validate, async (req, res, next) => {
  try {
    const { category, amount, description, receipt_image, expense_date } = req.body

    const { data, error } = await supabase
      .from('expenses')
      .update({
        category,
        amount,
        description: description || null,
        receipt_image: receipt_image || null,
        expense_date: expense_date || undefined
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

// Delete expense
router.delete('/:id', [
  param('id').isNumeric().withMessage('Invalid expense ID'),
], validate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Expense deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
