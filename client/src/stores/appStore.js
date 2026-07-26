import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations } from '../lib/translations'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Language
      language: 'en',
      setLanguage: (language) => set({ language }),
      t: (key) => {
        const lang = get().language
        return translations[lang]?.[key] || translations.en[key] || key
      },

      // Store settings
      settings: {
        storeName: 'My Store',
        storeAddress: '',
        storePhone: '',
        taxRate: 14,
        currency: 'EGP',
        currencySymbol: 'ج.م',
        receiptFooter: 'Thank you for your purchase!',
        lowStockThreshold: 10,
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Sidebar state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Toast notifications
      toasts: [],
      addToast: (toast) => {
        const id = Date.now() + Math.random()
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }))
        return id
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      // Helper functions for toasts
      toastSuccess: (message, title) => get().addToast({ type: 'success', message, title }),
      toastError: (message, title) => get().addToast({ type: 'error', message, title }),
      toastWarning: (message, title) => get().addToast({ type: 'warning', message, title }),
      toastInfo: (message, title) => get().addToast({ type: 'info', message, title }),

      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { ...notification, id: Date.now() }]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'app-storage',
    }
  )
)
