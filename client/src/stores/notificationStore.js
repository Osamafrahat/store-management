import { create } from 'zustand'
import { notificationsApi } from '../lib/api'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  filter: 'all', // all, unread, action

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const { data } = await notificationsApi.getAll()
      const notifications = data || []
      const unreadCount = notifications.filter(n => !n.is_read).length
      set({ notifications, unreadCount, loading: false })
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      set({ loading: false })
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markRead(id)
      set((state) => {
        const notifications = state.notifications.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        )
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.is_read).length
        }
      })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllRead()
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsApi.delete(id)
      set((state) => {
        const notifications = state.notifications.filter(n => n.id !== id)
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.is_read).length
        }
      })
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  },

  setFilter: (filter) => set({ filter }),

  getFilteredNotifications: () => {
    const { notifications, filter } = get()
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.is_read)
      case 'action': return notifications.filter(n => n.priority === 'action' || n.type === 'action_required')
      default: return notifications
    }
  },
}))
