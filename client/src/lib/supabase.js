import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://onjyobpimcvqwncmvdwi.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_M9lqWHx3In7RU6ZmOvgKbA_tQzHJ5lq'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
