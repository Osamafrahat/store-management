import { useAppStore } from '../../stores/appStore'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { Printer, X } from 'lucide-react'
import { useRef } from 'react'

export default function ReceiptModal({ order, onClose }) {
  const { settings, t } = useAppStore()
  const receiptRef = useRef(null)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.4;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .store-name { font-size: 16px; font-weight: bold; }
          .store-info { font-size: 10px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .item-row { margin: 5px 0; }
          .item-name { font-weight: bold; }
          .item-details { font-size: 10px; color: #666; }
          .total-row { font-weight: bold; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${settings.storeName}</div>
          ${settings.storeAddress ? `<div class="store-info">${settings.storeAddress}</div>` : ''}
          ${settings.storePhone ? `<div class="store-info">${settings.storePhone}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>${t('receipt.orderNumber')}:</span>
          <span>${order.order_number}</span>
        </div>
        <div class="row">
          <span>${t('receipt.date')}:</span>
          <span>${formatDateTime(order.created_at || new Date())}</span>
        </div>
        <div class="divider"></div>
        <div style="font-weight: bold; margin-bottom: 5px;">${t('receipt.items')}:</div>
        ${order.items.map(item => `
          <div class="item-row">
            <div class="row">
              <span class="item-name">${item.product_name || item.name}</span>
              <span>${formatCurrency(item.unit_price * item.quantity, settings.currencySymbol)}</span>
            </div>
            <div class="item-details">
              ${item.quantity} x ${formatCurrency(item.unit_price, settings.currencySymbol)}
            </div>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row">
          <span>${t('receipt.subtotal')}:</span>
          <span>${formatCurrency(order.subtotal, settings.currencySymbol)}</span>
        </div>
        ${order.discount_amount > 0 ? `
          <div class="row" style="color: green;">
            <span>${t('receipt.discount')}:</span>
            <span>-${formatCurrency(order.discount_amount, settings.currencySymbol)}</span>
          </div>
        ` : ''}
        <div class="row">
          <span>${t('receipt.tax')} (${settings.taxRate}%):</span>
          <span>${formatCurrency(order.tax_amount, settings.currencySymbol)}</span>
        </div>
        <div class="divider"></div>
        <div class="row total-row">
          <span>${t('receipt.total')}:</span>
          <span>${formatCurrency(order.total, settings.currencySymbol)}</span>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>${t('receipt.payment')}:</span>
          <span>${t(`receipt.${order.payment_method}`)}</span>
        </div>
        ${order.payment_method === 'cash' && order.change > 0 ? `
          <div class="row">
            <span>${t('receipt.change')}:</span>
            <span>${formatCurrency(order.change, settings.currencySymbol)}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="footer">
          ${settings.receiptFooter || t('receipt.thankYou')}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{t('payment.printReceipt')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div ref={receiptRef} className="p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 font-mono text-sm">
            {/* Store Header */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">{settings.storeName}</h3>
              {settings.storeAddress && (
                <p className="text-gray-500 text-xs">{settings.storeAddress}</p>
              )}
              {settings.storePhone && (
                <p className="text-gray-500 text-xs">{settings.storePhone}</p>
              )}
            </div>

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Order Info */}
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">{t('receipt.orderNumber')}:</span>
              <span className="font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-500">{t('receipt.date')}:</span>
              <span>{formatDateTime(order.created_at || new Date())}</span>
            </div>

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="font-semibold mb-2">{t('receipt.items')}:</div>
            {order.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{item.product_name || item.name}</span>
                  <span>{formatCurrency(item.unit_price * item.quantity, settings.currencySymbol)}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {item.quantity} x {formatCurrency(item.unit_price, settings.currencySymbol)}
                </div>
              </div>
            ))}

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Totals */}
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">{t('receipt.subtotal')}:</span>
              <span>{formatCurrency(order.subtotal, settings.currencySymbol)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between mb-1 text-green-600">
                <span>{t('receipt.discount')}:</span>
                <span>-{formatCurrency(order.discount_amount, settings.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">{t('receipt.tax')} ({settings.taxRate}%):</span>
              <span>{formatCurrency(order.tax_amount, settings.currencySymbol)}</span>
            </div>

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>{t('receipt.total')}:</span>
              <span>{formatCurrency(order.total, settings.currencySymbol)}</span>
            </div>

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Payment */}
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">{t('receipt.payment')}:</span>
              <span>{t(`receipt.${order.payment_method}`)}</span>
            </div>
            {order.payment_method === 'cash' && order.change > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('receipt.change')}:</span>
                <span>{formatCurrency(order.change, settings.currencySymbol)}</span>
              </div>
            )}

            <hr className="border-dashed border-gray-300 my-3" />

            {/* Footer */}
            <div className="text-center text-xs text-gray-500">
              {settings.receiptFooter || t('receipt.thankYou')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t('common.close')}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            {t('payment.printReceipt')}
          </button>
        </div>
      </div>
    </div>
  )
}
