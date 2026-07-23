import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { reportsApi } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const { t } = useAppStore()
  const [salesData, setSalesData] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [activeTab, setActiveTab] = useState('sales')

  const dateRanges = [
    { key: 'today', label: t('reports.daily') },
    { key: 'week', label: t('reports.weekly') },
    { key: 'month', label: t('reports.monthly') },
    { key: 'year', label: t('reports.yearly') },
  ]

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salesRes, stockRes] = await Promise.all([
        reportsApi.getSales({ range: dateRange }),
        reportsApi.getStock()
      ])
      setSalesData(salesRes.data)
      setStockData(stockRes.data)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => setDateRange(range.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-white dark:bg-gray-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          {t('reports.sales')}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stock'
              ? 'bg-white dark:bg-gray-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          {t('reports.stock')}
        </button>
      </div>

      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.totalSales')}</p>
                  <p className="text-xl font-bold">{formatCurrency(salesData.totalSales)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.orders')}</p>
                  <p className="text-xl font-bold">{salesData.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.avgOrder')}</p>
                  <p className="text-xl font-bold">{formatCurrency(salesData.avgOrderValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.itemsSold')}</p>
                  <p className="text-xl font-bold">{salesData.itemsSold}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">{t('reports.salesTrend')}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">{t('reports.topSellingProducts')}</h3>
            <div className="space-y-3">
              {salesData.topProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.quantitySold} {t('reports.sold')}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && stockData && (
        <div className="space-y-6">
          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.totalProducts')}</p>
                  <p className="text-xl font-bold">{stockData.totalProducts}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.lowStockItems')}</p>
                  <p className="text-xl font-bold text-amber-600">{stockData.lowStockCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.stockValue')}</p>
                  <p className="text-xl font-bold">{formatCurrency(stockData.totalValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {stockData.lowStockProducts?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                {t('reports.lowStockAlert')}
              </h3>
              <div className="space-y-3">
                {stockData.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('reports.threshold')}: {product.low_stock_threshold}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-amber-600">
                      {product.stock_quantity} {t('reports.left')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock by Category Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">{t('reports.stockByCategory')}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockData.categoryBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
