import { Router } from 'express'
import { requireManager } from '../middleware/auth.js'
import supabase from '../db/supabase.js'

const router = Router()

const ALLOWED_SETTINGS = [
  'storeName', 'storeAddress', 'storePhone', 'storeLogo',
  'taxRate', 'currency', 'currencySymbol',
  'receiptFooter', 'lowStockThreshold',
  'loyaltyPointsPerCurrency',
  'eta_client_id', 'eta_client_secret', 'eta_pos_serial',
  'eta_registration_number', 'eta_activity_code',
  'eta_store_governate', 'eta_auto_submit',
]

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')

    if (error) throw error

    const settings = {}
    data.forEach(s => {
      settings[s.key] = s.value
    })

    res.json(settings)
  } catch (err) {
    next(err)
  }
})

router.put('/', requireManager, async (req, res, next) => {
  try {
    const settings = req.body

    const entries = Object.entries(settings).filter(([key]) => 
      ALLOWED_SETTINGS.includes(key)
    )

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' })
    }

    const rows = entries.map(([key, value]) => ({ key, value: String(value) }))

    const { error } = await supabase
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) throw error

    res.json({ message: 'Settings updated successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
