import { useState, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { customersApi, notificationsApi } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import {
  X,
  Send,
  Mail,
  MessageCircle,
  Users,
  CheckCircle,
  Loader2,
  Percent,
  DollarSign,
  ExternalLink,
  User,
  AlertCircle,
} from 'lucide-react'

function generateWhatsAppLink(phone, message) {
  const num = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

export default function SendPromotionModal({ promotion, onClose, onSent }) {
  const { t, toastSuccess, toastError } = useAppStore()
  const [sendMethod, setSendMethod] = useState('whatsapp')
  const [step, setStep] = useState('form')
  const [sending, setSending] = useState(false)

  const [whatsappLinks, setWhatsappLinks] = useState(null)
  const [whatsappError, setWhatsappError] = useState(null)
  const [emailResults, setEmailResults] = useState(null)
  const [emailError, setEmailError] = useState(null)

  const discount = promotion.type === 'percentage'
    ? `${promotion.value}%`
    : formatCurrency(promotion.value)

  const buildMessage = (storeName) => {
    const discountText = promotion.type === 'percentage'
      ? `${promotion.value}%`
      : `${promotion.value} ج.م`

    return `🎉 *عرض خاص من ${storeName}*\n\n` +
      `خصم *${discountText}*\n\n` +
      `📦 استخدم كود الخصم:\n*${promotion.code}*\n\n` +
      (promotion.min_order_amount ? `📌 الحد الأدنى للطلب: ${promotion.min_order_amount} ج.م\n` : '') +
      `📅 صالح حتى: ${new Date(promotion.end_date).toLocaleDateString('ar-EG')}\n\n` +
      `سارع بالاستفادة! 🛒`
  }

  const getStoreName = () => {
    try {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}')
      return settings.storeName || 'المتجر'
    } catch { return 'المتجر' }
  }

  const loadWhatsApp = useCallback(async () => {
    try {
      setWhatsappLinks(null)
      setWhatsappError(null)
      const res = await customersApi.getAll()
      const allCustomers = res.data || []
      const withPhone = allCustomers.filter(c => c.phone && c.phone.trim())
      const message = buildMessage(getStoreName())
      const links = withPhone.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        link: generateWhatsAppLink(c.phone, message),
      }))
      setWhatsappLinks(links)
    } catch (err) {
      console.error('[SendPromotion] WhatsApp load error:', err)
      setWhatsappError(err.response?.data?.error || err.message || 'Failed to load customers')
      setWhatsappLinks([])
    }
  }, [])

  const loadEmail = useCallback(async () => {
    try {
      setEmailResults(null)
      setEmailError(null)
      const res = await notificationsApi.sendPromotion(promotion.id, {
        send_email: true,
        send_whatsapp: false,
      })
      setEmailResults(res.data)
    } catch (err) {
      console.error('[SendPromotion] Email error:', err)
      const msg = err.response?.data?.error || err.message || 'Failed to send emails'
      setEmailError(msg)
      setEmailResults({ results: { email: [] } })
    }
  }, [promotion.id])

  const handleSend = async () => {
    const doWhatsApp = sendMethod === 'whatsapp' || sendMethod === 'both'
    const doEmail = sendMethod === 'email' || sendMethod === 'both'

    setSending(true)
    setStep('result')

    const tasks = []
    if (doWhatsApp) tasks.push(loadWhatsApp())
    if (doEmail) tasks.push(loadEmail())

    await Promise.allSettled(tasks)
    setSending(false)

    if (onSent) onSent()
  }

  const loading = sending && step === 'result' && (whatsappLinks === null && emailResults === null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-b-[3rem] opacity-10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('promotions.sendPromotion')}</h2>
                <p className="text-xs text-gray-500">{t('promotions.sendPromotionDesc') || 'Notify your customers about this offer'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {step === 'form' ? (
          <>
            {/* Promotion Preview Card */}
            <div className="mx-6 mb-5 flex-shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary-500/10 to-transparent rounded-bl-[3rem]" />
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    promotion.type === 'percentage'
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/20'
                      : 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/20'
                  }`}>
                    {promotion.type === 'percentage'
                      ? <Percent className="w-7 h-7 text-white" />
                      : <DollarSign className="w-7 h-7 text-white" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-xl font-black text-gray-900 dark:text-white tracking-wider">{promotion.code}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {discount} {t('promotions.off')}
                      {promotion.min_order_amount && (
                        <span className="text-gray-400"> · {t('promotions.minOrder')}: {formatCurrency(promotion.min_order_amount)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">{discount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('promotions.off')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="px-6 mb-5 flex-shrink-0">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('promotions.deliveryMethod') || 'Delivery Method'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'email', icon: Mail, label: 'Email', color: 'blue' },
                  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'green' },
                  { key: 'both', icon: Users, label: t('promotions.both') || 'Both', color: 'purple' },
                ].map(({ key, icon: Icon, label, color }) => {
                  const isActive = sendMethod === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSendMethod(key)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                        isActive
                          ? `border-${color}-400 dark:border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20 shadow-lg shadow-${color}-500/10 scale-[1.02]`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {isActive && (
                        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-${color}-500 flex items-center justify-center shadow-md`}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? `bg-${color}-500 text-white shadow-md shadow-${color}-500/30`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-sm font-bold ${isActive ? `text-${color}-600 dark:text-${color}-400` : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
              <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSend} disabled={sending} className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('promotions.sending') || 'Sending...'}</>
                ) : (
                  <><Send className="w-4 h-4" />{t('promotions.sendNow') || 'Send Now'}</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results View */
          <div className="flex flex-col min-h-0 flex-1">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-10 flex-shrink-0">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">{t('promotions.loading') || 'Loading...'}</p>
              </div>
            )}

            {/* WhatsApp Section */}
            {step === 'result' && (sendMethod === 'whatsapp' || sendMethod === 'both') && whatsappLinks !== null && (
              <div className="mx-6 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t('promotions.whatsappLinks') || 'WhatsApp'}
                  </p>
                  {whatsappLinks.length > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-bold">({whatsappLinks.length})</span>
                  )}
                </div>
                {whatsappError ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{whatsappError}</p>
                  </div>
                ) : whatsappLinks.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {t('promotions.noCustomersWithPhone') || 'No customers with phone numbers found.'}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Email Section */}
            {step === 'result' && (sendMethod === 'email' || sendMethod === 'both') && emailResults !== null && (
              <div className="mx-6 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t('promotions.emailResults') || 'Email'}
                  </p>
                  {emailResults?.results?.email?.length > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      ({emailResults.results.email.filter(r => r.success).length} {t('promotions.sent') || 'sent'})
                    </span>
                  )}
                </div>
                {emailError ? (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">{emailError}</p>
                  </div>
                ) : emailResults?.results?.email?.length > 0 ? (
                  <div className="space-y-1.5">
                    {emailResults.results.email.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm ${
                        item.success
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
                      }`}>
                        {item.success
                          ? <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <span className="text-gray-900 dark:text-white truncate flex-1">{item.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {t('promotions.smtpNotConfigured') || 'SMTP is not configured. Emails were not sent.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Links List */}
            {step === 'result' && (sendMethod === 'whatsapp' || sendMethod === 'both') && whatsappLinks && whatsappLinks.length > 0 && (
              <div className="mx-6 flex-1 overflow-y-auto space-y-2 mb-3 min-h-0 max-h-[45vh]">
                {whatsappLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.phone}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {/* Close */}
            <div className="px-6 pb-6 flex-shrink-0">
              <button onClick={onClose} className="w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
