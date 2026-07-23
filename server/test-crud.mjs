import http from 'http'

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data)

    const req = http.request(opts, (res) => {
      let b = ''
      res.on('data', c => b += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }) }
        catch { resolve({ status: res.statusCode, body: b }) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// First get a token
const login = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' })
const token = login.body?.token
console.log('Login:', login.status, token ? 'OK' : 'FAILED')

if (!token) process.exit(1)

const authHeaders = { 'Authorization': `Bearer ${token}` }

function authRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders }
    }
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data)

    const req = http.request(opts, (res) => {
      let b = ''
      res.on('data', c => b += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }) }
        catch { resolve({ status: res.statusCode, body: b }) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// Test categories CRUD
console.log('\n--- Categories ---')
const cats = await authRequest('GET', '/api/categories')
console.log('GET:', cats.status, Array.isArray(cats.body) ? cats.body.length + ' items' : cats.body)

const newCat = await authRequest('POST', '/api/categories', { name: 'Test Category', description: 'Test' })
console.log('POST:', newCat.status, newCat.body?.name || newCat.body?.error)

if (newCat.body?.id) {
  const del = await authRequest('DELETE', `/api/categories/${newCat.body.id}`)
  console.log('DELETE:', del.status, del.body?.message || del.body?.error)
}

// Test suppliers CRUD
console.log('\n--- Suppliers ---')
const sups = await authRequest('GET', '/api/suppliers')
console.log('GET:', sups.status, Array.isArray(sups.body) ? sups.body.length + ' items' : sups.body)

const newSup = await authRequest('POST', '/api/suppliers', { name: 'Test Supplier' })
console.log('POST:', newSup.status, newSup.body?.name || newSup.body?.error)

if (newSup.body?.id) {
  const del = await authRequest('DELETE', `/api/suppliers/${newSup.body.id}`)
  console.log('DELETE:', del.status, del.body?.message || del.body?.error)
}

// Test products CRUD
console.log('\n--- Products ---')
const prods = await authRequest('GET', '/api/products')
console.log('GET:', prods.status, Array.isArray(prods.body) ? prods.body.length + ' items' : prods.body)

const newProd = await authRequest('POST', '/api/products', { name: 'Test Product', price: 99.99, stock_quantity: 10 })
console.log('POST:', newProd.status, newProd.body?.name || newProd.body?.error)

if (newProd.body?.id) {
  const del = await authRequest('DELETE', `/api/products/${newProd.body.id}`)
  console.log('DELETE:', del.status, del.body?.message || del.body?.error)
}

// Test promotions CRUD
console.log('\n--- Promotions ---')
const promos = await authRequest('GET', '/api/promotions')
console.log('GET:', promos.status, Array.isArray(promos.body) ? promos.body.length + ' items' : promos.body)

const newPromo = await authRequest('POST', '/api/promotions', { code: 'TEST10', type: 'percentage', value: 10 })
console.log('POST:', newPromo.status, newPromo.body?.code || newPromo.body?.error)

if (newPromo.body?.id) {
  const del = await authRequest('DELETE', `/api/promotions/${newPromo.body.id}`)
  console.log('DELETE:', del.status, del.body?.message || del.body?.error)
}

// Test users CRUD
console.log('\n--- Users ---')
const users = await authRequest('GET', '/api/users')
console.log('GET:', users.status, Array.isArray(users.body) ? users.body.length + ' items' : users.body)

const newUser = await authRequest('POST', '/api/users', { username: 'testuser', password: 'test123456', fullName: 'Test User', role: 'VIEWER' })
console.log('POST:', newUser.status, newUser.body?.username || newUser.body?.error)

if (newUser.body?.id) {
  const del = await authRequest('DELETE', `/api/users/${newUser.body.id}`)
  console.log('DELETE:', del.status, del.body?.message || del.body?.error)
}
