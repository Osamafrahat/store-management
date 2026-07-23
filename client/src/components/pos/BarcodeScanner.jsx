import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'
import { X, Camera, Keyboard } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const { t } = useAppStore()
  const [mode, setMode] = useState('manual')
  const [manualInput, setManualInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (mode === 'manual') {
      inputRef.current?.focus()
    }
  }, [mode])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
    }
  }

  const startCameraScanner = async () => {
    try {
      setMode('camera')
      setIsScanning(true)

      const { Html5Qrcode } = await import('html5-qrcode')

      const scanner = new Html5Qrcode('barcode-scanner')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
          scanner.stop()
          setIsScanning(false)
        },
        () => {}
      )
    } catch (err) {
      console.error('Camera scanner error:', err)
      setIsScanning(false)
      setMode('manual')
      alert(t('scanner.cameraError'))
    }
  }

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current = null
    }
    setIsScanning(false)
    setMode('manual')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{t('scanner.title')}</h2>
          <button
            onClick={() => {
              stopCameraScanner()
              onClose()
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-4">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => {
                stopCameraScanner()
                setMode('manual')
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                mode === 'manual'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              {t('scanner.manual')}
            </button>
            <button
              onClick={startCameraScanner}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                mode === 'camera'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              {t('scanner.camera')}
            </button>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="p-4">
          {mode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scanner.enterBarcode')}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={t('scanner.barcodePlaceholder')}
                  className="w-full px-4 py-3 text-lg rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('scanner.lookUp')}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                id="barcode-scanner"
                className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden"
              />
              {isScanning && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="animate-pulse">{t('scanner.pointCamera')}</p>
                </div>
              )}
              <button
                onClick={stopCameraScanner}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('scanner.cancelCamera')}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-4 pb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>{t('scanner.tip')}</strong> {t('scanner.tipText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
