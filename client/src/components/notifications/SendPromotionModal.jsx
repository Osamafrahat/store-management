import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { notificationsApi } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import {
  X,
  Send,
  Mail,
  MessageCircle,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Percent,
  DollarSign,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

export default function SendPromotionModal({ promotion, onClose, onSent }) {
  const { t, toastSuccess, toastError } = useAppStore()
  const [sendMethod, setSendMethod] = useState('whatsapp')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const handleSend = async () => {
    const send_email = sendMethod === 'email' || sendMethod === 'both'
    const send_whatsapp = sendMethod === 'whatsapp' || sendMethod === 'both'

    try {
      setSending(true)
      const res = await notificationsApi.sendPromotion(promotion.id, { send_email, send_whatsapp })
      setResult(res.data)
      toastSuccess(res.data.message || t('promotions.sent') || 'Notification sent!')
      if (onSent) onSent()
    } catch (err) {
      console.error('[SendPromotion] Full error:', err)
      console.error('[SendPromotion] Response:', err.response?.data)
      const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message || ''
      console.error('[SendPromotion] Server message:', serverMsg)
      toastError(serverMsg ? `${t('promotions.failedToSend') || 'Failed'}: ${serverMsg}` : (t('promotions.failedToSend') || 'Failed to send notification'))
    } finally {
      setSending(false)
    }
  }

  const discount = promotion.type === 'percentage'
    ? `${promotion.value}%`
    : formatCurrency(promotion.value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
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

        {!result ? (
          <>
            {/* Promotion Preview Card */}
            <div className="mx-6 mb-5">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 p-5">
                {/* Decorative corner */}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-xl font-black text-gray-900 dark:text-white tracking-wider">
                        {promotion.code}
                      </h3>
                    </div>
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

            {/* Delivery Method */}
            <div className="px-6 mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('promotions.deliveryMethod') || 'Delivery Method'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'email', icon: Mail, label: 'Email', color: 'blue', desc: t('promotions.emailDesc') || 'Send email to customers' },
                  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'green', desc: t('promotions.whatsappDesc') || 'Send via WhatsApp' },
                  { key: 'both', icon: Users, label: t('promotions.both') || 'Both', color: 'purple', desc: t('promotions.bothDesc') || 'Email + WhatsApp' },
                ].map(({ key, icon: Icon, label, color, desc }) => {
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
                      <div className="text-center">
                        <p className={`text-sm font-bold ${isActive ? `text-${color}-600 dark:text-${color}-400` : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Info Banner */}
            <div className="mx-6 mb-5 flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                {t('promotions.sendInfo') || 'All active customers with contact info will receive this promotion. WhatsApp messages will open individually for you to send.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3">
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
                    {t('promotions.sending') || 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('promotions.sendNow') || 'Send Now'}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Result */
          <div className="px-6 pb-6 space-y-5">
            {/* Success Header */}
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('promotions.sentSuccess') || 'Sent Successfully!'}</h3>
              <p className="text-sm text-gray-500 mt-1">{result.message}</p>
            </div>

            {/* Results Breakdown */}
            <div className="space-y-3">
              {result.results?.email?.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Email</p>
                    <p className="text-xs text-gray-500">
                      {result.results.email.filter(r => r.success).length} {t('promotions.sent') || 'sent'}
                      {result.results.email.filter(r => !r.success).length > 0 && (
                        <span className="text-red-500"> · {result.results.email.filter(r => !r.success).length} failed</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {result.results?.whatsapp?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-md shadow-green-500/20">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</p>
                      <p className="text-xs text-gray-500">
                        {result.results.whatsapp.filter(r => r.success).length} {t('promotions.links') || 'links ready'}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Links */}
                  {result.results.whatsapp.filter(r => r.success && r.link).map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.phone}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => { setResult(null); onClose() }}
              className="w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
