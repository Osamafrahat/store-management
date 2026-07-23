import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://hfnllsnbehuecgznyonq.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_HHBniOsxfuVqqS2PYXkNuA_mM799H6v'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
