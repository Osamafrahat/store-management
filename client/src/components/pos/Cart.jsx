import { useState } from 'react'
import { useCartStore } from '../../stores/cartStore'
import { useAppStore } from '../../stores/appStore'
import { formatCurrency } from '../../lib/utils'
import { Trash2, Plus, Minus, Tag, ShoppingBag, X } from 'lucide-react'

export default function Cart({ onCheckout }) {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getDiscount, getTax, getTotal, promoCode, promoDiscount, applyPromo, removePromo } = useCartStore()
  const { settings, t } = useAppStore()
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState('')

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    try {
      applyPromo(promoInput, 10)
      setPromoError('')
    } catch (err) {
      setPromoError('Invalid promo code')
    }
  }

  const handleRemovePromo = () => {
    removePromo()
    setPromoInput('')
    setPromoError('')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {t('cart.title')}
          </h2>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              {t('cart.remove')}
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <ShoppingBag className="w-12 h-12 mb-3" />
            <p className="font-medium">{t('cart.empty')}</p>
            <p className="text-sm">{t('pos.addToCart')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                {/* Product Image */}
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.product.price)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Item Total & Remove */}
                <div className="text-right flex flex-col justify-between">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo Code */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {promoCode ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">{promoCode} (-{promoDiscount}%)</span>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-green-600 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('cart.promoCode')}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleApplyPromo}
                className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('cart.apply')}
              </button>
            </div>
          )}
          {promoError && (
            <p className="text-sm text-red-500 mt-1">{promoError}</p>
          )}
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('cart.subtotal')}</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          {getDiscount() > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('cart.discount')}</span>
              <span>-{formatCurrency(getDiscount())}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('cart.tax')} ({settings.taxRate}%)</span>
            <span>{formatCurrency(getTax(settings.taxRate))}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>{t('cart.total')}</span>
            <span className="text-primary-600">{formatCurrency(getTotal(settings.taxRate))}</span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      {items.length > 0 && (
        <div className="p-4">
          <button
            onClick={onCheckout}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            {t('cart.checkout')}
          </button>
        </div>
      )}
    </div>
  )
}
