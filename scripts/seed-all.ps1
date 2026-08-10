$env:SUPABASE_URL = "https://mckouvfqdbnbrxemgeio.supabase.co"
$env:SUPABASE_ANON_KEY = "sb_publishable_7sAS7sEhVO38HPQc-gXTVg_qkXjrVHR"
$env:JWT_SECRET = "test123"
$env:PORT = "3001"
$env:NODE_ENV = "development"
$env:ALLOWED_ORIGINS = "http://localhost:5173"

Set-Location "C:\Users\Mega Store\store-management"
$proc = Start-Process -FilePath "node" -ArgumentList "server/src/index.js" -PassThru -NoNewWindow
Write-Host "Server starting (PID: $($proc.Id))..."

$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -ErrorAction Stop
        Write-Host "Server ready: $($r.status)"
        $ready = $true
        break
    } catch {
        Write-Host "Waiting... ($($i+1)/15)"
    }
}

if (-not $ready) {
    Write-Host "FATAL: Server did not start in time"
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "`nRunning seed script..."
& "C:\Users\Mega Store\store-management\scripts\seed-test-data.ps1"

Write-Host "`nStopping server..."
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Done!"
