import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import supabase from '../db/supabase.js'
import { requireManager } from '../middleware/auth.js'

const router = Router()

// Role-based permissions mapping (mirrors frontend ROLES in userStore.js)
const ROLE_PERMISSIONS = {
  MANAGER: ['pos_access','inventory_view','inventory_edit','reports_view','suppliers_view','suppliers_edit','promotions_view','promotions_edit','settings_view','settings_edit','user_manage','customers_view','customers_edit','expenses_view','expenses_edit','refunds_view','refunds_edit','employees_view','employees_edit','accounting_view','accounting_edit','accounting_post'],
  SALES_MANAGER: ['pos_access','inventory_view','reports_view','suppliers_view','promotions_view','promotions_edit','customers_view','customers_edit','refunds_view','refunds_edit','expenses_view'],
  CASHIER: ['pos_access','reports_view','customers_view','customers_edit','refunds_view'],
  SENIOR_CASHIER: ['pos_access','inventory_view','reports_view','customers_view','customers_edit','refunds_view','refunds_edit','promotions_view'],
  INVENTORY_CLERK: ['pos_access','inventory_view','inventory_edit','suppliers_view','suppliers_edit','reports_view'],
  SALES_ASSOCIATE: ['pos_access','inventory_view','customers_view','customers_edit','promotions_view','reports_view'],
  VIEWER: ['pos_access','inventory_view','reports_view','suppliers_view','promotions_view','customers_view','expenses_view','refunds_view'],
  ACCOUNTANT: ['pos_access','accounting_view','accounting_edit','accounting_post','reports_view','expenses_view','expenses_edit','suppliers_view','customers_view'],
}

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

// Create employee (admin-only)
router.post('/', requireManager, [
  body('name').trim().notEmpty().withMessage('Employee name is required'),
  body('role').trim().notEmpty().withMessage('Employee role is required'),
], validate, async (req, res, next) => {
  try {
    const { name, role, phone, email, salary, hire_date, notes, create_user, username, password, user_role } = req.body

    // Create employee
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
      })
      .select()
      .single()

    if (error) throw error

    // Auto-create user account if requested
    let user = null
    if (create_user && username) {
      const validRole = ['MANAGER','SALES_MANAGER','CASHIER','SENIOR_CASHIER','INVENTORY_CLERK','SALES_ASSOCIATE','VIEWER','ACCOUNTANT'].includes(user_role) ? user_role : 'CASHIER'

      // Check username uniqueness
      const { data: existingUser } = await supabase.from('users').select('id').eq('username', username).single()
      if (existingUser) {
        return res.status(409).json({ error: `Username "${username}" already exists` })
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password || 'changeme123', salt)

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          username,
          password: hashedPassword,
          full_name: name,
          role: validRole,
          permissions: ROLE_PERMISSIONS[validRole] || ROLE_PERMISSIONS.CASHIER,
          is_active: true,
          must_change_password: true,
          employee_id: data.id,
        })
        .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, employee_id, created_at, updated_at')
        .single()

      if (userError) throw userError

      // Link employee back to user
      await supabase.from('employees').update({ user_id: newUser.id, updated_at: new Date().toISOString() }).eq('id', data.id)
      user = newUser
    }

    req.logActivity({ action: 'created', entity_type: 'employee', entity_name: data.name })
    res.status(201).json({ ...data, user })
  } catch (err) {
    next(err)
  }
})

// Update employee (admin-only)
router.put('/:id', requireManager, [
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

// Toggle employee active status - admin-only, also toggles linked user
router.patch('/:id/toggle-active', requireManager, [
  param('id').isNumeric().withMessage('Invalid employee ID'),
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

    const newActiveState = !existing.is_active

    const { data, error } = await supabase
      .from('employees')
      .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    // Sync linked user's active status
    if (existing.user_id) {
      const { error: userUpdateError } = await supabase.from('users').update({ is_active: newActiveState, updated_at: new Date().toISOString() }).eq('id', existing.user_id)
      if (userUpdateError) console.error('Failed to sync user active status:', userUpdateError)
    }

    req.logActivity({ action: newActiveState ? 'activated' : 'deactivated', entity_type: 'employee', entity_id: req.params.id })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete employee (hard delete) - admin-only, unlinks and deactivates linked user
router.delete('/:id', requireManager, [
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

    // Delete linked user
    if (existing.user_id) {
      await supabase.from('users').delete().eq('id', existing.user_id)
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    req.logActivity({ action: 'deleted', entity_type: 'employee', entity_id: req.params.id })
    res.json({ message: 'Employee deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
