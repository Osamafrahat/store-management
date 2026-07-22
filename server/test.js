import { initDatabase, queryAll } from './src/db/connection.js'
import { initializeDatabase } from './src/db/migrations.js'

async function test() {
  console.log('Initializing database...')
  await initDatabase()
  initializeDatabase()

  console.log('Testing database queries...')
  const categories = queryAll('SELECT * FROM categories')
  console.log('Categories:', categories.length)

  const products = queryAll('SELECT * FROM products')
  console.log('Products:', products.length)

  console.log('Database test passed!')
  process.exit(0)
}

test().catch(console.error)
