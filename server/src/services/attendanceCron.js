import cron from 'node-cron'
import supabase from '../db/supabase.js'

let autoClockOutJob = null

async function runAutoClockOut() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get settings
    const { data: settingsData } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', ['attendance.autoClockOut', 'attendance.autoClockOutTime', 'attendance.overtimeThresholdHours'])

    const settings = {}
    settingsData?.forEach(s => { settings[s.key] = s.value })

    if (settings['attendance.autoClockOut'] !== 'true') return

    const autoTime = settings['attendance.autoClockOutTime'] || '23:00'
    const threshold = parseFloat(settings['attendance.overtimeThresholdHours'] || '8')

    // Find employees with shifts today who haven't clocked out
    const { data: assignments } = await supabase
      .from('employee_shifts')
      .select('employee_id')
      .eq('date', today)

    if (!assignments?.length) return

    let processed = 0
    for (const { employee_id } of assignments) {
      const { data: record } = await supabase
        .from('attendance')
        .select('id, clock_in, clock_out')
        .eq('employee_id', employee_id)
        .eq('date', today)
        .maybeSingle()

      if (record && !record.clock_out) {
        const clockOut = `${today}T${autoTime}:00.000Z`
        const totalMs = new Date(clockOut) - new Date(record.clock_in)
        const totalHours = Math.max(0, totalMs / 3600000)
        const overtimeHours = totalHours > threshold ? Math.round((totalHours - threshold) * 100) / 100 : 0

        await supabase
          .from('attendance')
          .update({
            clock_out: clockOut,
            total_hours: Math.round(totalHours * 100) / 100,
            overtime_hours: overtimeHours,
            notes: 'Auto clocked out by system',
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id)
        processed++
      }
    }

    if (processed > 0) {
      console.log(`[Attendance Cron] Auto clock-out: ${processed} employees processed`)
    }

    // Mark employees with shifts but no attendance as absent
    const { data: attendedEmpIds } = await supabase
      .from('attendance')
      .select('employee_id')
      .eq('date', today)

    const attendedIds = new Set(attendedEmpIds?.map(r => r.employee_id) || [])
    const absentEmployees = assignments.filter(a => !attendedIds.has(a.employee_id))

    for (const { employee_id } of absentEmployees) {
      await supabase
        .from('attendance')
        .insert({
          employee_id,
          date: today,
          status: 'absent',
          source: 'auto',
          notes: 'Auto-marked absent by system',
        })
    }

    if (absentEmployees.length > 0) {
      console.log(`[Attendance Cron] Auto-absent: ${absentEmployees.length} employees marked absent`)
    }
  } catch (err) {
    console.error('[Attendance Cron] Error:', err.message)
  }
}

export function startAttendanceCron() {
  // Run every day at 23:05 (5 minutes after the default auto clock-out time)
  autoClockOutJob = cron.schedule('5 23 * * *', runAutoClockOut)
  console.log('Attendance cron job started (auto clock-out at 23:05)')
}

export function stopAttendanceCron() {
  if (autoClockOutJob) {
    autoClockOutJob.stop()
    autoClockOutJob = null
  }
}
