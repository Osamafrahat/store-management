import { useAppStore } from '../../stores/appStore'

export default function InventoryPrintSheet({ products, categories, settings, user }) {
  const { t } = useAppStore()

  const totalProducts = products.length
  const totalQuantity = products.reduce((sum, p) => sum + p.stock_quantity, 0)
  const lowStockCount = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.name : '-'
  }

  const handlePrint = () => {
    const printContent = document.getElementById('inventory-print-content').innerHTML
    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('print.inventoryReport')} - ${settings?.storeName || 'Store'}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1f2937;
            line-height: 1.3;
            font-size: 10px;
          }
          .print-header { border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-bottom: 10px; }
          .print-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; text-align: center; }
          .summary-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 14px; font-weight: 700; margin: 2px 0; }
          .summary-sublabel { font-size: 7px; color: #94a3b8; }

          .print-section { margin-bottom: 10px; }
          .section-title { font-size: 10px; font-weight: 700; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 3px; margin-bottom: 5px; }

          .summary-table, .product-table { width: 100%; border-collapse: collapse; font-size: 9px; }
          .summary-table th, .product-table th { background: #1e40af; color: white; padding: 3px 4px; text-align: left; font-weight: 600; font-size: 7.5px; text-transform: uppercase; }
          .summary-table td, .product-table td { padding: 2px 4px; border-bottom: 1px solid #e5e7eb; }
          .product-table tbody tr:nth-child(even) { background: #f9fafb; }
          .status-badge { display: inline-block; padding: 1px 4px; border-radius: 8px; font-size: 7px; font-weight: 600; }
          .checkbox-square { display: inline-block; width: 10px; height: 10px; border: 1.5px solid #374151; border-radius: 2px; }
          .bg-green-50 { background: #dcfce7; } .text-green-600 { color: #16a34a; }
          .bg-orange-50 { background: #fff7ed; } .text-orange-600 { color: #ea580c; }
          .bg-red-50 { background: #fef2f2; } .text-red-600 { color: #dc2626; }
          .totals-row { background: #1e40af !important; color: white; }
          .totals-row td { padding: 4px; border: none; }
          .print-footer { border-top: 1px solid #e5e7eb; padding-top: 5px; margin-top: 6px; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .font-medium { font-weight: 500; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t('print.printInventoryReport')}
        </button>
      </div>

      <div id="inventory-print-content">
        {/* Header */}
        <div className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings?.storeName || 'Store POS'}</h1>
              <p style={{ fontSize: '9px', color: '#6b7280' }}>{settings?.storeAddress || ''}</p>
              <p style={{ fontSize: '9px', color: '#6b7280' }}>{settings?.storePhone || ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#2563eb' }}>{t('print.gard')}</h2>
              <p style={{ fontSize: '10px', color: '#6b7280' }}>{t('print.gardAr')}</p>
              <p style={{ fontSize: '8px', color: '#9ca3af', marginTop: '2px' }}>
                {t('print.date')} {new Date().toLocaleDateString('en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style={{ fontSize: '8px', color: '#9ca3af' }}>
                {t('print.time')} {new Date().toLocaleTimeString('en-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="print-summary">
          <div className="summary-card">
            <div className="summary-label">{t('print.totalProducts')}</div>
            <div className="summary-value">{totalProducts}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('print.totalItems')}</div>
            <div className="summary-value">{totalQuantity.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('print.lowStock')}</div>
            <div className="summary-value" style={{ color: lowStockCount > 0 ? '#dc2626' : '#16a34a' }}>{lowStockCount}</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="print-section">
          <h3 className="section-title">{t('print.stockByCategory')}</h3>
          <table className="summary-table">
            <thead>
              <tr>
                <th>{t('print.category')}</th>
                <th>{t('print.products')}</th>
                <th>{t('print.quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category_id === cat.id)
                const catQty = catProducts.reduce((s, p) => s + p.stock_quantity, 0)
                if (catProducts.length === 0) return null
                return (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td>{catProducts.length}</td>
                    <td>{catQty.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Product List */}
        <div className="print-section">
          <h3 className="section-title">{t('print.completeProductList')}</h3>
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('print.productName')}</th>
                <th>{t('print.sku')}</th>
                <th>{t('print.barcode')}</th>
                <th>{t('print.category')}</th>
                <th>{t('print.unit') || 'Unit'}</th>
                <th>{t('print.qty')}</th>
                <th style={{ textAlign: 'center' }}>✓</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                return (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td style={{ fontSize: '8px' }}>{product.sku || '-'}</td>
                    <td style={{ fontSize: '8px' }}>{product.barcode || '-'}</td>
                    <td>{getCategoryName(product.category_id)}</td>
                    <td style={{ fontSize: '8px' }}>
                      {product.unit_of_measure === 'kilo' ? 'kg' :
                       product.unit_of_measure === 'liter' ? 'L' :
                       product.unit_of_measure === 'meter' ? 'm' :
                       'Pcs'}
                    </td>
                    <td style={{ fontWeight: 700, color: product.stock_quantity <= product.low_stock_threshold ? '#dc2626' : 'inherit' }}>
                      {product.stock_quantity}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="checkbox-square"></span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan="6" style={{ textAlign: 'right', fontWeight: 'bold' }}>{t('print.totals')}</td>
                <td style={{ fontWeight: 'bold' }}>{totalQuantity.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="print-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '7px', color: '#9ca3af' }}>{t('print.generatedBy')}</p>
              <p style={{ fontSize: '7px', color: '#9ca3af' }}>{settings?.storeName || 'Store POS'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: '#374151', fontWeight: 600 }}>
                {t('print.preparedBy')} {user?.full_name || 'Unknown User'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '7px', color: '#9ca3af' }}>{t('print.printed')} {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
