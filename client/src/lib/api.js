import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const sessionExpired = error.response?.data?.sessionExpired
    const isLoginPage = window.location.pathname === '/login'
    const skipRedirect = error.config?.skipAuthRedirect

    if ((status === 401 || status === 403) && !isLoginPage && !skipRedirect) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('user-storage')
      localStorage.removeItem('cart-storage')
      if (sessionExpired) {
        window.location.href = '/login?expired=1'
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  changePassword: (data) => api.post('/auth/change-password', data, { skipAuthRedirect: true }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
}

// Products API
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
}

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Orders API
export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}

// Stock API
export const stockApi = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  receive: (data) => api.post('/stock/receive', data),
  adjust: (data) => api.post('/stock/adjust', data),
}

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
}

// Promotions API
export const promotionsApi = {
  getAll: () => api.get('/promotions'),
  validate: (code, orderAmount) => api.post('/promotions/validate', { code, orderAmount }),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  delete: (id) => api.delete(`/promotions/${id}`),
}

// Reports API
export const reportsApi = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getStock: () => api.get('/reports/stock'),
  getExpenses: (params) => api.get('/reports/expenses', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings', { skipAuthRedirect: true }),
  update: (data) => api.put('/settings', data),
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users', { params: { _: Date.now() } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  delete: (id) => api.delete(`/users/${id}`),
}

// Customers API
export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

// Employees API
export const employeesApi = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  toggleActive: (id) => api.patch(`/employees/${id}/toggle-active`),
}

// Expenses API
export const expensesApi = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
}

// Refunds API
export const refundsApi = {
  getAll: () => api.get('/refunds'),
  getById: (id) => api.get(`/refunds/${id}`),
  create: (data) => api.post('/refunds', data),
}

// Email API (promotion sending)
export const emailApi = {
  sendPromotion: (promotionId, options = {}) => api.post('/notifications/promotion', { promotion_id: promotionId, ...options }, { timeout: 30000 }),
}

// Health API
export const healthApi = {
  check: () => api.get('/health', { timeout: 3000 }),
}

// Activities API
export const activitiesApi = {
  getAll: (params) => api.get('/activities', { params }),
  getStats: () => api.get('/activities/stats'),
  create: (data) => api.post('/activities', data),
  cleanup: (days) => api.delete('/activities/cleanup', { params: { days } }),
}

// Accounting API
export const accountsApi = {
  getAll: (params) => api.get('/accounting/accounts', { params }),
  getById: (id) => api.get(`/accounting/accounts/${id}`),
  create: (data) => api.post('/accounting/accounts', data),
  update: (id, data) => api.put(`/accounting/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounting/accounts/${id}`),
  seed: () => api.post('/accounting/accounts/seed'),
  setInitialCapital: (data) => api.post('/accounting/accounts/initial-capital', data),
}

export const journalsApi = {
  getAll: (params) => api.get('/accounting/journals', { params }),
  getById: (id) => api.get(`/accounting/journals/${id}`),
  create: (data) => api.post('/accounting/journals', data),
  reverse: (id) => api.post(`/accounting/journals/${id}/reverse`),
  delete: (id) => api.delete(`/accounting/journals/${id}`),
}

export const accountingReportsApi = {
  getTrialBalance: (params) => api.get('/accounting/reports/trial-balance', { params }),
  getBalanceSheet: (params) => api.get('/accounting/reports/balance-sheet', { params }),
  getProfitLoss: (params) => api.get('/accounting/reports/profit-loss', { params }),
  getAccountLedger: (accountId, params) => api.get(`/accounting/reports/account-ledger/${accountId}`, { params }),
  getFiscalPeriods: () => api.get('/accounting/reports/fiscal-periods'),
  closeFiscalPeriod: (id) => api.post(`/accounting/reports/fiscal-periods/${id}/close`),
}

export const paymentsApi = {
  getAll: (params) => api.get('/accounting/payments', { params }),
  create: (data) => api.post('/accounting/payments', data),
  update: (id, data) => api.put(`/accounting/payments/${id}`, data),
  delete: (id) => api.delete(`/accounting/payments/${id}`),
}

// Sync API (offline order upload)
export const syncOrdersApi = {
  sync: (orderData) => api.post('/sync/order', orderData, { timeout: 30000 }),
  syncBulk: (orders) => api.post('/sync/bulk', { orders }, { timeout: 60000 }),
  getStatus: () => api.get('/sync/status'),
}

export default api
