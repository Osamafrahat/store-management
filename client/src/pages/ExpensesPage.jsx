import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { expensesApi } from '../lib/api'
import { X, Plus, Edit2, Trash2, Receipt, DollarSign, TrendingDown, Filter } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Supplies',
  'Marketing',
  'Maintenance',
  'Transport',
  'Insurance',
  'Other',
]

export default function ExpensesPage() {
  const { t, toastSuccess, toastError } = useAppStore()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ summary: {}, total: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchExpenses()
    fetchSummary()
  }, [dateFilter, categoryFilter])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFilter.start) params.start_date = dateFilter.start
      if (dateFilter.end) params.end_date = dateFilter.end
      if (categoryFilter) params.category = categoryFilter

      const response = await expensesApi.getAll(params)
      setExpenses(response.data)
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const params = {}
      if (dateFilter.start) params.start_date = dateFilter.start
      if (dateFilter.end) params.end_date = dateFilter.end

      const response = await expensesApi.getSummary(params)
      setSummary(response.data)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('expenses.deleteConfirm') || 'Are you sure you want to delete this expense?')) return
    try {
      await expensesApi.delete(id)
      toastSuccess(t('expenses.deleted') || 'Expense deleted successfully')
      fetchExpenses()
      fetchSummary()
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toastError(t('expenses.failedToDelete') || 'Failed to delete expense')
    }
  }

  const handleSave = async (expenseData) => {
    try {
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, expenseData)
        toastSuccess(t('expenses.updated') || 'Expense updated successfully')
      } else {
        await expensesApi.create(expenseData)
        toastSuccess(t('expenses.created') || 'Expense added successfully')
      }
      setShowForm(false)
      setEditingExpense(null)
      fetchExpenses()
      fetchSummary()
    } catch (err) {
      console.error('Failed to save expense:', err)
      toastError(t('expenses.failedToSave') || 'Failed to save expense')
    }
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
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold">${summary.total?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
              <p className="text-xl font-bold">{expenses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-xl font-bold">{Object.keys(summary.summary || {}).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      {Object.keys(summary.summary || {}).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold mb-3">Expenses by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(summary.summary).map(([category, amount]) => (
              <div key={category} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{category}</p>
                <p className="font-semibold">${amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Expenses Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Record your first expense to get started</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm">{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{expense.description || '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">${expense.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-gray-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}

function ExpenseForm({ expense, onSave, onClose }) {
  const [formData, setFormData] = useState({
    category: expense?.category || EXPENSE_CATEGORIES[0],
    amount: expense?.amount || '',
    description: expense?.description || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
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
              {expense ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
