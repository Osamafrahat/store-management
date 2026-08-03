import { useState, useEffect } from 'react'
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
  Sparkles,
  User,
} from 'lucide-react'

function generateWhatsAppLink(phone, message) {
  const formattedPhone = phone.replace(/[^0-9]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

export default function SendPromotionModal({ promotion, onClose, onSent }) {
  const { t, toastSuccess, toastError } = useAppStore()
  const [step, setStep] = useState('form')
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [sending, setSending] = useState(false)
  const [whatsappLinks, setWhatsappLinks] = useState([])

  const discount = promotion.type === 'percentage'
    ? `${promotion.value}%`
    : formatCurrency(promotion.value)

  const handleSend = async () => {
    try {
      setSending(true)
      setLoadingCustomers(true)

      const res = await customersApi.getAll()
      const allCustomers = res.data || []
      const withPhone = allCustomers.filter(c => c.phone && c.phone.trim())

      if (withPhone.length === 0) {
        toastError(t('promotions.noCustomersWithPhone') || 'No customers with phone numbers found')
        setSending(false)
        setLoadingCustomers(false)
        return
      }

      const storeName = (() => {
        try {
          const settings = JSON.parse(localStorage.getItem('settings') || '{}')
          return settings.storeName || 'المتجر'
        } catch { return 'المتجر' }
      })()

      const discountText = promotion.type === 'percentage'
        ? `${promotion.value}%`
        : `${promotion.value} ج.م`

      const message = `🎉 *عرض خاص من ${storeName}*\n\n` +
        `خصم *${discountText}*\n\n` +
        `📦 استخدم كود الخصم:\n*${promotion.code}*\n\n` +
        (promotion.min_order_amount ? `📌 الحد الأدنى للطلب: ${promotion.min_order_amount} ج.م\n` : '') +
        `📅 صالح حتى: ${new Date(promotion.end_date).toLocaleDateString('ar-EG')}\n\n` +
        `سارع بالاستفادة! 🛒`

      const links = withPhone.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        link: generateWhatsAppLink(c.phone, message),
      }))

      setWhatsappLinks(links)
      setStep('result')

      notificationsApi.sendPromotion(promotion.id, { send_email: false, send_whatsapp: true })
        .catch(() => {})
    } catch (err) {
      console.error('[SendPromotion] Error:', err)
      toastError(err.response?.data?.error || err.message || 'Failed to load customers')
    } finally {
      setSending(false)
      setLoadingCustomers(false)
    }
  }

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
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
            >
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
                    {promotion.type === 'percentage' ? (
                      <Percent className="w-7 h-7 text-white" />
                    ) : (
                      <DollarSign className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-xl font-black text-gray-900 dark:text-white tracking-wider">
                      {promotion.code}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {discount} {t('promotions.off')}
                      {promotion.min_order_amount && (
                        <span className="text-gray-400"> · {t('promotions.minOrder')}: {formatCurrency(promotion.min_order_amount)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                      {discount}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('promotions.off')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mx-6 mb-5 flex items-start gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30 flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">
                {t('promotions.sendInfo') || 'All active customers with a phone number will be listed below. Click each one to open WhatsApp and send the promotion.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('promotions.loading') || 'Loading customers...'}
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    {t('promotions.showWhatsAppLinks') || 'Show WhatsApp Links'}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Result: Customer List with WhatsApp Buttons */
          <div className="flex flex-col min-h-0 flex-1">
            {/* Summary */}
            <div className="mx-6 mb-4 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-md shadow-green-500/20 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {whatsappLinks.length} {t('promotions.customersReady') || 'customers ready'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {t('promotions.clickToOpenWhatsApp') || 'Click each customer to open WhatsApp and send'}
                </p>
              </div>
            </div>

            {/* Customer List */}
            <div className="mx-6 flex-1 overflow-y-auto space-y-2 mb-4 min-h-0 max-h-[50vh]">
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('promotions.openWhatsApp') || 'Open'}
                    </span>
                    <ExternalLink className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors" />
                  </div>
                </a>
              ))}
            </div>

            {/* Close Button */}
            <div className="px-6 pb-6 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
