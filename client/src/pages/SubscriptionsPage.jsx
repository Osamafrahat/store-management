import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useUserStore, PERMISSIONS } from '../stores/userStore'
import { subscriptionsApi, servicesApi, servicePlansApi, customersApi } from '../lib/api'
import { X, Plus, Edit2, Trash2, RefreshCw, Ban, CreditCard, Calendar, User, Search } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

const STATUS_STYLES = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  expired: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  past_due: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
}

const STATUS_LABEL_KEYS = {
  active: 'services.statusActive',
  cancelled: 'services.statusCancelled',
  expired: 'services.statusExpired',
  past_due: 'services.statusPastDue',
}

export default function SubscriptionsPage() {
  const { t, language } = useAppStore()
  const { hasPermission } = useUserStore()
  const canEdit = hasPermission(PERMISSIONS.SERVICES_EDIT)
  const [subscriptions, setSubscriptions] = useState([])
  const [services, setServicesList] = useState([])
  const [plans, setPlansList] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [showPayments, setShowPayments] = useState(null)
  const [showPayForm, setShowPayForm] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subRes, svcRes, planRes, custRes] = await Promise.all([
        subscriptionsApi.getAll(filterStatus ? { status: filterStatus } : {}),
        servicesApi.getAll(),
        servicePlansApi.getAll(),
        customersApi.getAll(),
      ])
      setSubscriptions(subRes.data)
      setServicesList(svcRes.data)
      setPlansList(planRes.data)
      setCustomers(custRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterStatus])

  const handleCancel = async (id) => {
    try {
      await subscriptionsApi.cancel(id)
      fetchData()
    } catch (err) {
      console.error('Failed to cancel:', err)
    }
  }

  const handleRenew = async (id) => {
    try {
      await subscriptionsApi.renew(id)
      fetchData()
    } catch (err) {
      console.error('Failed to renew:', err)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await subscriptionsApi.delete(id)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('services.subscriptionsTitle') || 'Subscriptions'}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('services.subscriptionsSubtitle') || 'Manage customer subscriptions'}</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />{t('services.addSubscription') || 'Add Subscription'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'active', 'expired', 'cancelled', 'past_due'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {s ? t(STATUS_LABEL_KEYS[s]) || s : t('services.all') || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('common.loading') || 'Loading...'}</div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500">{t('services.noSubscriptions') || 'No subscriptions yet'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.customer') || 'Customer'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.service') || 'Service'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.plan') || 'Plan'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.amount') || 'Amount'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.startDate') || 'Start'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.endDate') || 'End'}</th>
                  <th className="text-start p-4 font-medium text-gray-500">{t('services.status') || 'Status'}</th>
                  {canEdit && <th className="text-end p-4 font-medium text-gray-500">{t('common.actions') || 'Actions'}</th>}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {sub.customer?.name || '-'}
                      </div>
                    </td>
                    <td className="p-4">{language === 'ar' && sub.service?.name_ar ? sub.service.name_ar : sub.service?.name || '-'}</td>
                    <td className="p-4">{language === 'ar' && sub.plan?.name_ar ? sub.plan.name_ar : sub.plan?.name || '-'}</td>
                    <td className="p-4 font-semibold">{sub.billing_amount?.toLocaleString()} {t('common.currency') || 'EGP'}</td>
                    <td className="p-4">{sub.start_date}</td>
                    <td className="p-4">{sub.end_date || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[sub.status] || ''}`}>
                        {t(STATUS_LABEL_KEYS[sub.status]) || sub.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {sub.status === 'active' && (
                            <>
                              <button onClick={() => handleRenew(sub.id)} title={t('services.renew')}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                              <button onClick={() => handleCancel(sub.id)} title={t('services.cancel')}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Ban className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => { setEditing(sub); setShowForm(true) }} title={t('services.edit')}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setShowPayments(sub.id)} title={t('services.payments')}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"><CreditCard className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(sub.id)} title={t('services.delete')}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          subscription={editing} services={services} plans={plans} customers={customers}
          onSave={async (data) => {
            if (editing) await subscriptionsApi.update(editing.id, data)
            else await subscriptionsApi.create(data)
            setShowForm(false); setEditing(null); fetchData()
          }} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}
      {showPayments && <PaymentsModal subscriptionId={showPayments} onClose={() => setShowPayments(null)} onRecord={async (data) => {
        await subscriptionsApi.recordPayment(showPayments, data)
        setShowPayments(null)
      }} />}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)}
        title={t('services.deleteSubscription') || 'Delete Subscription'} message={t('services.deleteSubConfirm') || 'Are you sure?'} type="danger" loading={deleting} />
    </div>
  )
}

function SubscriptionForm({ subscription, services, plans, customers, onSave, onClose }) {
  const { t } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    customer_id: subscription?.customer_id || '',
    service_id: subscription?.service_id || '',
    plan_id: subscription?.plan_id || '',
    start_date: subscription?.start_date || today,
    end_date: subscription?.end_date || '',
    next_billing_date: subscription?.next_billing_date || '',
    auto_renew: subscription?.auto_renew !== false,
    billing_amount: subscription?.billing_amount || '',
    notes: subscription?.notes || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ ...form, billing_amount: parseFloat(form.billing_amount) || 0, customer_id: parseInt(form.customer_id) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{subscription ? t('services.editSubscription') : t('services.addSubscription')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('services.customer') || 'Customer'} *</label>
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="">{t('services.selectCustomer') || 'Select customer'}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.service') || 'Service'}</label>
              <select value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <option value="">{t('services.selectService') || 'Select service'}</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.plan') || 'Plan'}</label>
              <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <option value="">{t('services.selectPlan') || 'Select plan'}</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price?.toLocaleString()} {t('common.currency') || 'EGP'}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.startDate') || 'Start Date'} *</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.endDate') || 'End Date'}</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.nextBilling') || 'Next Billing'}</label>
              <input type="date" value={form.next_billing_date} onChange={e => setForm({ ...form, next_billing_date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('services.amount') || 'Amount'} *</label>
              <input type="number" step="0.01" min="0" value={form.billing_amount} onChange={e => setForm({ ...form, billing_amount: e.target.value })} required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="auto_renew" checked={form.auto_renew} onChange={e => setForm({ ...form, auto_renew: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded" />
            <label htmlFor="auto_renew" className="text-sm">{t('services.autoRenew') || 'Auto Renew'}</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('services.notes') || 'Notes'}</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">{t('common.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PaymentsModal({ subscriptionId, onClose, onRecord }) {
  const { t } = useAppStore()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPayForm, setShowPayForm] = useState(false)
  const [form, setForm] = useState({ amount: '', payment_method: 'cash', notes: '' })

  useEffect(() => {
    subscriptionsApi.getPayments(subscriptionId).then(({ data }) => {
      setPayments(data); setLoading(false)
    }).catch(() => setLoading(false))
  }, [subscriptionId])

  const handleRecord = async (e) => {
    e.preventDefault()
    await onRecord({ ...form, amount: parseFloat(form.amount) || 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{t('services.payments') || 'Payments'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPayForm(!showPayForm)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Plus className="w-4 h-4 inline mr-1" />{t('services.recordPayment') || 'Record Payment'}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {showPayForm && (
            <form onSubmit={handleRecord} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" min="0" placeholder={t('services.amount') || 'Amount'} value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} required
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  <option value="cash">{t('payments.cash') || 'Cash'}</option>
                  <option value="card">{t('payments.card') || 'Card'}</option>
                  <option value="bank">{t('payments.bank') || 'Bank Transfer'}</option>
                </select>
              </div>
              <button type="submit" className="w-full px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">{t('common.save')}</button>
            </form>
          )}
          {loading ? (
            <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-6 text-gray-500">{t('services.noPayments') || 'No payments yet'}</div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium">{p.amount?.toLocaleString()} {t('common.currency') || 'EGP'}</div>
                    <div className="text-xs text-gray-500">{p.payment_date} - {p.payment_method}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status === 'paid' ? t('services.paymentPaid') : p.status === 'pending' ? t('services.paymentPending') : t('services.paymentFailed')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
