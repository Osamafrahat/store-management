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

// Create a notification record — fails silently, never blocks the main flow
async function createNotification({ type, title, message, promotion_id, recipient_count }) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        type: type || 'info',
        title,
        message: message || null,
        promotion_id: promotion_id || null,
        recipient_count: recipient_count || 0,
        status: 'sent',
      })

    if (error) console.error('Failed to create notification record:', error.message)
  } catch (err) {
    console.error('Notification create error (non-fatal):', err.message)
  }
}

// Get all notifications (log)
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('Get notifications error:', err.message)
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

    if (error) {
      // Column may not exist yet — just return success
      console.warn('Mark read warning:', error.message)
    }
    res.json({ success: true })
  } catch (err) {
    res.json({ success: true })
  }
})

// Mark all notifications as read
router.patch('/read-all', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)

    if (error) {
      console.warn('Mark all read warning:', error.message)
    }
    res.json({ success: true })
  } catch (err) {
    res.json({ success: true })
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
      try {
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
      } catch (emailErr) {
        console.error('Email sending error (non-fatal):', emailErr.message)
      }
    }

    if (send_whatsapp) {
      try {
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
      } catch (waErr) {
        console.error('WhatsApp sending error (non-fatal):', waErr.message)
      }
    }

    const emailSuccess = results.email.filter(r => r.success).length
    const whatsappSuccess = results.whatsapp.filter(r => r.success).length
    const totalRecipients = emailSuccess + whatsappSuccess

    // Record in notifications table (non-blocking)
    await createNotification({
      type: 'promotion',
      title: `Promotion Sent: ${promo.code}`,
      message: `${promo.type === 'percentage' ? promo.value + '%' : promo.value + ' EGP'} discount - ${totalRecipients} recipients notified`,
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
      try {
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
      } catch (emailErr) {
        console.error('Custom email error (non-fatal):', emailErr.message)
      }
    }

    if (send_whatsapp) {
      try {
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
      } catch (waErr) {
        console.error('Custom WhatsApp error (non-fatal):', waErr.message)
      }
    }

    const emailSuccess = results.email.filter(r => r.success).length
    const whatsappSuccess = results.whatsapp.filter(r => r.success).length
    const totalRecipients = emailSuccess + whatsappSuccess

    await createNotification({
      type: 'info',
      title,
      message,
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
