$env:SUPABASE_URL = "https://hfnllsnbehuecgznyonq.supabase.co"
$env:SUPABASE_ANON_KEY = "sb_publishable_HHBniOsxfuVqqS2PYXkNuA_mM799H6v"
$env:JWT_SECRET = "your-super-secret-key-change-this-in-production"
$env:PORT = "3001"
$env:NODE_ENV = "development"
$env:ALLOWED_ORIGINS = "http://localhost:5173"
node server/src/index.js
