import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore, PERMISSIONS } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { productsApi, ordersApi, reportsApi, suppliersApi, promotionsApi } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import {
  ShoppingCart,
  Package,
  BarChart3,
  Truck,
  Tag,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  ShoppingBag,
  Box,
} from 'lucide-react'

export default function DashboardPage() {
  const { currentUser, hasPermission } = useUserStore()
  const { t, settings } = useAppStore()
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalSuppliers: 0,
    activePromotions: 0,
    recentOrders: [],
    lowStockProducts: [],
    topProducts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const promises = []

      if (hasPermission(PERMISSIONS.REPORTS_VIEW) || hasPermission(PERMISSIONS.POS_ACCESS)) {
        promises.push(
          reportsApi.getSales({ range: 'today' }).catch(() => ({ data: {} })),
          ordersApi.getAll().catch(() => ({ data: [] }))
        )
      }

      if (hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
        promises.push(
          productsApi.getAll().catch(() => ({ data: [] }))
        )
      }

      if (hasPermission(PERMISSIONS.SUPPLIERS_VIEW)) {
        promises.push(
          suppliersApi.getAll().catch(() => ({ data: [] }))
        )
      }

      if (hasPermission(PERMISSIONS.PROMOTIONS_VIEW)) {
        promises.push(
          promotionsApi.getAll().catch(() => ({ data: [] }))
        )
      }

      const results = await Promise.all(promises)
      let resultIndex = 0

      if (hasPermission(PERMISSIONS.REPORTS_VIEW) || hasPermission(PERMISSIONS.POS_ACCESS)) {
        const salesData = results[resultIndex]?.data || {}
        const orders = results[resultIndex + 1]?.data || []
        setStats(prev => ({
          ...prev,
          todaySales: salesData.totalSales || 0,
          todayOrders: salesData.totalOrders || 0,
          recentOrders: orders.slice(0, 5),
        }))
        resultIndex += 2
      }

      if (hasPermission(PERMISSIONS.INVENTORY_VIEW)) {
        const products = results[resultIndex]?.data || []
        const lowStock = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10))
        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          lowStockProducts: lowStock.slice(0, 5),
        }))
        resultIndex += 1
      }

      if (hasPermission(PERMISSIONS.SUPPLIERS_VIEW)) {
        const suppliers = results[resultIndex]?.data || []
        setStats(prev => ({ ...prev, totalSuppliers: suppliers.length }))
        resultIndex += 1
      }

      if (hasPermission(PERMISSIONS.PROMOTIONS_VIEW)) {
        const promos = results[resultIndex]?.data || []
        const active = promos.filter(p => p.is_active && new Date(p.end_date) > new Date())
        setStats(prev => ({ ...prev, activePromotions: active.length }))
        resultIndex += 1
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.goodMorning')
    if (hour < 18) return t('dashboard.goodAfternoon')
    return t('dashboard.goodEvening')
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{getGreeting()}, {currentUser?.fullName}!</h1>
        <p className="text-primary-100 mt-1">
          {settings.storeName || 'Store POS'} — {currentUser?.role?.toLowerCase()} {t('dashboard.dashboard')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* POS Stats */}
        {hasPermission(PERMISSIONS.POS_ACCESS) && (
          <>
            <StatCard
              icon={DollarSign}
              label={t('dashboard.todaysSales')}
              value={formatCurrency(stats.todaySales)}
              color="green"
              href="/reports"
            />
            <StatCard
              icon={ShoppingBag}
              label={t('dashboard.todaysOrders')}
              value={stats.todayOrders}
              color="blue"
              href="/reports"
            />
          </>
        )}

        {/* Inventory Stats */}
        {hasPermission(PERMISSIONS.INVENTORY_VIEW) && (
          <>
            <StatCard
              icon={Package}
              label={t('dashboard.totalProducts')}
              value={stats.totalProducts}
              color="purple"
              href="/inventory"
            />
            <StatCard
              icon={AlertTriangle}
              label={t('dashboard.lowStockItems')}
              value={stats.lowStockCount}
              color={stats.lowStockCount > 0 ? 'red' : 'gray'}
              href="/inventory"
            />
          </>
        )}

        {/* Supplier Stats */}
        {hasPermission(PERMISSIONS.SUPPLIERS_VIEW) && (
          <StatCard
            icon={Truck}
            label={t('dashboard.totalSuppliers')}
            value={stats.totalSuppliers}
            color="amber"
            href="/suppliers"
          />
        )}

        {/* Promotion Stats */}
        {hasPermission(PERMISSIONS.PROMOTIONS_VIEW) && (
          <StatCard
            icon={Tag}
            label={t('dashboard.activePromotions')}
            value={stats.activePromotions}
            color="pink"
            href="/promotions"
          />
        )}

        {/* Manager Stats */}
        {hasPermission(PERMISSIONS.USER_MANAGE) && (
          <StatCard
            icon={Users}
            label={t('dashboard.teamMembers')}
            value={t('dashboard.viewAll')}
            color="indigo"
            href="/users"
          />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {hasPermission(PERMISSIONS.POS_ACCESS) && stats.recentOrders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('dashboard.recentOrders')}</h3>
              <Link to="/reports" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {order.payment_method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {hasPermission(PERMISSIONS.INVENTORY_VIEW) && stats.lowStockProducts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                {t('dashboard.lowStockAlert')}
              </h3>
              <Link to="/inventory" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.threshold')}: {product.low_stock_threshold}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {product.stock_quantity} {t('dashboard.left')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Content Message */}
        {!hasPermission(PERMISSIONS.POS_ACCESS) && !hasPermission(PERMISSIONS.INVENTORY_VIEW) && (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('dashboard.welcomeTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, href }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  }

  return (
    <Link
      to={href}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Link>
  )
}

function QuickActions() {
  const { hasPermission } = useUserStore()
  const { t } = useAppStore()

  const actions = []

  if (hasPermission(PERMISSIONS.POS_ACCESS)) {
    actions.push({
      label: t('dashboard.startSelling'),
      description: t('dashboard.startSellingDesc'),
      icon: ShoppingCart,
      href: '/pos',
      color: 'bg-primary-600 hover:bg-primary-700',
    })
  }

  if (hasPermission(PERMISSIONS.INVENTORY_EDIT)) {
    actions.push({
      label: t('dashboard.manageInventory'),
      description: t('dashboard.manageInventoryDesc'),
      icon: Package,
      href: '/inventory',
      color: 'bg-green-600 hover:bg-green-700',
    })
  }

  if (hasPermission(PERMISSIONS.SUPPLIERS_EDIT)) {
    actions.push({
      label: t('dashboard.addSupplier'),
      description: t('dashboard.addSupplierDesc'),
      icon: Truck,
      href: '/suppliers',
      color: 'bg-amber-600 hover:bg-amber-700',
    })
  }

  if (hasPermission(PERMISSIONS.PROMOTIONS_EDIT)) {
    actions.push({
      label: t('dashboard.createPromotion'),
      description: t('dashboard.createPromotionDesc'),
      icon: Tag,
      href: '/promotions',
      color: 'bg-pink-600 hover:bg-pink-700',
    })
  }

  if (actions.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          to={action.href}
          className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 transition-colors`}
        >
          <action.icon className="w-6 h-6" />
          <div>
            <p className="font-semibold">{action.label}</p>
            <p className="text-sm text-white/80">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
