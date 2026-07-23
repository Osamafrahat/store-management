import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import supabase from '../db/supabase.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Get user by ID
router.get('/:id', [
  param('id').isNumeric().withMessage('Invalid user ID'),
], validate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, created_at, updated_at')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Create user
router.post('/', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['MANAGER', 'CASHIER', 'INVENTORY_CLERK', 'VIEWER']).withMessage('Invalid role'),
], validate, async (req, res, next) => {
  try {
    const { username, password, fullName, role, permissions } = req.body

    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'Username already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        full_name: fullName,
        role,
        permissions: permissions || [],
        is_active: true,
        must_change_password: false
      })
      .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, created_at, updated_at')
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update user
router.put('/:id', [
  param('id').isNumeric().withMessage('Invalid user ID'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('role').optional().isIn(['MANAGER', 'CASHIER', 'INVENTORY_CLERK', 'VIEWER']).withMessage('Invalid role'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { fullName, role, permissions, password } = req.body

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (fullName !== undefined) updateData.full_name = fullName
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, created_at, updated_at')
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Toggle user active status
router.patch('/:id/toggle-active', [
  param('id').isNumeric().withMessage('Invalid user ID'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: !existing.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('id, username, full_name, role, permissions, is_active, must_change_password, last_login, created_at, updated_at')
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete user
router.delete('/:id', [
  param('id').isNumeric().withMessage('Invalid user ID'),
], validate, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (existing.username === 'admin') {
      return res.status(403).json({ error: 'Cannot delete the admin user' })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
