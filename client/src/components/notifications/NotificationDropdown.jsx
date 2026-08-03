import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAppStore } from '../../stores/appStore'
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
  X,
} from 'lucide-react'

const ICON_MAP = {
  success: { icon: Check, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  action_required: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  order: { icon: ShoppingCart, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  stock: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  payment: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
}

function timeAgo(dateStr, t) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t('notifications.justNow') || 'Just now'
  if (diffMin < 60) return `${diffMin}${t('notifications.minAgo') || 'm'}`
  if (diffHr < 24) return `${diffHr}${t('notifications.hrAgo') || 'h'}`
  if (diffDay < 7) return `${diffDay}${t('notifications.dayAgo') || 'd'}`
  return date.toLocaleDateString()
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore()
  const { t } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const recent = notifications.slice(0, 15)
  const hasActionItems = notifications.some(n => (n.priority === 'action' || n.type === 'action_required') && !n.is_read)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
      >
        <Bell className={`w-5 h-5 transition-colors ${open ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500'} ${hasActionItems ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30 px-1 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-[420px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-primary-500 font-medium">{unreadCount} {t('notifications.unread')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium">{t('notifications.empty')}</p>
                <p className="text-sm">{t('notifications.emptyDesc')}</p>
              </div>
            ) : (
              recent.map((n) => {
                const iconConfig = ICON_MAP[n.type] || ICON_MAP.info
                const Icon = iconConfig.icon
                const isAction = n.priority === 'action' || n.type === 'action_required'
                const isUnread = !n.is_read

                return (
                  <div
                    key={n.id}
                    className={`relative flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-700/50 transition-all duration-200 cursor-pointer group
                      ${isUnread ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                      ${isAction && isUnread ? 'bg-orange-50/80 dark:bg-orange-900/10 border-l-3 border-l-orange-400' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-700/30
                    `}
                    onClick={() => {
                      if (isUnread) markAsRead(n.id)
                      if (n.action_url) {
                        setOpen(false)
                        window.location.href = n.action_url
                      }
                    }}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/30" />
                    )}

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center ${isAction && isUnread ? 'ring-2 ring-orange-300 dark:ring-orange-700 animate-pulse' : ''}`}>
                      <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {n.title}
                          {isAction && isUnread && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                              {t('notifications.actionRequired')}
                            </span>
                          )}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                          className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {n.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {timeAgo(n.created_at, t)}
                        </span>
                        {n.action_url && (
                          <span className="flex items-center gap-1 text-[11px] text-primary-500 font-medium">
                            {n.action_label || t('notifications.view')}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
              >
                {t('notifications.viewAll')}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
