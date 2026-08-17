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

// Get attendance records (with filters)
router.get('/', async (req, res, next) => {
  try {
    const { employee_id, start_date, end_date, status } = req.query
    let query = supabase.from('attendance').select('*, employees(name, role)').order('date', { ascending: false })
    if (employee_id) query = query.eq('employee_id', employee_id)
    if (start_date) query = query.gte('date', start_date)
    if (end_date) query = query.lte('date', end_date)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// Get attendance summary for an employee
router.get('/summary/:employeeId', [
  param('employeeId').isNumeric().withMessage('Invalid employee ID'),
], validate, async (req, res, next) => {
  try {
    const { month, year } = req.query
    const m = parseInt(month) || (new Date().getMonth() + 1)
    const y = parseInt(year) || new Date().getFullYear()
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`
    const endMonth = m === 12 ? 1 : m + 1
    const endYear = m === 12 ? y + 1 : y
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', req.params.employeeId)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date')

    if (error) throw error

    const records = data || []
    const summary = {
      total_days: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      half_day: records.filter(r => r.status === 'half_day').length,
      on_leave: records.filter(r => r.status === 'on_leave').length,
      total_overtime: records.reduce((sum, r) => sum + (parseFloat(r.overtime_hours) || 0), 0),
      records,
    }

    res.json(summary)
  } catch (err) {
    next(err)
  }
})

// Create attendance record (clock in) - or clock in for current employee
router.post('/', [
  body('employee_id').isNumeric().withMessage('Employee ID is required'),
], validate, async (req, res, next) => {
  try {
    const { employee_id, date, status, notes, clock_in, clock_out, overtime_hours } = req.body
    const recordDate = date || new Date().toISOString().split('T')[0]

    // Check if record already exists for this employee/date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, clock_out')
      .eq('employee_id', employee_id)
      .eq('date', recordDate)
      .maybeSingle()

    if (existing) {
      // If clocking out
      if (clock_out && !existing.clock_out) {
        const { data, error } = await supabase
          .from('attendance')
          .update({ clock_out, overtime_hours: overtime_hours || 0, notes, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return res.json(data)
      }
      return res.status(409).json({ error: 'Attendance record already exists for this date' })
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id,
        date: recordDate,
        clock_in: clock_in || new Date().toISOString(),
        status: status || 'present',
        overtime_hours: overtime_hours || 0,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error
    req.logActivity?.({ action: 'created', entity_type: 'attendance', entity_name: `Employee ${employee_id} on ${recordDate}` })
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// Clock out
router.patch('/:id/clock-out', [
  param('id').isNumeric().withMessage('Invalid attendance ID'),
], validate, async (req, res, next) => {
  try {
    const { overtime_hours, notes } = req.body
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found' })
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        clock_out: new Date().toISOString(),
        overtime_hours: overtime_hours || 0,
        notes: notes || null,
        updated_at: new Date().toISOString(),
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

// Update attendance record (admin)
router.patch('/:id', requireManager, [
  param('id').isNumeric().withMessage('Invalid attendance ID'),
], validate, async (req, res, next) => {
  try {
    const { status, clock_in, clock_out, overtime_hours, notes } = req.body
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found' })
    }

    const updateData = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (clock_in !== undefined) updateData.clock_in = clock_in
    if (clock_out !== undefined) updateData.clock_out = clock_out
    if (overtime_hours !== undefined) updateData.overtime_hours = overtime_hours
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Delete attendance record (admin)
router.delete('/:id', requireManager, [
  param('id').isNumeric().withMessage('Invalid attendance ID'),
], validate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Attendance record deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
