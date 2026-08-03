import dotenv from 'dotenv'
dotenv.config()
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const password = 'admin123'
const salt = await bcrypt.genSalt(10)
const hash = await bcrypt.hash(password, salt)

console.log('Generated hash:', hash)
console.log('Verify locally:', await bcrypt.compare(password, hash))

const { error: delErr } = await supabase.from('users').delete().eq('username', 'admin')
console.log('Deleted old admin:', delErr ? delErr.message : 'ok')

const { error: insErr } = await supabase.from('users').insert({
  username: 'admin',
  password: hash,
  full_name: 'Admin Manager',
  role: 'MANAGER',
  permissions: JSON.stringify([
    "pos_access","inventory_view","inventory_edit","reports_view",
    "suppliers_view","suppliers_edit","promotions_view","promotions_edit",
    "settings_view","settings_edit","user_manage","customers_view",
    "customers_edit","expenses_view","expenses_edit","refunds_view",
    "refunds_edit","employees_view","employees_edit",
    "accounting_view","accounting_edit","accounting_post"
  ]),
  is_active: true,
  must_change_password: false
})

if (insErr) {
  console.error('Insert error:', insErr.message)
} else {
  console.log('Admin user created successfully!')
}

const { data: user } = await supabase
  .from('users')
  .select('id, username, full_name, role, is_active, password')
  .eq('username', 'admin')
  .single()

if (user) {
  console.log('DB verify:', await bcrypt.compare(password, user.password))
}

process.exit(0)
