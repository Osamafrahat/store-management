import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../stores/notificationStore'
import { useAppStore } from '../stores/appStore'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  ExternalLink,
  Filter,
  Search,
  Inbox,
  Zap,
  RotateCcw,
} from 'lucide-react'

const ICON_MAP = {
  success: { icon: Check, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Success' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Info' },
  action_required: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Action Required' },
  order: { icon: ShoppingCart, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Order' },
  stock: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Stock' },
  payment: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Payment' },
  promotion: { icon: Bell, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', label: 'Promotion' },
}

function timeAgo(dateStr, t) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t('notifications.justNow') || 'Just now'
  if (diffMin < 60) return `${diffMin} ${t('notifications.minutesAgo') || 'min ago'}`
  if (diffHr < 24) return `${diffHr} ${t('notifications.hoursAgo') || 'hours ago'}`
  if (diffDay < 7) return `${diffDay} ${t('notifications.daysAgo') || 'days ago'}`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const { t, toastSuccess, toastError } = useAppStore()
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filter,
    setFilter,
    getFilteredNotifications,
  } = useNotificationStore()

  const [search, setSearch] = useState('')

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const filtered = getFilteredNotifications().filter(n => {
    if (!search) return true
    const q = search.toLowerCase()
    return (n.title?.toLowerCase().includes(q)) || (n.message?.toLowerCase().includes(q))
  })

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    action: notifications.filter(n => (n.priority === 'action' || n.type === 'action_required') && !n.is_read).length,
  }

  const handleClearAll = async () => {
    if (!confirm(t('notifications.clearAllConfirm'))) return
    try {
      for (const n of notifications) {
        await deleteNotification(n.id)
      }
      toastSuccess(t('notifications.allCleared'))
    } catch {
      toastError(t('common.error'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            {t('notifications.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t('notifications.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl font-medium flex items-center gap-2 text-sm transition-all"
            >
              <CheckCheck className="w-4 h-4" /> {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-medium flex items-center gap-2 text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" /> {t('notifications.clearAll')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-gray-500 font-medium">{t('notifications.total')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.unread}</p>
              <p className="text-xs text-gray-500 font-medium">{t('notifications.unread')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.action}</p>
              <p className="text-xs text-gray-500 font-medium">{t('notifications.actionRequired')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {[
            { key: 'all', label: t('notifications.all') || 'All', icon: Bell },
            { key: 'unread', label: t('notifications.unread') || 'Unread', icon: Inbox },
            { key: 'action', label: t('notifications.actionRequired') || 'Action', icon: Zap },
          ].map(({ key, label, icon: FilterIcon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === key
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 opacity-30" />
          </div>
          <p className="font-semibold text-lg">{t('notifications.empty')}</p>
          <p className="text-sm mt-1">{t('notifications.emptyDesc')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
          {filtered.map((n) => {
            const iconConfig = ICON_MAP[n.type] || ICON_MAP.info
            const Icon = iconConfig.icon
            const isAction = n.priority === 'action' || n.type === 'action_required'
            const isUnread = !n.is_read

            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-4 px-6 py-4 transition-all duration-200 group cursor-pointer
                  ${isUnread ? 'bg-primary-50/40 dark:bg-primary-900/5' : ''}
                  ${isAction && isUnread ? 'bg-gradient-to-r from-orange-50/80 to-red-50/30 dark:from-orange-900/10 dark:to-red-900/5 border-l-4 border-l-orange-400' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700/30
                `}
                onClick={() => {
                  if (isUnread) markAsRead(n.id)
                  if (n.action_url) navigate(n.action_url)
                }}
              >
                {/* Unread indicator */}
                {isUnread && (
                  <div className="absolute left-2 top-5 w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/40" />
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconConfig.bg} flex items-center justify-center ${isAction && isUnread ? 'ring-2 ring-orange-300 dark:ring-orange-700 animate-pulse' : ''}`}>
                  <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm leading-tight ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAction && isUnread && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                          <Zap className="w-3 h-3" />
                          {t('notifications.actionRequired')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {timeAgo(n.created_at, t)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${iconConfig.bg} ${iconConfig.color}`}>
                        {iconConfig.label}
                      </span>
                      {n.recipient_count > 0 && (
                        <span className="text-xs text-gray-400">
                          {n.recipient_count} {t('notifications.recipients')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {n.action_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(n.action_url) }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                        >
                          {n.action_label || t('notifications.view')}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {isUnread && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-500 transition-all"
                          title={t('notifications.markRead')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
