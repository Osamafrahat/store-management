import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { formatCurrency } from '../../lib/utils'
import { Edit2, Trash2, Search, ChevronDown, Package, AlertTriangle, QrCode, ArrowDown } from 'lucide-react'

export default function ProductList({ products, onEdit, onDelete, onPrintBarcode, onRefresh }) {
  const { t, toastSuccess, toastError } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [receiveStockProduct, setReceiveStockProduct] = useState(null)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveCost, setReceiveCost] = useState('')
  const [receiveLoading, setReceiveLoading] = useState(false)

  const filteredProducts = products
    .filter(p => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.includes(searchQuery) ||
          p.suppliers?.name?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const modifier = sortDirection === 'asc' ? 1 : -1
      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * modifier
      }
      return ((aVal || 0) - (bVal || 0)) * modifier
    })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-30" />
    return (
      <ChevronDown
        className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
      />
    )
  }

  const handleReceiveStock = async () => {
    if (!receiveQty || parseInt(receiveQty) <= 0) return
    setReceiveLoading(true)
    try {
      const body = { product_id: receiveStockProduct.id, quantity: parseInt(receiveQty) }
      if (receiveCost) body.cost_price = parseFloat(receiveCost)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stock/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed')
      toastSuccess(`${t('inventory.received') || 'Received'} ${receiveQty} ${receiveStockProduct.name}`)
      setReceiveStockProduct(null)
      setReceiveQty('')
      setReceiveCost('')
      onRefresh?.()
    } catch (err) {
      toastError(err.message || 'Failed')
    } finally {
      setReceiveLoading(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('inventory.noProducts')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('inventory.addFirstProduct')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1">
                  {t('inventory.name')} <SortIcon field="name" />
                </button>
              </th>
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">
                <button onClick={() => handleSort('sku')} className="flex items-center gap-1">
                  {t('inventory.sku')} <SortIcon field="sku" />
                </button>
              </th>
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">
                <button onClick={() => handleSort('price')} className="flex items-center gap-1">
                  {t('inventory.price')} <SortIcon field="price" />
                </button>
              </th>
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">
                <button onClick={() => handleSort('stock_quantity')} className="flex items-center gap-1">
                  {t('inventory.stock')} <SortIcon field="stock_quantity" />
                </button>
              </th>
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">{t('inventory.status')}</th>
              <th className="text-start p-4 font-medium text-gray-500 dark:text-gray-400">{t('inventory.supplier') || 'Supplier'}</th>
              <th className="text-end p-4 font-medium text-gray-500 dark:text-gray-400">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.barcode && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.barcode}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{product.sku || '-'}</td>
                <td className="p-4 font-medium">{formatCurrency(product.price)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={product.stock_quantity <= product.low_stock_threshold ? 'text-red-600 font-semibold' : ''}>
                      {product.stock_quantity}
                    </span>
                    {product.stock_quantity <= product.low_stock_threshold && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    product.is_active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {product.is_active ? t('inventory.active') : t('inventory.inactive')}
                  </span>
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">
                  {product.suppliers?.name || '-'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onPrintBarcode?.(product)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                      title="Print Barcode"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setReceiveStockProduct(product); setReceiveQty('') }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                      title={t('inventory.receiveStock') || 'Receive Stock'}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        {t('inventory.showing')} {filteredProducts.length} {t('inventory.of')} {products.length} {t('common.products')}
      </div>

      {/* Receive Stock Modal */}
      {receiveStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold">{t('inventory.receiveStock') || 'Receive Stock'}</h3>
            <p className="text-sm text-gray-500">{receiveStockProduct.name}</p>
            <input
              type="number"
              min="1"
              value={receiveQty}
              onChange={e => setReceiveQty(e.target.value)}
              placeholder={t('inventory.quantity') || 'Quantity'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold"
              autoFocus
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={receiveCost}
              onChange={e => setReceiveCost(e.target.value)}
              placeholder={`${t('inventory.costPrice') || 'Cost Price'} (EGP)`}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400">{t('inventory.costPriceHint') || 'Cost price is required for accounting'}</p>
            <div className="flex gap-3">
              <button
                onClick={handleReceiveStock}
                disabled={receiveLoading || !receiveQty || parseInt(receiveQty) <= 0}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-medium"
              >
                {receiveLoading ? '...' : (t('common.save') || 'Save')}
              </button>
              <button
                onClick={() => { setReceiveStockProduct(null); setReceiveQty(''); setReceiveCost('') }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
