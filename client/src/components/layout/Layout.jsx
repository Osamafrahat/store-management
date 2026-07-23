import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useCartStore } from '../../stores/cartStore'
import { useUserStore, PERMISSIONS } from '../../stores/userStore'
import { languageNames } from '../../lib/translations'
import {
  ShoppingCart,
  Package,
  BarChart3,
  Truck,
  Tag,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Store,
  Globe,
  Users,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, language, setLanguage, t, settings } = useAppStore()
  const { getItemCount } = useCartStore()
  const { currentUser, logout, canAccess, hasPermission } = useUserStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Build navigation based on user permissions
  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
  ]
  if (canAccess('/pos')) {
    navigation.push({ name: t('nav.pos'), href: '/pos', icon: ShoppingCart })
  }
  if (canAccess('/inventory')) {
    navigation.push({ name: t('nav.inventory'), href: '/inventory', icon: Package })
  }
  if (canAccess('/reports')) {
    navigation.push({ name: t('nav.reports'), href: '/reports', icon: BarChart3 })
  }
  if (canAccess('/suppliers')) {
    navigation.push({ name: t('nav.suppliers'), href: '/suppliers', icon: Truck })
  }
  if (canAccess('/promotions')) {
    navigation.push({ name: t('nav.promotions'), href: '/promotions', icon: Tag })
  }
  if (canAccess('/settings')) {
    navigation.push({ name: t('nav.settings'), href: '/settings', icon: Settings })
  }
  if (hasPermission(PERMISSIONS.USER_MANAGE)) {
    navigation.push({ name: 'Users', href: '/users', icon: Users })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`flex h-screen overflow-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'}
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          hidden md:flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-primary-600" />
              <span className="font-bold text-lg truncate">{settings.storeName || 'Store POS'}</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                {item.href === '/pos' && getItemCount() > 0 && (
                  <span className={`
                    ml-auto bg-primary-500 text-white text-xs font-bold rounded-full
                    ${sidebarOpen ? 'px-2 py-0.5' : 'px-1.5 py-0.5'}
                  `}>
                    {getItemCount()}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Language & Theme Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Globe className="w-5 h-5" />
              {sidebarOpen && (
                <>
                  <span className="font-medium">{t('nav.language')}</span>
                  <span className="ml-auto text-sm">{languageNames[language]}</span>
                </>
              )}
            </button>
            {showLanguageMenu && sidebarOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code)
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                      language === code ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : ''
                    }`}
                  >
                    <span>{name}</span>
                    {language === code && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            {sidebarOpen && <span className="font-medium">{theme === 'light' ? t('nav.darkMode') : t('nav.lightMode')}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">{t('users.signOut')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className={`fixed top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl ${language === 'ar' ? 'right-0' : 'left-0'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Store className="w-8 h-8 text-primary-600" />
                <span className="font-bold text-lg truncate">{settings.storeName || 'Store POS'}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            {/* Mobile Language Switcher */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-500" />
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code)
                      setMobileMenuOpen(false)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      language === code
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            {/* Mobile Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('users.signOut')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {navigation.find(n => n.href === location.pathname)?.name || settings.storeName || 'Store POS'}
            </h1>
            <div className="flex items-center gap-3">
              {/* Mobile Language Switcher */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Globe className="w-5 h-5" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    {Object.entries(languageNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code)
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                          language === code ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : ''
                        }`}
                      >
                        <span>{name}</span>
                        {language === code && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{currentUser?.fullName}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-sm">{currentUser?.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
