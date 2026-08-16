import dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const { data: acc } = await s.from('accounts').select('*').eq('code', '4020').single()
const { data: bal } = await s.from('account_balances').select('*').eq('account_id', acc.id).single()
const { data: lines } = await s.from('journal_entry_lines').select('*').eq('account_id', acc.id)

console.log('4020 Status:')
console.log('Balance:', bal?.closing_balance || 0)
console.log('Journal lines:', lines?.length || 0)
lines?.forEach(l => console.log(`  Entry ${l.entry_id}: debit ${l.debit} credit ${l.credit} - ${l.description}`))
