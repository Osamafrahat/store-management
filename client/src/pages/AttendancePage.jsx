import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { useUserStore } from '../stores/userStore'
import { attendanceApi, employeesApi } from '../lib/api'
import { Clock, Calendar, User, CheckCircle, XCircle, AlertCircle, MinusCircle, Search, X } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import SearchableSelect from '../components/SearchableSelect'

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  on_leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

const STATUS_ICONS = {
  present: CheckCircle,
  absent: XCircle,
  late: AlertCircle,
  half_day: MinusCircle,
  on_leave: Calendar,
}

export default function AttendancePage() {
  const { t, toastSuccess, toastError } = useAppStore()
  const { currentUser } = useUserStore()
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const selectedYear = new Date().getFullYear()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formStatus, setFormStatus] = useState('present')
  const [formNotes, setFormNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isManager = currentUser?.role === 'MANAGER'

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const endMonth = selectedMonth === 12 ? 1 : selectedMonth + 1
      const endYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      const [empRes, attRes] = await Promise.all([
        employeesApi.getAll(),
        attendanceApi.getAll({ start_date: startDate, end_date: endDate }),
      ])
      setEmployees(empRes.data)
      setRecords(attRes.data)
    } catch (err) {
      toastError(t('hr.attendance.fetchFailed') || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const getEmployeeRecord = (empId) => {
    return records.find(r => r.employee_id === empId)
  }

  const handleCreate = async () => {
    if (!formEmployeeId) return
    setIsSubmitting(true)
    try {
      await attendanceApi.create({
        employee_id: parseInt(formEmployeeId),
        status: formStatus,
        notes: formNotes,
        clock_in: new Date().toISOString(),
      })
      toastSuccess(t('hr.attendance.created') || 'Attendance recorded')
      setShowForm(false)
      setFormEmployeeId('')
      setFormStatus('present')
      setFormNotes('')
      fetchData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.createFailed') || 'Failed to record attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClockOut = async (record) => {
    try {
      await attendanceApi.clockOut(record.id, { overtime_hours: 0 })
      toastSuccess(t('hr.attendance.clockedOut') || 'Clocked out')
      fetchData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.clockOutFailed') || 'Failed to clock out')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await attendanceApi.delete(deleteTarget.id)
      toastSuccess(t('hr.attendance.deleted') || 'Record deleted')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toastError(err.response?.data?.error || t('hr.attendance.deleteFailed') || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const late = records.filter(r => r.status === 'late').length
    const halfDay = records.filter(r => r.status === 'half_day').length
    const onLeave = records.filter(r => r.status === 'on_leave').length
    return { total, present, absent, late, half_day: halfDay, on_leave: onLeave }
  }, [records])

  const months = [
    t('months.january'), t('months.february'), t('months.march'), t('months.april'), t('months.may'), t('months.june'),
    t('months.july'), t('months.august'), t('months.september'), t('months.october'), t('months.november'), t('months.december')
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('hr.attendance.title') || 'Attendance'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('hr.attendance.subtitle') || 'Track employee attendance and hours'}</p>
        </div>
        {isManager && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <Clock className="w-4 h-4" /> {t('hr.attendance.addRecord') || 'Add Record'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t('hr.attendance.total') || 'Total', value: summary.total, color: 'text-gray-900 dark:text-white' },
          { label: t('hr.attendance.present') || 'Present', value: summary.present, color: 'text-green-600 dark:text-green-400' },
          { label: t('hr.attendance.absent') || 'Absent', value: summary.absent, color: 'text-red-600 dark:text-red-400' },
          { label: t('hr.attendance.late') || 'Late', value: summary.late, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: t('hr.attendance.halfDay') || 'Half Day', value: summary.half_day, color: 'text-orange-600 dark:text-orange-400' },
          { label: t('hr.attendance.onLeave') || 'On Leave', value: summary.on_leave, color: 'text-blue-600 dark:text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('hr.attendance.search') || 'Search employees...'}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
        </div>
      </div>

      {/* Attendance Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('hr.attendance.noEmployees') || 'No employees found'}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.employee') || 'Employee'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.role') || 'Role'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.status') || 'Status'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.clockIn') || 'Clock In'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.clockOut') || 'Clock Out'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('hr.attendance.overtime') || 'Overtime'}</th>
                  {isManager && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => {
                  const record = getEmployeeRecord(emp.id)
                  const StatusIcon = record ? STATUS_ICONS[record.status] || CheckCircle : Clock
                  return (
                    <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{emp.role}</td>
                      <td className="px-4 py-3">
                        {record ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[record.status] || ''}`}>
                            <StatusIcon className="w-3 h-3" />
                            {t(`hr.attendance.status.${record.status}`) || record.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">{t('hr.attendance.noRecord') || 'No record'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record ? formatTime(record.clock_in) : '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {record?.clock_out ? formatTime(record.clock_out) : record && isManager ? (
                          <button onClick={() => handleClockOut(record)}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                            {t('hr.attendance.clockOutBtn') || 'Clock Out'}
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record?.overtime_hours ? `${record.overtime_hours}h` : '-'}</td>
                      {isManager && (
                        <td className="px-4 py-3">
                          {record && (
                            <button onClick={() => setDeleteTarget(record)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hr.attendance.addRecord') || 'Add Attendance Record'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.attendance.employee') || 'Employee'}</label>
                <SearchableSelect
                  options={employees.filter(e => e.is_active).map(e => ({ value: e.id, label: e.name }))}
                  value={formEmployeeId}
                  onChange={setFormEmployeeId}
                  placeholder={t('hr.attendance.selectEmployee') || 'Search employee...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.attendance.status') || 'Status'}</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="present">{t('hr.attendance.present') || 'Present'}</option>
                  <option value="absent">{t('hr.attendance.absent') || 'Absent'}</option>
                  <option value="late">{t('hr.attendance.late') || 'Late'}</option>
                  <option value="half_day">{t('hr.attendance.halfDay') || 'Half Day'}</option>
                  <option value="on_leave">{t('hr.attendance.onLeave') || 'On Leave'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes') || 'Notes'}</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">{t('common.cancel') || 'Cancel'}</button>
                <button onClick={handleCreate} disabled={!formEmployeeId || isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
                  {isSubmitting ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('hr.attendance.deleteRecord') || 'Delete Record'}
        message={t('hr.attendance.deleteConfirm') || 'Are you sure you want to delete this attendance record?'}
        type="danger"
        loading={deleting}
      />
    </div>
  )
}
