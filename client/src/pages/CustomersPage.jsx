import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { customersApi } from '../lib/api'
import { X, Plus, Edit2, Trash2, User, Phone, Mail, MapPin, Star } from 'lucide-react'

export default function CustomersPage() {
  const { t, toastSuccess, toastError } = useAppStore()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await customersApi.getAll({ search: searchQuery })
      setCustomers(response.data)
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCustomers()
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('customers.deleteConfirm') || 'Are you sure you want to delete this customer?')) return
    try {
      await customersApi.delete(id)
      toastSuccess(t('customers.deleted') || 'Customer deleted successfully')
      fetchCustomers()
    } catch (err) {
      console.error('Failed to delete customer:', err)
      toastError(t('customers.failedToDelete') || 'Failed to delete customer')
    }
  }

  const handleSave = async (customerData) => {
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, customerData)
        toastSuccess(t('customers.updated') || 'Customer updated successfully')
      } else {
        await customersApi.create(customerData)
        toastSuccess(t('customers.created') || 'Customer added successfully')
      }
      setShowForm(false)
      setEditingCustomer(null)
      fetchCustomers()
    } catch (err) {
      console.error('Failed to save customer:', err)
      const errorMsg = err.response?.data?.error || t('customers.failedToSave') || 'Failed to save customer'
      toastError(errorMsg)
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
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('customers.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder={t('customers.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {t('common.search')}
        </button>
      </form>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('customers.noCustomers')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('customers.addFirst')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('customers.since')} {new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4" />
                  <span>{customer.loyalty_points || 0} {t('customers.points')}</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {t('customers.totalLabel')} ${customer.total_spent?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingCustomer(null)
          }}
        />
      )}
    </div>
  )
}

function CustomerForm({ customer, onSave, onClose }) {
  const { t } = useAppStore()

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 11) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...formData, phone: formData.phone || '' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {customer ? t('customers.editCustomer') : t('customers.addCustomer')}
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
              {t('customers.name')} *
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
              {t('customers.phone')}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              inputMode="numeric"
              maxLength={11}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customers.email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customers.address')}
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customers.notes')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {customer ? t('common.edit') : t('common.add')} {t('customers.name')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
