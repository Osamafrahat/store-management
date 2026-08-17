import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useUserStore } from '../../stores/userStore'
import { attendanceApi, shiftsApi } from '../../lib/api'
import { Clock, LogIn, LogOut, Coffee, Pause, MapPin } from 'lucide-react'

export default function ClockWidget() {
  const { t, toastSuccess, toastError } = useAppStore()
  const currentUser = useUserStore(s => s.currentUser)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState(null)
  const [todayShift, setTodayShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [location, setLocation] = useState(null)

  const today = currentTime.toISOString().split('T')[0]

  const fetchTodayData = useCallback(async () => {
    try {
      const [attRes, shiftRes] = await Promise.all([
        attendanceApi.getAll({ start_date: today, end_date: today, employee_id: currentUser?.employee_id }),
        shiftsApi.getAssignments({ start_date: today, end_date: today, employee_id: currentUser?.employee_id }),
      ])
      setTodayRecord(attRes.data?.[0] || null)
      setTodayShift(shiftRes.data?.[0] || null)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [today, currentUser?.employee_id])

  useEffect(() => { fetchTodayData() }, [fetchTodayData])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  const handleClockIn = async () => {
    setActionLoading(true)
    try {
      const loc = await getLocation()
      const data = loc ? { location: loc } : {}
      await attendanceApi.clockIn(data)
      toastSuccess(t('hr.attendance.clockedIn') || 'Clocked in successfully')
      fetchTodayData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.clockInFailed') || 'Failed to clock in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    setActionLoading(true)
    try {
      const loc = await getLocation()
      const data = loc ? { location: loc } : {}
      await attendanceApi.selfClockOut(data)
      toastSuccess(t('hr.attendance.clockedOut') || 'Clocked out successfully')
      fetchTodayData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.clockOutFailed') || 'Failed to clock out')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBreakStart = async () => {
    setActionLoading(true)
    try {
      await attendanceApi.breakStart()
      toastSuccess(t('hr.attendance.breakStarted') || 'Break started')
      fetchTodayData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.breakStartFailed') || 'Failed to start break')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBreakEnd = async () => {
    setActionLoading(true)
    try {
      await attendanceApi.breakEnd()
      toastSuccess(t('hr.attendance.breakEnded') || 'Break ended')
      fetchTodayData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.breakEndFailed') || 'Failed to end break')
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isClockedIn = todayRecord && !todayRecord.clock_out
  const isOnBreak = todayRecord?.break_start && !todayRecord?.break_end
  const isClockedOut = todayRecord?.clock_out

  const totalHoursWorked = todayRecord?.clock_in
    ? ((Date.now() - new Date(todayRecord.clock_in).getTime()) / 3600000).toFixed(1)
    : '0.0'

  if (!currentUser?.employee_id) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('hr.attendance.noEmployeeProfile') || 'No employee profile linked to your account'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{currentUser?.fullName || currentUser?.username}</h3>
            <p className="text-primary-100 text-sm">{currentUser?.role}</p>
          </div>
          <div className="text-end">
            <div className="text-3xl font-mono font-bold">{formatTime(currentTime)}</div>
            <div className="text-primary-100 text-sm">{today}</div>
          </div>
        </div>
      </div>

      {/* Shift info */}
      {todayShift && (
        <div className="px-6 py-3 bg-primary-50 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-900/20">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-primary-700 dark:text-primary-300 font-medium">
              {todayShift.shifts?.name}
            </span>
            <span className="text-primary-500 dark:text-primary-400">
              ({todayShift.shifts?.start_time?.slice(0, 5)} - {todayShift.shifts?.end_time?.slice(0, 5)})
            </span>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Current status */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-3 h-3 rounded-full ${isClockedIn && !isClockedOut ? 'bg-green-500 animate-pulse' : isOnBreak ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isClockedOut
                  ? (t('hr.attendance.statusClockedOut') || 'Clocked Out')
                  : isOnBreak
                    ? (t('hr.attendance.statusOnBreak') || 'On Break')
                    : isClockedIn
                      ? (t('hr.attendance.statusClockedIn') || 'Clocked In')
                      : (t('hr.attendance.statusNotClockedIn') || 'Not Clocked In')
                }
              </span>
              {todayRecord?.clock_in && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(todayRecord.clock_in)}
                  {todayRecord?.clock_out ? ` → ${formatTime(todayRecord.clock_out)}` : ''}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{totalHoursWorked}h</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('hr.attendance.totalHours') || 'Hours'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{todayRecord?.overtime_hours || 0}h</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('hr.attendance.overtime') || 'Overtime'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{todayRecord?.break_minutes || 0}m</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('hr.attendance.break') || 'Break'}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isClockedIn || isClockedOut ? (
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading || isClockedOut}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all active:scale-95"
                >
                  <LogIn className="w-5 h-5" />
                  {t('hr.attendance.clockIn') || 'Clock In'}
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading || isOnBreak}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                  {t('hr.attendance.clockOut') || 'Clock Out'}
                </button>
              )}

              {isClockedIn && !isClockedOut && (
                !isOnBreak ? (
                  <button
                    onClick={handleBreakStart}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all active:scale-95"
                  >
                    <Coffee className="w-5 h-5" />
                    {t('hr.attendance.startBreak') || 'Break'}
                  </button>
                ) : (
                  <button
                    onClick={handleBreakEnd}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all active:scale-95"
                  >
                    <Pause className="w-5 h-5" />
                    {t('hr.attendance.endBreak') || 'End Break'}
                  </button>
                )
              )}
            </div>

            {/* Break details */}
            {todayRecord?.break_start && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <Coffee className="w-4 h-4" />
                  <span>
                    {t('hr.attendance.breakPeriod') || 'Break'}: {formatTime(todayRecord.break_start)}
                    {todayRecord.break_end ? ` → ${formatTime(todayRecord.break_end)}` : ' → ...'}
                    {todayRecord.break_minutes ? ` (${todayRecord.break_minutes} min)` : ''}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
