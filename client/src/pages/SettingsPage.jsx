import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { settingsApi } from '../lib/api'
import { languageNames } from '../lib/translations'
import { Save, Store, Percent, Receipt, AlertTriangle, Globe, Star, Upload, X } from 'lucide-react'

export default function SettingsPage() {
  const { settings, updateSettings, language, setLanguage, t, toastSuccess, toastError } = useAppStore()
  const [formData, setFormData] = useState(settings)
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) {
      toastError(t('settings.logoTooLarge') || 'Logo must be under 512KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({ ...prev, storeLogo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, storeLogo: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.update(formData)
      updateSettings(formData)
      toastSuccess(t('settings.saved'))
    } catch (err) {
      console.error('Failed to save settings:', err)
      toastError(t('common.error') || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('settings.storeInfo')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('nav.language')}</h2>
          </div>

          <div className="flex gap-3">
            {Object.entries(languageNames).map(([code, name]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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

        {/* Store Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Store className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.storeInfo')}</h2>
          </div>

          <div className="space-y-4">
            {/* Store Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.storeLogo') || 'Store Logo'}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                  {formData.storeLogo ? (
                    <img src={formData.storeLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    {t('settings.uploadLogo') || 'Upload Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.storeLogo && (
                    <button type="button" onClick={handleRemoveLogo} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                      {t('settings.removeLogo') || 'Remove Logo'}
                    </button>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.logoHint') || 'PNG, JPG, SVG. Max 512KB.'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.storeName')}
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                placeholder={t('settings.storeName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.storeAddress')}
              </label>
              <textarea
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                placeholder={t('settings.storeAddress')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.storePhone')}
              </label>
              <input
                type="tel"
                name="storePhone"
                value={formData.storePhone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                placeholder="+20 XXX XXX XXXX"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Percent className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.taxRate')}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.taxRate')}
            </label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('settings.currentRate')}{formData.taxRate}%{t('settings.egyptVat')}
            </p>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.currency')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.currency')}
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.currency')}{t('settings.symbol')}
              </label>
              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.receiptSettings')}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.receiptFooter')}
            </label>
            <textarea
              name="receiptFooter"
              value={formData.receiptFooter}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              placeholder={t('receipt.thankYou')}
            />
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.lowStockThreshold')}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.lowStockThreshold')}
            </label>
            <input
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('settings.lowStockHelper')}
            </p>
          </div>
        </div>

        {/* Loyalty Points Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold">{t('settings.loyaltyPoints')}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.loyaltyPointsPerCurrency')}
            </label>
            <input
              type="number"
              name="loyaltyPointsPerCurrency"
              value={formData.loyaltyPointsPerCurrency || 0}
              onChange={handleChange}
              min="0"
              step="0.1"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('settings.loyaltyPointsDesc')} {t('settings.loyaltyHelper')}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? t('common.loading') : t('settings.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
