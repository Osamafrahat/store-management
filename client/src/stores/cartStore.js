import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,

      addItem: (product, quantity = 1) => set((state) => {
        const existingItem = state.items.find(item => item.product.id === product.id)
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
        }
        return { items: [...state.items, { product, quantity }] }
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.product.id !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(item => item.product.id !== productId)
          : state.items.map(item =>
              item.product.id === productId
                ? { ...item, quantity }
                : item
            )
      })),

      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),

      applyPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
      removePromo: () => set({ promoCode: null, promoDiscount: 0 }),

      getSubtotal: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      },

      getDiscount: () => {
        const { promoDiscount } = get()
        const subtotal = get().getSubtotal()
        return subtotal * (promoDiscount / 100)
      },

      getTax: (taxRate = 14) => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        return (subtotal - discount) * (taxRate / 100)
      },

      getTotal: (taxRate = 14) => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        const tax = get().getTax(taxRate)
        return subtotal - discount + tax
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
