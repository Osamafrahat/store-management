import { Router } from 'express'
import { param, body, validationResult } from 'express-validator'
import supabase from '../db/supabase.js'
import { requireManager } from '../middleware/auth.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// ==================== LEAVE TYPES ====================

// Get all leave types
router.get('/types', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name')
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// Create leave type (admin)
router.post('/types', requireManager, [
  body('name').trim().notEmpty().withMessage('Leave type name is required'),
  body('days_per_year').isNumeric().withMessage('Days per year is required'),
], validate, async (req, res, next) => {
  try {
    const { name, days_per_year, is_paid } = req.body
    const { data, error } = await supabase
      .from('leave_types')
      .insert({ name, days_per_year, is_paid: is_paid !== false })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Update leave type (admin)
router.put('/types/:id', requireManager, [
  param('id').isNumeric().withMessage('Invalid leave type ID'),
], validate, async (req, res, next) => {
  try {
    const { name, days_per_year, is_paid, is_active } = req.body
    const { data, error } = await supabase
      .from('leave_types')
      .update({ name, days_per_year, is_paid, is_active })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ==================== LEAVE REQUESTS ====================

// Get leave requests
router.get('/requests', async (req, res, next) => {
  try {
    const { employee_id, status } = req.query
    let query = supabase
      .from('leave_requests')
      .select('*, employees(name, role), leave_types(name, is_paid)')
      .order('created_at', { ascending: false })
    if (employee_id) query = query.eq('employee_id', employee_id)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// Submit leave request
router.post('/requests', [
  body('employee_id').isNumeric().withMessage('Employee ID is required'),
  body('leave_type_id').isNumeric().withMessage('Leave type is required'),
  body('start_date').isISO8601().withMessage('Start date is required'),
  body('end_date').isISO8601().withMessage('End date is required'),
], validate, async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body
    const start = new Date(start_date + 'T00:00:00')
    const end = new Date(end_date + 'T00:00:00')
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        days,
        reason: reason || null,
        status: 'pending',
      })
      .select('*, employees(name, role), leave_types(name, is_paid)')
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Approve/reject leave request
router.patch('/requests/:id/approve', requireManager, [
  param('id').isNumeric().withMessage('Invalid request ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
], validate, async (req, res, next) => {
  try {
    const { status, notes } = req.body
    const { data: existing } = await supabase
      .from('leave_requests')
      .select('id, employee_id, leave_type_id, days, start_date')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Leave request not found' })
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: req.user.id,
        approved_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, employees(name, role), leave_types(name, is_paid)')
      .single()
    if (error) throw error

    // Update leave balance if approved
    if (status === 'approved') {
      const year = new Date(existing.start_date).getFullYear()
      const { data: balance } = await supabase
        .from('leave_balances')
        .select('id, used_days, remaining_days')
        .eq('employee_id', existing.employee_id)
        .eq('leave_type_id', existing.leave_type_id)
        .eq('year', year)
        .maybeSingle()

      if (balance) {
        await supabase
          .from('leave_balances')
          .update({
            used_days: parseFloat(balance.used_days) + parseFloat(existing.days),
            remaining_days: parseFloat(balance.remaining_days) - parseFloat(existing.days),
            updated_at: new Date().toISOString(),
          })
          .eq('id', balance.id)
      } else {
        // Get leave type for total days
        const { data: lt } = await supabase.from('leave_types').select('days_per_year').eq('id', existing.leave_type_id).single()
        const totalDays = lt?.days_per_year || 0
        await supabase.from('leave_balances').insert({
          employee_id: existing.employee_id,
          leave_type_id: existing.leave_type_id,
          year,
          total_days: totalDays,
          used_days: existing.days,
          remaining_days: totalDays - existing.days,
        })
      }
    }

    // Auto-create attendance + shift records for approved leave
    if (status === 'approved') {
      // Find or create a "Leave" shift
      let leaveShift = null
      const { data: existingShift } = await supabase
        .from('shifts')
        .select('id')
        .ilike('name', 'Leave')
        .maybeSingle()
      if (existingShift) {
        leaveShift = existingShift
      } else {
        const { data: newShift } = await supabase
          .from('shifts')
          .insert({ name: 'Leave', start_time: '00:00', end_time: '00:00' })
          .select('id')
          .single()
        leaveShift = newShift
      }

      const start = new Date(existing.start_date + 'T00:00:00')
      const end = new Date(existing.end_date + 'T00:00:00')
      const attendanceRecords = []
      const shiftRecords = []
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        // Check if attendance record already exists
        const { data: existingAtt } = await supabase
          .from('attendance')
          .select('id')
          .eq('employee_id', existing.employee_id)
          .eq('date', dateStr)
          .maybeSingle()
        if (!existingAtt) {
          attendanceRecords.push({
            employee_id: existing.employee_id,
            date: dateStr,
            status: 'on_leave',
            source: 'leave',
            notes: 'Approved leave',
          })
        }

        // Check if shift assignment already exists
        if (leaveShift) {
          const { data: existingShiftAssign } = await supabase
            .from('employee_shifts')
            .select('id')
            .eq('employee_id', existing.employee_id)
            .eq('date', dateStr)
            .maybeSingle()
          if (!existingShiftAssign) {
            shiftRecords.push({
              employee_id: existing.employee_id,
              shift_id: leaveShift.id,
              date: dateStr,
            })
          }
        }
      }
      if (attendanceRecords.length > 0) {
        await supabase.from('attendance').insert(attendanceRecords)
      }
      if (shiftRecords.length > 0) {
        await supabase.from('employee_shifts').insert(shiftRecords)
      }
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete leave request
router.delete('/requests/:id', requireManager, [
  param('id').isNumeric().withMessage('Invalid request ID'),
], validate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Leave request deleted' })
  } catch (err) {
    next(err)
  }
})

// ==================== LEAVE BALANCES ====================

// Get leave balances for an employee
router.get('/balances/:employeeId', [
  param('employeeId').isNumeric().withMessage('Invalid employee ID'),
], validate, async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear()
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*, leave_types(name, is_paid)')
      .eq('employee_id', req.params.employeeId)
      .eq('year', year)
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

export default router
