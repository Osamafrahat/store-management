import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import api from '../lib/api'
import {
  Download,
  Upload,
  Trash2,
  Database,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HardDrive,
} from 'lucide-react'

export default function BackupPage() {
  const { t } = useAppStore()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(null)
  const [restoring, setRestoring] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [message, setMessage] = useState(null)

  const loadBackups = async () => {
    try {
      setLoading(true)
      const res = await api.get('/backup')
      setBackups(res.data)
    } catch (err) {
      setMessage({ type: 'error', text: t('backup.loadFailed') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBackups() }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const createBackup = async (format) => {
    try {
      setCreating(format)
      const res = await api.post(`/backup/${format}`)
      showMessage('success', t('backup.created').replace('{rows}', res.data.totalRows))
      loadBackups()
    } catch (err) {
      showMessage('error', t('backup.createFailed'))
    } finally {
      setCreating(null)
    }
  }

  const downloadBackup = async (filename) => {
    try {
      const res = await api.get(`/backup/download/${filename}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showMessage('error', t('backup.downloadFailed'))
    }
  }

  const restoreBackup = async (filename) => {
    if (!confirm(t('backup.restoreConfirm').replace('{file}', filename))) return
    try {
      setRestoring(filename)
      const res = await api.post('/backup/restore', { filename })
      showMessage('success', t('backup.restored').replace('{rows}', res.data.restoredRows))
    } catch (err) {
      showMessage('error', t('backup.restoreFailed'))
    } finally {
      setRestoring(null)
    }
  }

  const deleteBackupFile = async (filename) => {
    if (!confirm(t('backup.deleteConfirm').replace('{file}', filename))) return
    try {
      setDeleting(filename)
      await api.delete(`/backup/${filename}`)
      showMessage('success', t('backup.deleted'))
      loadBackups()
    } catch (err) {
      showMessage('error', t('backup.deleteFailed'))
    } finally {
      setDeleting(null)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transition-all duration-300 ${
          message.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-7 h-7" />
          {t('backup.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('backup.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('backup.jsonBackup')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('backup.jsonDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => createBackup('json')}
            disabled={creating === 'json'}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {creating === 'json' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {creating === 'json' ? t('backup.creating') : t('backup.createJson')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('backup.sqlBackup')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('backup.sqlDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => createBackup('sql')}
            disabled={creating === 'sql'}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {creating === 'sql' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {creating === 'sql' ? t('backup.creating') : t('backup.createSql')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('backup.existingBackups')} ({backups.length})
          </h3>
          <button
            onClick={loadBackups}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            {t('backup.loading') || 'Loading...'}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('backup.noBackups')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {backups.map((backup) => (
              <div key={backup.name} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  backup.type === 'json'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  {backup.type === 'json' ? (
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{backup.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(backup.created)} • {formatSize(backup.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => downloadBackup(backup.name)}
                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                    title={t('backup.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => restoreBackup(backup.name)}
                    disabled={restoring === backup.name}
                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50"
                    title={t('backup.restore')}
                  >
                    {restoring === backup.name ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteBackupFile(backup.name)}
                    disabled={deleting === backup.name}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                    title={t('backup.delete')}
                  >
                    {deleting === backup.name ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
