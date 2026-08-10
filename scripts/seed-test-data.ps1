$API = "http://localhost:3001/api"
$headers = @{}
$results = @()

function Log($msg) { Write-Host "  OK: $msg" -ForegroundColor Green }
function LogErr($msg) { Write-Host "  FAIL: $msg" -ForegroundColor Red }
function ApiPost($path, $body) {
    $json = $body | ConvertTo-Json -Depth 10
    try {
        $r = Invoke-RestMethod -Uri "$API$path" -Method Post -Body $json -ContentType "application/json" -Headers $headers -TimeoutSec 30
        return $r
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err) { $errObj = $err | ConvertFrom-Json; LogErr "$path - $($errObj.error)" } else { LogErr "$path - $($_.Exception.Message)" }
        return $null
    }
}
function ApiPut($path, $body) {
    $json = $body | ConvertTo-Json -Depth 10
    try {
        $r = Invoke-RestMethod -Uri "$API$path" -Method Put -Body $json -ContentType "application/json" -Headers $headers -TimeoutSec 30
        return $r
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err) { $errObj = $err | ConvertFrom-Json; LogErr "$path - $($errObj.error)" } else { LogErr "$path - $($_.Exception.Message)" }
        return $null
    }
}

# ============================================================
# 1. LOGIN
# ============================================================
Write-Host "`n1. Logging in..." -ForegroundColor Cyan
$auth = ApiPost "/auth/login" @{ username = "admin"; password = "admin123" }
if (-not $auth) { Write-Host "FATAL: Cannot login" -ForegroundColor Red; exit 1 }
$headers["Authorization"] = "Bearer $($auth.token)"
Log "Logged in as $($auth.user.full_name) ($($auth.user.role))"

# ============================================================
# 2. SETTINGS
# ============================================================
Write-Host "`n2. Configuring store settings..." -ForegroundColor Cyan
ApiPut "/settings" @{
    storeName = "My Store POS"
    storeAddress = "123 Main St, Cairo, Egypt"
    storePhone = "+201234567890"
    taxRate = "14"
    currency = "EGP"
    currencySymbol = "ج.م"
    lowStockThreshold = "10"
    loyaltyPointsPerCurrency = "1"
    receiptFooter = "Thank you for shopping at My Store!"
}
Log "Store settings configured"

# ============================================================
# 3. CATEGORIES
# ============================================================
Write-Host "`n3. Creating categories..." -ForegroundColor Cyan
$categories = @()
foreach ($cat in @(
    @{ name = "Electronics"; description = "Electronic devices and accessories" },
    @{ name = "Groceries"; description = "Food and household items" },
    @{ name = "Clothing"; description = "Apparel and accessories" }
)) {
    $c = ApiPost "/categories" $cat
    if ($c) { $categories += $c; Log "Category: $($cat.name) (id: $($c.id))" }
}

# ============================================================
# 4. SUPPLIERS
# ============================================================
Write-Host "`n4. Creating suppliers..." -ForegroundColor Cyan
$suppliers = @()
foreach ($s in @(
    @{ name = "TechSource Corp"; contact_person = "Ahmed Ali"; phone = "+201001001001"; email = "ahmed@techsource.com"; address = "Industrial Area, Cairo" },
    @{ name = "Fresh Foods Ltd"; contact_person = "Sara Mohamed"; phone = "+201002002002"; email = "sara@freshfoods.com"; address = "Giza, Egypt" },
    @{ name = "Fashion Hub"; contact_person = "Omar Hassan"; phone = "+201003003003"; email = "omar@fashionhub.com"; address = "Alexandria, Egypt" }
)) {
    $su = ApiPost "/suppliers" $s
    if ($su) { $suppliers += $su; Log "Supplier: $($s.name) (id: $($su.id), code: $($su.account_code))" }
}

# ============================================================
# 5. PRODUCTS
# ============================================================
Write-Host "`n5. Creating products..." -ForegroundColor Cyan
$products = @()
$pd = @(
    @{ name = "Laptop Dell XPS 15"; sku = "LAP-001"; category_id = $categories[0].id; supplier_id = $suppliers[0].id; price = 25000; cost_price = 18000; unit_of_measure = "quantity" },
    @{ name = "Wireless Mouse"; sku = "MOU-001"; category_id = $categories[0].id; supplier_id = $suppliers[0].id; price = 350; cost_price = 150; unit_of_measure = "quantity" },
    @{ name = "USB-C Hub"; sku = "USB-001"; category_id = $categories[0].id; supplier_id = $suppliers[0].id; price = 800; cost_price = 400; unit_of_measure = "quantity" },
    @{ name = "Rice 1kg"; sku = "GRO-001"; category_id = $categories[1].id; supplier_id = $suppliers[1].id; price = 60; cost_price = 35; unit_of_measure = "kilo" },
    @{ name = "Olive Oil 1L"; sku = "GRO-002"; category_id = $categories[1].id; supplier_id = $suppliers[1].id; price = 250; cost_price = 150; unit_of_measure = "liter" },
    @{ name = "Cotton T-Shirt"; sku = "CLO-001"; category_id = $categories[2].id; supplier_id = $suppliers[2].id; price = 200; cost_price = 80; unit_of_measure = "quantity" },
    @{ name = "Jeans Classic"; sku = "CLO-002"; category_id = $categories[2].id; supplier_id = $suppliers[2].id; price = 500; cost_price = 200; unit_of_measure = "quantity" },
    @{ name = "Notebook A5"; sku = "STA-001"; category_id = $categories[1].id; supplier_id = $suppliers[1].id; price = 25; cost_price = 10; unit_of_measure = "quantity" }
)
foreach ($p in $pd) {
    $pr = ApiPost "/products" $p
    if ($pr) { $products += $pr; Log "Product: $($p.name) (id: $($pr.id), barcode: $($pr.barcode))" }
}

# ============================================================
# 6. CUSTOMERS
# ============================================================
Write-Host "`n6. Creating customers..." -ForegroundColor Cyan
$customers = @()
foreach ($cu in @(
    @{ name = "Khaled Ibrahim"; phone = "01234567890"; email = "khaled@email.com"; address = "Nasr City, Cairo" },
    @{ name = "Mona Youssef"; phone = "01234567891"; email = "mona@email.com"; address = "Heliopolis, Cairo" },
    @{ name = "Hassan Ali"; phone = "01234567892"; address = "6th October City" }
)) {
    $c = ApiPost "/customers" $cu
    if ($c) { $customers += $c; Log "Customer: $($cu.name) (id: $($c.id), code: $($c.account_code))" }
}

# ============================================================
# 7. RECEIVE STOCK
# ============================================================
Write-Host "`n7. Receiving stock from suppliers..." -ForegroundColor Cyan
$stockData = @(
    @{ product_id = $products[0].id; quantity = 20; cost_price = 18000; supplier_id = $suppliers[0].id; notes = "Initial stock - Laptops" },
    @{ product_id = $products[1].id; quantity = 100; cost_price = 150; supplier_id = $suppliers[0].id; notes = "Initial stock - Mice" },
    @{ product_id = $products[2].id; quantity = 50; cost_price = 400; supplier_id = $suppliers[0].id; notes = "Initial stock - USB Hubs" },
    @{ product_id = $products[3].id; quantity = 200; cost_price = 35; supplier_id = $suppliers[1].id; notes = "Initial stock - Rice" },
    @{ product_id = $products[4].id; quantity = 80; cost_price = 150; supplier_id = $suppliers[1].id; notes = "Initial stock - Olive Oil" },
    @{ product_id = $products[5].id; quantity = 150; cost_price = 80; supplier_id = $suppliers[2].id; notes = "Initial stock - T-Shirts" },
    @{ product_id = $products[6].id; quantity = 60; cost_price = 200; supplier_id = $suppliers[2].id; notes = "Initial stock - Jeans" },
    @{ product_id = $products[7].id; quantity = 300; cost_price = 10; supplier_id = $suppliers[1].id; notes = "Initial stock - Notebooks" }
)
foreach ($s in $stockData) {
    $r = ApiPost "/stock/receive" $s
    if ($r) {
        $pname = ($products | Where-Object { $_.id -eq $s.product_id }).name
        $sname = ($suppliers | Where-Object { $_.id -eq $s.supplier_id }).name
        Log "Received: $($s.quantity)x $pname -> $sname"
    }
}

# ============================================================
# 8. CREATE ORDERS (POS Sales)
# ============================================================
Write-Host "`n8. Creating POS orders..." -ForegroundColor Cyan
$today = Get-Date -Format "yyyyMMdd"

# Order 1: Khaled buys laptop + 2 mice (cash)
$o1sub = 25000 + (350 * 2)
$o1tax = [math]::Round($o1sub * 0.14, 2)
$o1total = $o1sub + $o1tax
$o1rand = Get-Random -Minimum 1000 -Maximum 9999
$o1num = "ORD-$today-$o1rand"
$order1 = ApiPost "/orders" @{
    order_number = $o1num
    subtotal = $o1sub
    tax_amount = $o1tax
    total = $o1total
    payment_method = "cash"
    payment_status = "paid"
    customer_id = $customers[0].id
    items = @(
        @{ product_id = $products[0].id; quantity = 1; unit_price = 25000; total = 25000 },
        @{ product_id = $products[1].id; quantity = 2; unit_price = 350; total = 700 }
    )
    payments = @(@{ method = "cash"; amount = $o1total })
}
if ($order1) { Log "Order $o1num : Laptop x1 + Mouse x2 = $o1total EGP (Khaled, Cash)" }

# Order 2: Mona buys jeans + olive oil (card)
$o2sub = 500 + 250
$o2tax = [math]::Round($o2sub * 0.14, 2)
$o2total = $o2sub + $o2tax
$o2rand = Get-Random -Minimum 1000 -Maximum 9999
$o2num = "ORD-$today-$o2rand"
$order2 = ApiPost "/orders" @{
    order_number = $o2num
    subtotal = $o2sub
    tax_amount = $o2tax
    total = $o2total
    payment_method = "card"
    payment_status = "paid"
    customer_id = $customers[1].id
    items = @(
        @{ product_id = $products[6].id; quantity = 1; unit_price = 500; total = 500 },
        @{ product_id = $products[4].id; quantity = 1; unit_price = 250; total = 250 }
    )
    payments = @(@{ method = "card"; amount = $o2total })
}
if ($order2) { Log "Order $o2num : Jeans x1 + Olive Oil x1 = $o2total EGP (Mona, Card)" }

# Order 3: Hassan buys 10 notebooks + 3 t-shirts (bank transfer)
$o3sub = (25 * 10) + (200 * 3)
$o3tax = [math]::Round($o3sub * 0.14, 2)
$o3total = $o3sub + $o3tax
$o3rand = Get-Random -Minimum 1000 -Maximum 9999
$o3num = "ORD-$today-$o3rand"
$order3 = ApiPost "/orders" @{
    order_number = $o3num
    subtotal = $o3sub
    tax_amount = $o3tax
    total = $o3total
    payment_method = "bank_transfer"
    payment_status = "paid"
    customer_id = $customers[2].id
    items = @(
        @{ product_id = $products[7].id; quantity = 10; unit_price = 25; total = 250 },
        @{ product_id = $products[5].id; quantity = 3; unit_price = 200; total = 600 }
    )
    payments = @(@{ method = "bank_transfer"; amount = $o3total })
}
if ($order3) { Log "Order $o3num : Notebooks x10 + T-Shirts x3 = $o3total EGP (Hassan, Bank Transfer)" }

Write-Host "  Waiting for background order processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# ============================================================
# 9. STANDALONE PAYMENTS
# ============================================================
Write-Host "`n9. Creating standalone payments..." -ForegroundColor Cyan
$todayDate = Get-Date -Format "yyyy-MM-dd"

# Inbound: Khaled pays extra 5000 on account
$p1 = ApiPost "/accounting/payments" @{
    payment_type = "inbound"
    method = "cash"
    amount = 5000
    partner_type = "customer"
    partner_id = $customers[0].id
    reference = "ON-ACCT-001"
    notes = "Khaled on-account payment"
    payment_date = $todayDate
}
if ($p1) { Log "Inbound: Khaled pays 5,000 EGP (Cash)" }

# Outbound: Pay TechSource 100,000
$p2 = ApiPost "/accounting/payments" @{
    payment_type = "outbound"
    method = "bank_transfer"
    amount = 100000
    partner_type = "supplier"
    partner_id = $suppliers[0].id
    reference = "INV-2026-001"
    notes = "Payment to TechSource for Laptops + Mice + USB Hubs"
    payment_date = $todayDate
}
if ($p2) { Log "Outbound: Pay TechSource 100,000 EGP (Bank Transfer)" }

# Outbound: Pay Fresh Foods 30,000
$p3 = ApiPost "/accounting/payments" @{
    payment_type = "outbound"
    method = "cash"
    amount = 30000
    partner_type = "supplier"
    partner_id = $suppliers[1].id
    reference = "INV-2026-002"
    notes = "Payment to Fresh Foods for Rice + Olive Oil + Notebooks"
    payment_date = $todayDate
}
if ($p3) { Log "Outbound: Pay Fresh Foods 30,000 EGP (Cash)" }

# Outbound: Pay Fashion Hub 20,000
$p4 = ApiPost "/accounting/payments" @{
    payment_type = "outbound"
    method = "card"
    amount = 20000
    partner_type = "supplier"
    partner_id = $suppliers[2].id
    reference = "INV-2026-003"
    notes = "Payment to Fashion Hub for T-Shirts + Jeans"
    payment_date = $todayDate
}
if ($p4) { Log "Outbound: Pay Fashion Hub 20,000 EGP (Card)" }

# ============================================================
# 10. EXPENSES
# ============================================================
Write-Host "`n10. Creating expenses..." -ForegroundColor Cyan

$exp1 = ApiPost "/expenses" @{
    category = "Rent"
    amount = 15000
    description = "Monthly office rent - August 2026"
    method = "bank_transfer"
    expense_date = $todayDate
}
if ($exp1) { Log "Expense: Rent 15,000 EGP (Bank Transfer)" }

$exp2 = ApiPost "/expenses" @{
    category = "Utilities"
    amount = 2500
    description = "Electricity + Water + Internet"
    method = "cash"
    expense_date = $todayDate
}
if ($exp2) { Log "Expense: Utilities 2,500 EGP (Cash)" }

$exp3 = ApiPost "/expenses" @{
    category = "Salaries"
    amount = 45000
    description = "Staff salaries - August 2026"
    method = "bank_transfer"
    expense_date = $todayDate
}
if ($exp3) { Log "Expense: Salaries 45,000 EGP (Bank Transfer)" }

$exp4 = ApiPost "/expenses" @{
    category = "Transport"
    amount = 1200
    description = "Delivery truck fuel"
    method = "cash"
    expense_date = $todayDate
}
if ($exp4) { Log "Expense: Transport 1,200 EGP (Cash)" }

$exp5 = ApiPost "/expenses" @{
    category = "Marketing"
    amount = 5000
    description = "Social media ads - August"
    method = "card"
    expense_date = $todayDate
}
if ($exp5) { Log "Expense: Marketing 5,000 EGP (Card)" }

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SEED COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created:" -ForegroundColor Yellow
Write-Host "  - 3 Categories (Electronics, Groceries, Clothing)"
Write-Host "  - 3 Suppliers (TechSource, Fresh Foods, Fashion Hub)"
Write-Host "  - 8 Products (Laptop, Mouse, USB Hub, Rice, Oil, T-Shirt, Jeans, Notebook)"
Write-Host "  - 3 Customers (Khaled, Mona, Hassan)"
Write-Host "  - 8 Stock receives (930 units total)"
Write-Host "  - 3 POS orders with payments"
Write-Host "  - 4 standalone payments (1 inbound, 3 outbound)"
Write-Host "  - 5 expenses (Rent, Utilities, Salaries, Transport, Marketing)"
Write-Host ""
Write-Host "Suppliers should show balances on the Suppliers page." -ForegroundColor Yellow
Write-Host "All journal entries should be visible in Accounting Reports." -ForegroundColor Yellow
