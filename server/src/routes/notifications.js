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

// Get store name from settings
async function getStoreName() {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'storeName')
      .single()
    return data?.value || 'المتجر'
  } catch {
    return 'المتجر'
  }
}

// Send promotion notification via email + WhatsApp
router.post('/promotion', [
  body('promotion_id').isNumeric().withMessage('Invalid promotion ID'),
], validate, async (req, res, next) => {
  try {
    const { promotion_id, send_email, send_whatsapp } = req.body

    // Get promotion details
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

    // Send emails
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

    // Send WhatsApp
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

    console.log(`Promotion "${promo.code}": Email ${emailSuccess} sent, WhatsApp ${whatsappSuccess} sent`)

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

    // Send emails
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

    // Send WhatsApp
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
    res.json([])
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
