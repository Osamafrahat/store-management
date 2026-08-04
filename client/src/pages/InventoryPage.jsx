import { useState, useEffect } from 'react'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useUserStore } from '../stores/userStore'
import { productsApi, categoriesApi, suppliersApi } from '../lib/api'
import ProductList from '../components/inventory/ProductList'
import ProductForm from '../components/inventory/ProductForm'
import CategoryManager from '../components/inventory/CategoryManager'
import BarcodePrinter from '../components/BarcodePrinter'
import InventoryPrintSheet from '../components/inventory/InventoryPrintSheet'
import { Plus, Package, Tag, Printer, X } from 'lucide-react'

export default function InventoryPage() {
  const { products, categories, setProducts, setCategories, setLoading, setError } = useProductStore()
  const { t, settings } = useAppStore()
  const { currentUser } = useUserStore()
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [activeTab, setActiveTab] = useState('products')
  const [barcodeProduct, setBarcodeProduct] = useState(null)
  const [showPrintSheet, setShowPrintSheet] = useState(false)
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        suppliersApi.getAll()
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
      setSuppliers(suppliersRes.data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, productData)
      } else {
        await productsApi.create(productData)
      }
      setShowProductForm(false)
      setEditingProduct(null)
      fetchData()
    } catch (err) {
      console.error('Failed to save product:', err)
      alert(t('inventory.failedToSave'))
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm(t('inventory.deleteConfirm'))) return
    try {
      await productsApi.delete(productId)
      fetchData()
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert(t('inventory.failedToDelete'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPrintSheet(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t('inventory.printReport') || 'Print Report'}</span>
          </button>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('inventory.categories')}</span>
          </button>
          <button
            onClick={handleCreateProduct}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('inventory.addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-white dark:bg-gray-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          {t('inventory.products')} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('low-stock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'low-stock'
              ? 'bg-white dark:bg-gray-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('inventory.lowStock')} ({products.filter(p => p.stock_quantity <= p.low_stock_threshold).length})
        </button>
      </div>

      {/* Product List */}
      <ProductList
        products={activeTab === 'low-stock'
          ? products.filter(p => p.stock_quantity <= p.low_stock_threshold)
          : products
        }
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onPrintBarcode={(product) => setBarcodeProduct(product)}
        onRefresh={fetchData}
      />

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onRefresh={fetchData}
        />
      )}

      {/* Barcode Printer Modal */}
      {barcodeProduct && (
        <BarcodePrinter
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {/* Print Inventory Sheet Modal */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 no-print">
              <h2 className="text-xl font-semibold">{t('inventory.inventoryReport') || 'Inventory Report'}</h2>
              <button
                onClick={() => setShowPrintSheet(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <InventoryPrintSheet
                products={products}
                categories={categories}
                settings={settings}
                user={currentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
