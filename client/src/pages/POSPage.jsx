import { useState, useEffect, useRef } from 'react'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useAppStore } from '../stores/appStore'
import { useUserStore } from '../stores/userStore'
import { productsApi, categoriesApi, promotionsApi, ordersApi, customersApi } from '../lib/api'
import { formatCurrency, generateOrderNumber } from '../lib/utils'
import ProductGrid from '../components/pos/ProductGrid'
import Cart from '../components/pos/Cart'
import PaymentModal from '../components/pos/PaymentModal'
import BarcodeScanner from '../components/pos/BarcodeScanner'
import ReceiptModal from '../components/pos/ReceiptModal'
import { Search, ShoppingCart, Zap, User } from 'lucide-react'

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const searchInputRef = useRef(null)

  const { products, categories, setProducts, setCategories, setLoading, setError } = useProductStore()
  const { addItem, items, getTotal } = useCartStore()
  const { settings, t } = useAppStore()
  const { currentUser } = useUserStore()

  // Fetch products, categories, and customers on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        customersApi.getAll()
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
      setCustomers(customersRes.data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleBarcodeScan = async (barcode) => {
    try {
      const response = await productsApi.getByBarcode(barcode)
      if (response.data) {
        addItem(response.data)
        setShowScanner(false)
      }
    } catch (err) {
      console.error('Product not found:', err)
      alert(t('pos.outOfStock'))
    }
  }

  const handleQuickSale = async (product) => {
    addItem(product)
  }

  const filteredProducts = products.filter(p => {
    if (!p.is_active) return false
    if (selectedCategory && p.category_id !== selectedCategory) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.includes(searchQuery)
      )
    }
    return true
  })

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true
    const query = customerSearch.toLowerCase()
    return c.name?.toLowerCase().includes(query) || c.phone?.includes(query)
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Left side - Products */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('pos.search')}
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span className="hidden sm:inline">{t('pos.scan')}</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('pos.allProducts')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          onAddToCart={handleQuickSale}
        />
      </div>

      {/* Right side - Cart */}
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3 min-w-0 overflow-hidden">
        {/* Customer Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pos.selectCustomer')}</span>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2">
              <div>
                <p className="font-medium text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">{selectedCustomer.phone || ''} | {selectedCustomer.loyalty_points || 0} pts</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                {t('pos.remove')}
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder={t('pos.searchCustomer')}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              {customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-auto">
                  {filteredCustomers.slice(0, 5).map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setCustomerSearch('')
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone || ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <Cart onCheckout={() => setShowPayment(true)} />
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={async (paymentData) => {
            try {
              const orderData = {
                order_number: generateOrderNumber(),
                items: items.map(item => ({
                  product_id: item.product.id,
                  product_name: item.product.name,
                  quantity: item.quantity,
                  unit_price: item.product.price,
                })),
                subtotal: useCartStore.getState().getSubtotal(),
                discount_amount: useCartStore.getState().getDiscount(),
                tax_amount: useCartStore.getState().getTax(settings.taxRate),
                total: getTotal(settings.taxRate),
                payment_method: paymentData.method,
                payment_status: 'paid',
                payments: paymentData.payments,
                user_id: currentUser?.id,
                customer_id: selectedCustomer?.id || null,
                created_at: new Date().toISOString(),
              }
              const response = await ordersApi.create(orderData)
              // Fetch the full order with user data for receipt
              let completedOrder
              if (response.data?.id) {
                const fullOrderRes = await ordersApi.getById(response.data.id)
                completedOrder = {
                  ...fullOrderRes.data,
                  items: items.map(item => ({
                    product_name: item.product.name,
                    quantity: item.quantity,
                    unit_price: item.product.price,
                  })),
                }
              } else {
                completedOrder = {
                  ...orderData,
                  users: currentUser ? { full_name: currentUser.fullName } : null,
                  customers: selectedCustomer ? { name: selectedCustomer.name } : null,
                }
              }
              setLastOrder(completedOrder)
              setSelectedCustomer(null)
              useCartStore.getState().clearCart()
              setShowPayment(false)
              setShowReceipt(true)
              fetchData()
            } catch (err) {
              console.error('Failed to create order:', err)
              alert(t('common.error'))
            }
          }}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <ReceiptModal
          order={lastOrder}
          onClose={() => {
            setShowReceipt(false)
            setLastOrder(null)
          }}
        />
      )}
    </div>
  )
}
