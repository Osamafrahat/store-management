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

// Get all employees
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (error) throw error

    // Enrich with user data
    const enriched = await Promise.all((data || []).map(async (emp) => {
      let user = null
      if (emp.user_id) {
        const { data: u } = await supabase.from('users').select('id, username, full_name, role').eq('id', emp.user_id).single()
        user = u || null
      }
      return { ...emp, user }
    }))

    res.json(enriched)
  } catch (err) {
    next(err)
  }
})

// Get employee by ID
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid employee ID'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Create employee
router.post('/', [
  body('name').trim().notEmpty().withMessage('Employee name is required'),
  body('role').trim().notEmpty().withMessage('Employee role is required'),
], validate, async (req, res, next) => {
  try {
    const { name, role, phone, email, salary, hire_date, notes, user_id } = req.body

    const { data, error } = await supabase
      .from('employees')
      .insert({
        name,
        role,
        phone: phone || null,
        email: email || null,
        salary: salary || 0,
        hire_date: hire_date || null,
        notes: notes || null,
        user_id: user_id || null
      })
      .select()
      .single()

    if (error) throw error

    // Link user back to this employee if user_id provided
    if (user_id) {
      await supabase.from('users').update({ employee_id: data.id, updated_at: new Date().toISOString() }).eq('id', user_id)
    }

    req.logActivity({ action: 'created', entity_type: 'employee', entity_name: data.name })
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update employee
router.put('/:id', [
  param('id').isNumeric().withMessage('Invalid employee ID'),
  body('name').trim().notEmpty().withMessage('Employee name is required'),
  body('role').trim().notEmpty().withMessage('Employee role is required'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('employees')
      .select('id, user_id, is_active')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    const { name, role, phone, email, salary, hire_date, notes, is_active, user_id } = req.body

    const { data, error } = await supabase
      .from('employees')
      .update({
        name,
        role,
        phone: phone || null,
        email: email || null,
        salary: salary || 0,
        hire_date: hire_date || null,
        notes: notes || null,
        is_active: is_active ?? true,
        user_id: user_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    // Sync user link if user_id changed
    if (user_id !== undefined) {
      // Remove old user link if exists
      if (existing.user_id && existing.user_id !== user_id) {
        await supabase.from('users').update({ employee_id: null, updated_at: new Date().toISOString() }).eq('id', existing.user_id)
      }
      // Set new user link
      if (user_id) {
        await supabase.from('users').update({ employee_id: data.id, updated_at: new Date().toISOString() }).eq('id', user_id)
      }
    }

    // Sync is_active status to linked user
    if (is_active !== undefined && existing.user_id && existing.is_active !== is_active) {
      await supabase.from('users').update({ is_active, updated_at: new Date().toISOString() }).eq('id', existing.user_id)
    }

    req.logActivity({ action: 'updated', entity_type: 'employee', entity_id: req.params.id })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete employee (soft delete) - also deactivates linked user
router.delete('/:id', [
  param('id').isNumeric().withMessage('Invalid employee ID'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('employees')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    // Deactivate linked user
    if (existing.user_id) {
      await supabase.from('users').update({ is_active: false, employee_id: null, updated_at: new Date().toISOString() }).eq('id', existing.user_id)
    }

    const { error } = await supabase
      .from('employees')
      .update({ is_active: false, user_id: null })
      .eq('id', req.params.id)

    if (error) throw error
    req.logActivity({ action: 'deleted', entity_type: 'employee', entity_id: req.params.id })
    res.json({ message: 'Employee deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
