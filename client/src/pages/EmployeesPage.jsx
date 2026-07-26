import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { employeesApi } from '../lib/api'
import { X, Plus, Edit2, Trash2, UserCheck, Phone, Mail, Calendar, DollarSign } from 'lucide-react'

const EMPLOYEE_ROLES = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'INVENTORY_CLERK', label: 'Inventory Clerk' },
  { value: 'SALES', label: 'Sales' },
  { value: 'OTHER', label: 'Other' },
]

export default function EmployeesPage() {
  const { t, toastSuccess, toastError } = useAppStore()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await employeesApi.getAll()
      setEmployees(response.data)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('employees.deleteConfirm') || 'Are you sure you want to delete this employee?')) return
    try {
      await employeesApi.delete(id)
      toastSuccess(t('employees.deleted') || 'Employee deleted successfully')
      fetchEmployees()
    } catch (err) {
      console.error('Failed to delete employee:', err)
      toastError(t('employees.failedToDelete') || 'Failed to delete employee')
    }
  }

  const handleSave = async (employeeData) => {
    try {
      if (editingEmployee) {
        await employeesApi.update(editingEmployee.id, employeeData)
        toastSuccess(t('employees.updated') || 'Employee updated successfully')
      } else {
        await employeesApi.create(employeeData)
        toastSuccess(t('employees.created') || 'Employee added successfully')
      }
      setShowForm(false)
      setEditingEmployee(null)
      fetchEmployees()
    } catch (err) {
      console.error('Failed to save employee:', err)
      toastError(t('employees.failedToSave') || 'Failed to save employee')
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      CASHIER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INVENTORY_CLERK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      SALES: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return colors[role] || colors.OTHER
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your team members</p>
        </div>
        <button
          onClick={() => {
            setEditingEmployee(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <UserCheck className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Employees Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <UserCheck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(employee.role)}`}>
                      {EMPLOYEE_ROLES.find(r => r.value === employee.role)?.label || employee.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {employee.phone && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Hired: {new Date(employee.hire_date).toLocaleDateString()}</span>
                  </div>
                )}
                {employee.salary > 0 && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Salary: ${employee.salary.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-xs px-2 py-1 rounded-full ${employee.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingEmployee(null)
          }}
        />
      )}
    </div>
  )
}

function EmployeeForm({ employee, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    role: employee?.role || 'CASHIER',
    phone: employee?.phone || '',
    email: employee?.email || '',
    salary: employee?.salary || '',
    hire_date: employee?.hire_date || '',
    notes: employee?.notes || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {EMPLOYEE_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hire Date
              </label>
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {employee ? 'Update' : 'Add'} Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
