import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import supabase from '../db/supabase.js'
import { sendPromotionEmail, sendCustomEmail } from '../services/emailService.js'
import { sendPromotionWhatsApp, sendCustomWhatsApp } from '../services/whatsappService.js'

const router = Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

async function getStoreName() {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'storeName')
      .single()
    return data?.value || 'Store'
  } catch {
    return 'Store'
  }
}

// Create a notification record
export async function createNotification({ type, title, message, priority, action_url, action_label, promotion_id, recipient_count }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: type || 'info',
        title,
        message: message || null,
        priority: priority || 'normal',
        action_url: action_url || null,
        action_label: action_label || null,
        promotion_id: promotion_id || null,
        recipient_count: recipient_count || 0,
        status: 'sent',
      })
      .select()
      .single()

    if (error) console.error('Failed to create notification:', error)
    return data
  } catch (err) {
    console.error('Notification create error:', err)
    return null
  }
}

// Generate system notifications (low stock, etc.)
export async function generateSystemNotifications() {
  const notifications = []

  // Low stock alerts
  try {
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, name, stock_quantity, sku')
      .lte('stock_quantity', 10)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(5)

    if (lowStockProducts && lowStockProducts.length > 0) {
      for (const product of lowStockProducts) {
        const existing = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'stock')
          .eq('title', `Low Stock: ${product.name}`)
          .gte('created_at', new Date(Date.now() - 86400000).toISOString())
          .maybeSingle()

        if (!existing.data) {
          notifications.push(
            await createNotification({
              type: 'stock',
              title: `Low Stock: ${product.name}`,
              message: product.stock_quantity === 0
                ? `Out of stock! SKU: ${product.sku || 'N/A'}`
                : `Only ${product.stock_quantity} units remaining. SKU: ${product.sku || 'N/A'}`,
              priority: product.stock_quantity === 0 ? 'action' : 'normal',
              action_url: '/inventory',
              action_label: 'View Inventory',
            })
          )
        }
      }
    }
  } catch (err) {
    console.error('Low stock notification error:', err)
  }

  return notifications.filter(Boolean)
}

// Get all notifications (log)
router.get('/', async (req, res, next) => {
  try {
    // Auto-generate system notifications on fetch
    await generateSystemNotifications()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.json([])
  }
})

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Mark all notifications as read
router.patch('/read-all', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// Send promotion notification via email + WhatsApp
router.post('/promotion', [
  body('promotion_id').isNumeric().withMessage('Invalid promotion ID'),
], validate, async (req, res, next) => {
  try {
    const { promotion_id, send_email, send_whatsapp } = req.body

    const { data: promo, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotion_id)
      .single()

    if (promoError || !promo) {
      return res.status(404).json({ error: 'Promotion not found' })
    }

    const storeName = await getStoreName()
    const results = { email: [], whatsapp: [] }

    if (send_email !== false) {
      const { data: emailCustomers } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('is_active', true)
        .not('email', 'is', null)

      if (emailCustomers && emailCustomers.length > 0) {
        results.email = await sendPromotionEmail({
          recipients: emailCustomers,
          promotion: promo,
          storeName
        })
      }
    }

    if (send_whatsapp) {
      const { data: whatsappCustomers } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('is_active', true)
        .not('phone', 'is', null)

      if (whatsappCustomers && whatsappCustomers.length > 0) {
        results.whatsapp = await sendPromotionWhatsApp({
          recipients: whatsappCustomers,
          promotion: promo,
          storeName
        })
      }
    }

    const emailSuccess = results.email.filter(r => r.success).length
    const whatsappSuccess = results.whatsapp.filter(r => r.success).length
    const totalRecipients = emailSuccess + whatsappSuccess

    // Create notification record
    await createNotification({
      type: 'promotion',
      title: `Promotion Sent: ${promo.code}`,
      message: `${promo.type === 'percentage' ? promo.value + '%' : promo.value + ' EGP'} discount - ${totalRecipients} recipients notified`,
      priority: 'normal',
      action_url: '/promotions',
      action_label: 'View Promotion',
      promotion_id: promo.id,
      recipient_count: totalRecipients,
    })

    res.json({
      success: true,
      message: `Email: ${emailSuccess} sent, WhatsApp: ${whatsappSuccess} sent`,
      results
    })
  } catch (err) {
    console.error('Failed to send promotion:', err)
    next(err)
  }
})

// Send custom notification via email + WhatsApp
router.post('/custom', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
], validate, async (req, res, next) => {
  try {
    const { title, message, target, send_email, send_whatsapp } = req.body

    const storeName = await getStoreName()
    const results = { email: [], whatsapp: [] }

    if (send_email !== false) {
      let query = supabase.from('customers').select('id, name, email, phone').eq('is_active', true)
      if (target === 'with_email') query = query.not('email', 'is', null)

      const { data: customers } = await query
      if (customers && customers.length > 0) {
        results.email = await sendCustomEmail({
          recipients: customers,
          subject: title,
          message,
          storeName
        })
      }
    }

    if (send_whatsapp) {
      let query = supabase.from('customers').select('id, name, email, phone').eq('is_active', true)
      if (target === 'with_phone') query = query.not('phone', 'is', null)

      const { data: customers } = await query
      if (customers && customers.length > 0) {
        results.whatsapp = await sendCustomWhatsApp({
          recipients: customers,
          title,
          message,
          storeName
        })
      }
    }

    const emailSuccess = results.email.filter(r => r.success).length
    const whatsappSuccess = results.whatsapp.filter(r => r.success).length
    const totalRecipients = emailSuccess + whatsappSuccess

    // Create notification record
    await createNotification({
      type: 'info',
      title,
      message,
      priority: 'normal',
      recipient_count: totalRecipients,
    })

    res.json({
      success: true,
      message: `Email: ${emailSuccess} sent, WhatsApp: ${whatsappSuccess} sent`,
      results
    })
  } catch (err) {
    console.error('Failed to send custom notification:', err)
    next(err)
  }
})

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    res.json({ message: 'Notification deleted' })
  }
})

export default router
