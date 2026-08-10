import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      promoId: null,

      addItem: (product, quantity = 1) => {
        const state = get()
        const existingItem = state.items.find(item => item.product.id === product.id)
        const currentQty = existingItem ? existingItem.quantity : 0
        const newQty = currentQty + quantity

        // Stock validation
        if (product.stock_quantity !== undefined && product.stock_quantity !== null) {
          if (product.stock_quantity <= 0 && !existingItem) {
            return false
          }
          if (newQty > product.stock_quantity) {
            return false
          }
        }

        set((state) => {
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
        })
        return true
      },

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.product.id !== productId)
      })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter(item => item.product.id !== productId)
          }))
          return true
        }

        const state = get()
        const item = state.items.find(i => i.product.id === productId)
        if (!item) return false

        // Stock validation
        const stock = item.product.stock_quantity
        if (stock !== undefined && stock !== null && quantity > stock) {
          return false
        }

        set((state) => ({
          items: state.items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        }))
        return true
      },

      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0, promoId: null }),

      applyPromo: (code, discount, id) => set({ promoCode: code, promoDiscount: discount, promoId: id || null }),
      removePromo: () => set({ promoCode: null, promoDiscount: 0, promoId: null }),

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
