import { Router } from 'express'
import supabase from '../db/supabase.js'

const router = Router()

// Get all settings
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')

    if (error) throw error

    // Convert array to object
    const settings = {}
    data.forEach(s => {
      settings[s.key] = s.value
    })

    res.json(settings)
  } catch (err) {
    next(err)
  }
})

// Update settings
router.put('/', async (req, res, next) => {
  try {
    const settings = req.body

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from('store_settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' })
    }

    res.json({ message: 'Settings updated successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
