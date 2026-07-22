import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

// Get sales report
router.get('/sales', (req, res, next) => {
  try {
    const { range = 'week' } = req.query

    let startDate = new Date()
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Total sales
    const orders = db.prepare(`
      SELECT total FROM orders
      WHERE created_at >= ? AND payment_status = 'paid'
    `).all(startDateStr)

    const totalSales = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Items sold
    const orderItems = db.prepare(`
      SELECT oi.quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ? AND o.payment_status = 'paid'
    `).all(startDateStr)

    const itemsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0)

    // Daily sales
    const dailyOrders = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total) as sales, COUNT(*) as orders
      FROM orders
      WHERE created_at >= ? AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(startDateStr)

    // Top products
    const topProducts = db.prepare(`
      SELECT p.id, p.name, SUM(oi.quantity) as quantitySold, SUM(oi.total) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= ? AND o.payment_status = 'paid'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all(startDateStr)

    res.json({
      totalSales,
      totalOrders,
      avgOrderValue,
      itemsSold,
      dailySales: dailyOrders,
      topProducts
    })
  } catch (err) {
    next(err)
  }
})

// Get stock report
router.get('/stock', (req, res, next) => {
  try {
    // Total products
    const { totalProducts } = db.prepare(
      'SELECT COUNT(*) as totalProducts FROM products WHERE is_active = 1'
    ).get()

    // All active products
    const allProducts = db.prepare(
      'SELECT * FROM products WHERE is_active = 1'
    ).all()

    // Low stock products
    const lowStockProducts = allProducts.filter(
      p => p.stock_quantity <= (p.low_stock_threshold || 10)
    )

    // Total stock value
    const totalValue = allProducts.reduce((sum, p) => {
      return sum + (p.stock_quantity * (parseFloat(p.cost_price) || 0))
    }, 0)

    // Stock by category
    const categoryBreakdown = db.prepare(`
      SELECT COALESCE(c.name, 'Uncategorized') as name, COUNT(*) as value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      GROUP BY c.name
    `).all()

    res.json({
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalValue,
      categoryBreakdown
    })
  } catch (err) {
    next(err)
  }
})

// Get dashboard data
router.get('/dashboard', (req, res, next) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString()

    // Today's sales
    const todayOrders = db.prepare(`
      SELECT total FROM orders
      WHERE created_at >= ? AND payment_status = 'paid'
    `).all(todayStr)

    const todaySales = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    const todayOrdersCount = todayOrders.length

    // Low stock count
    const allProducts = db.prepare(
      'SELECT stock_quantity, low_stock_threshold FROM products WHERE is_active = 1'
    ).all()

    const lowStockCount = allProducts.filter(
      p => p.stock_quantity <= (p.low_stock_threshold || 10)
    ).length

    // Recent orders
    const recentOrders = db.prepare(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'
    ).all()

    // Top products today
    const topProductsToday = db.prepare(`
      SELECT p.name, SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= ? AND o.payment_status = 'paid'
      GROUP BY p.id
      ORDER BY quantity DESC
      LIMIT 5
    `).all(todayStr)

    res.json({
      todaySales,
      todayOrders: todayOrdersCount,
      lowStockCount,
      recentOrders,
      topProductsToday
    })
  } catch (err) {
    next(err)
  }
})

export default router
