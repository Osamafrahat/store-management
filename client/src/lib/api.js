import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  changePassword: (data) => api.post('/auth/change-password', data),
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
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
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

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  sendPromotion: (promotionId, options = {}) => api.post('/notifications/promotion', { promotion_id: promotionId, ...options }),
  sendCustom: (data) => api.post('/notifications/custom', data),
  delete: (id) => api.delete(`/notifications/${id}`),
  sendWhatsApp: (data) => api.post('/notifications/whatsapp', data),
}

export default api
