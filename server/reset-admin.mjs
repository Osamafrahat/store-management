import dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const salt = await bcrypt.genSalt(10)
const hash = await bcrypt.hash('admin123', salt)

const { error } = await supabase
  .from('users')
  .update({ password: hash, must_change_password: true })
  .eq('username', 'admin')

if (error) console.log('Error:', error.message)
else console.log('Admin reset: password=admin123, must_change_password=true')
