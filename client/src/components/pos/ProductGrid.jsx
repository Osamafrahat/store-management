import { useAppStore } from '../../stores/appStore'
import { formatCurrency } from '../../lib/utils'
import { Package, Plus } from 'lucide-react'

export default function ProductGrid({ products, onAddToCart }) {
  const { t } = useAppStore()

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Package className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">{t('inventory.noProducts')}</p>
        <p className="text-sm">{t('inventory.addFirstProduct')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 hover:shadow-lg transition-all text-left group"
          >
            {/* Product Image */}
            <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 mb-3 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>
              {product.sku && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  SKU: {product.sku}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(product.price)}
                </p>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${product.stock_quantity > 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }
                `}>
                  {product.stock_quantity > 0 ? `${t('inventory.inStock')}: ${product.stock_quantity}` : t('pos.outOfStock')}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-2 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-lg">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">{t('pos.addToCart')}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
