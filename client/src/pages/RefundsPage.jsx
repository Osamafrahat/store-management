import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { refundsApi, ordersApi } from '../lib/api'
import { X, Plus, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'

export default function RefundsPage() {
  const { t } = useAppStore()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchRefunds()
  }, [])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const response = await refundsApi.getAll()
      setRefunds(response.data)
    } catch (err) {
      console.error('Failed to fetch refunds:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (refundData) => {
    try {
      await refundsApi.create(refundData)
      setShowForm(false)
      fetchRefunds()
    } catch (err) {
      console.error('Failed to process refund:', err)
      alert(err.response?.data?.error || 'Failed to process refund')
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
          <h1 className="text-2xl font-bold">Refunds</h1>
          <p className="text-gray-500 dark:text-gray-400">Process and track order refunds</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RotateCcw className="w-4 h-4" />
          Process Refund
        </button>
      </div>

      {/* Refunds List */}
      {refunds.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <RotateCcw className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Refunds Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Refunds will appear here when processed</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Processed By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm">
                    {new Date(refund.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {refund.orders?.order_number || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">
                    ${refund.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {refund.reason}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {refund.users?.full_name || 'System'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Form Modal */}
      {showForm && (
        <RefundForm
          onSave={handleRefund}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function RefundForm({ onSave, onClose }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')

  const searchOrder = async () => {
    if (!orderNumber.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await ordersApi.getAll({ search: orderNumber })
      const foundOrder = response.data.find(o => o.order_number === orderNumber)

      if (!foundOrder) {
        setError('Order not found')
        return
      }

      if (foundOrder.is_refunded) {
        setError('This order has already been refunded')
        return
      }

      setOrder(foundOrder)
      setRefundAmount(foundOrder.total.toString())
    } catch (err) {
      setError('Failed to search order')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!order || !reason.trim()) return

    onSave({
      order_id: order.id,
      amount: parseFloat(refundAmount),
      reason: reason.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Process Refund</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Order Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order Number *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter order number"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={searchOrder}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {order && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Total:</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method:</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {order && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refund Amount *
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min="0.01"
                  max={order.total}
                  step="0.01"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter reason for refund..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}

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
              disabled={!order || !reason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
