import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, usersApi } from '../lib/api'

// Permission definitions
export const PERMISSIONS = {
  POS_ACCESS: 'pos_access',
  INVENTORY_VIEW: 'inventory_view',
  INVENTORY_EDIT: 'inventory_edit',
  REPORTS_VIEW: 'reports_view',
  SUPPLIERS_VIEW: 'suppliers_view',
  SUPPLIERS_EDIT: 'suppliers_edit',
  PROMOTIONS_VIEW: 'promotions_view',
  PROMOTIONS_EDIT: 'promotions_edit',
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_EDIT: 'settings_edit',
  USER_MANAGE: 'user_manage',
  CUSTOMERS_VIEW: 'customers_view',
  CUSTOMERS_EDIT: 'customers_edit',
  EXPENSES_VIEW: 'expenses_view',
  EXPENSES_EDIT: 'expenses_edit',
  REFUNDS_VIEW: 'refunds_view',
  REFUNDS_EDIT: 'refunds_edit',
  EMPLOYEES_VIEW: 'employees_view',
  EMPLOYEES_EDIT: 'employees_edit',
  ACCOUNTING_VIEW: 'accounting_view',
  ACCOUNTING_EDIT: 'accounting_edit',
  ACCOUNTING_POST: 'accounting_post',
}

// Role definitions with default permissions
export const ROLES = {
  MANAGER: {
    name: 'Manager',
    nameAr: 'مدير',
    permissions: Object.values(PERMISSIONS),
  },
  SALES_MANAGER: {
    name: 'Sales Manager',
    nameAr: 'مدير المبيعات',
    permissions: [
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.PROMOTIONS_VIEW,
      PERMISSIONS.PROMOTIONS_EDIT,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.REFUNDS_VIEW,
      PERMISSIONS.REFUNDS_EDIT,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EMPLOYEES_VIEW,
    ],
  },
  CASHIER: {
    name: 'Cashier',
    nameAr: 'كاشير',
    permissions: [
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.REFUNDS_VIEW,
    ],
  },
  SENIOR_CASHIER: {
    name: 'Senior Cashier',
    nameAr: 'كاشير أول',
    permissions: [
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.REFUNDS_VIEW,
      PERMISSIONS.REFUNDS_EDIT,
      PERMISSIONS.PROMOTIONS_VIEW,
    ],
  },
  INVENTORY_CLERK: {
    name: 'Inventory Clerk',
    nameAr: 'موظف مخزون',
    permissions: [
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_EDIT,
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.SUPPLIERS_EDIT,
    ],
  },
  SALES_ASSOCIATE: {
    name: 'Sales Associate',
    nameAr: 'موظف مبيعات',
    permissions: [
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.PROMOTIONS_VIEW,
    ],
  },
  VIEWER: {
    name: 'Viewer',
    nameAr: 'مشاهد',
    permissions: [
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.PROMOTIONS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.REFUNDS_VIEW,
      PERMISSIONS.EMPLOYEES_VIEW,
    ],
  },
  ACCOUNTANT: {
    name: 'Accountant',
    nameAr: 'محاسب',
    permissions: [
      PERMISSIONS.ACCOUNTING_VIEW,
      PERMISSIONS.ACCOUNTING_EDIT,
      PERMISSIONS.ACCOUNTING_POST,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_EDIT,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.EMPLOYEES_VIEW,
    ],
  },
}

// Session timeout: 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000

export const useUserStore = create(
  persist(
    (set, get) => ({
      // Current user
      currentUser: null,
      isAuthenticated: false,
      lastActivity: null,
      token: null,

      // Login
      login: async (username, password) => {
        try {
          const response = await authApi.login({ username, password })
          const { token, user } = response.data

          // Store token
          localStorage.setItem('auth_token', token)

          // Map snake_case to camelCase
          const mappedUser = {
            ...user,
            fullName: user.full_name,
            phone: user.phone,
            email: user.email,
          }

          set({
            currentUser: mappedUser,
            isAuthenticated: true,
            lastActivity: Date.now(),
            token
          })

          return { success: true, user: mappedUser }
        } catch (err) {
          const message = err.response?.data?.error || 'Login failed'
          return { success: false, error: message }
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('auth_token')
        set({
          currentUser: null,
          isAuthenticated: false,
          lastActivity: null,
          token: null
        })
      },

      // Update last activity
      updateActivity: () => {
        const { isAuthenticated } = get()
        if (isAuthenticated) {
          set({ lastActivity: Date.now() })
        }
      },

      // Check session timeout
      checkSessionTimeout: () => {
        const { isAuthenticated, lastActivity, logout } = get()
        if (!isAuthenticated || !lastActivity) return false

        const now = Date.now()
        const timeSinceLastActivity = now - lastActivity

        if (timeSinceLastActivity >= SESSION_TIMEOUT) {
          logout()
          return true
        }
        return false
      },

      // Check if user has permission
      hasPermission: (permission) => {
        const { currentUser } = get()
        if (!currentUser) return false
        if (currentUser.role === 'MANAGER') return true

        // Parse permissions if stored as JSON string
        let permissions = currentUser.permissions
        if (typeof permissions === 'string') {
          try {
            permissions = JSON.parse(permissions)
          } catch {
            permissions = []
          }
        }

        return permissions?.includes(permission) || false
      },

      // Check if user can access a route
      canAccess: (route) => {
        const { currentUser } = get()
        if (!currentUser) return false
        if (currentUser.role === 'MANAGER') return true

        const routePermissions = {
          '/pos': PERMISSIONS.POS_ACCESS,
          '/inventory': PERMISSIONS.INVENTORY_VIEW,
          '/reports': PERMISSIONS.REPORTS_VIEW,
          '/suppliers': PERMISSIONS.SUPPLIERS_VIEW,
          '/promotions': PERMISSIONS.PROMOTIONS_VIEW,
          '/settings': PERMISSIONS.SETTINGS_VIEW,
          '/users': PERMISSIONS.USER_MANAGE,
          '/customers': PERMISSIONS.CUSTOMERS_VIEW,
          '/employees': PERMISSIONS.EMPLOYEES_VIEW,
          '/expenses': PERMISSIONS.EXPENSES_VIEW,
          '/refunds': PERMISSIONS.REFUNDS_VIEW,
        }

        const requiredPermission = routePermissions[route]
        if (!requiredPermission) return true

        let permissions = currentUser.permissions
        if (typeof permissions === 'string') {
          try {
            permissions = JSON.parse(permissions)
          } catch {
            permissions = []
          }
        }

        return permissions?.includes(requiredPermission) || false
      },

      // Mark password as changed
      markPasswordChanged: () => {
        const { currentUser } = get()
        if (currentUser) {
          set({
            currentUser: { ...currentUser, must_change_password: 0 }
          })
        }
      },

      // Check if must change password
      mustChangePassword: () => {
        const { currentUser } = get()
        return currentUser?.must_change_password === 1 || currentUser?.must_change_password === true
      },

      // Users list
      users: [],

      // Fetch all users
      fetchUsers: async () => {
        try {
          const { data } = await usersApi.getAll()
          // Map snake_case to camelCase
          const mapped = data.map(u => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role,
            permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || []),
            isActive: u.is_active,
            mustChangePassword: u.must_change_password,
            lastLogin: u.last_login,
            employeeId: u.employee_id,
            employee: u.employee || null,
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          }))
          set({ users: mapped })
        } catch (err) {
          console.error('Failed to fetch users:', err)
        }
      },

      // Add user
      addUser: async (userData) => {
        try {
          const { data } = await usersApi.create({
            username: userData.username,
            password: userData.password,
            fullName: userData.fullName,
            role: userData.role,
            permissions: userData.permissions,
            employeeId: userData.employeeId || null,
          })
          const mapped = {
            id: data.id,
            username: data.username,
            fullName: data.full_name,
            role: data.role,
            permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : (data.permissions || []),
            isActive: data.is_active,
            mustChangePassword: data.must_change_password,
            employeeId: data.employee_id,
          }
          set(state => ({ users: [mapped, ...state.users] }))
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Failed to create user' }
        }
      },

      // Update user
      updateUser: async (userId, userData) => {
        try {
          const payload = {}
          if (userData.fullName) payload.fullName = userData.fullName
          if (userData.role) payload.role = userData.role
          if (userData.permissions) payload.permissions = userData.permissions
          if (userData.password) payload.password = userData.password
          if (userData.employeeId !== undefined) payload.employeeId = userData.employeeId

          const { data } = await usersApi.update(userId, payload)
          const mapped = {
            id: data.id,
            username: data.username,
            fullName: data.full_name,
            role: data.role,
            permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : (data.permissions || []),
            isActive: data.is_active,
            mustChangePassword: data.must_change_password,
            employeeId: data.employee_id,
          }
          set(state => ({
            users: state.users.map(u => u.id === userId ? mapped : u)
          }))
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Failed to update user' }
        }
      },

      // Delete user
      deleteUser: async (userId) => {
        try {
          await usersApi.delete(userId)
          set(state => ({
            users: state.users.filter(u => u.id !== userId)
          }))
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Failed to delete user' }
        }
      },

      // Toggle user active status
      toggleUserActive: async (userId) => {
        try {
          const { data } = await usersApi.toggleActive(userId)
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, isActive: data.is_active } : u)
          }))
        } catch (err) {
          console.error('Failed to toggle user:', err)
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
        token: state.token,
      }),
    }
  )
)
