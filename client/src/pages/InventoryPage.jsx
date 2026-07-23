import { useState, useEffect } from 'react'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { productsApi, categoriesApi } from '../lib/api'
import ProductList from '../components/inventory/ProductList'
import ProductForm from '../components/inventory/ProductForm'
import CategoryManager from '../components/inventory/CategoryManager'
import { Plus, Package, Tag } from 'lucide-react'

export default function InventoryPage() {
  const { products, categories, setProducts, setCategories, setLoading, setError } = useProductStore()
  const { t } = useAppStore()
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [activeTab, setActiveTab] = useState('products')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll()
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Tag className="w-4 h-4" />
            {t('inventory.categories')}
          </button>
          <button
            onClick={handleCreateProduct}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            {t('inventory.addProduct')}
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
        onRefresh={fetchData}
      />

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
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
    </div>
  )
}
