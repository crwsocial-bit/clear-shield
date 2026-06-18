import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseCSV } from '../utils/csvParser'

function certStatus(product) {
  if (!product.cert_number) return 'missing'
  if (!product.cert_expiration) return 'no-date'
  const today = new Date().toISOString().split('T')[0]
  const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (product.cert_expiration < today) return 'expired'
  if (product.cert_expiration <= in90) return 'expiring'
  return 'valid'
}

const STATUS_BADGE = {
  valid:    'bg-green-100 text-green-700',
  expiring: 'bg-yellow-100 text-yellow-700',
  expired:  'bg-red-100 text-red-700',
  missing:  'bg-gray-100 text-gray-500',
  'no-date':'bg-blue-100 text-blue-600',
}

const STATUS_LABEL = {
  valid:    'Valid',
  expiring: 'Expiring Soon',
  expired:  'Expired',
  missing:  'No Cert',
  'no-date':'No Exp. Date',
}

function StatusBadge({ product }) {
  const status = certStatus(product)
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data)
    }
    setLoading(false)
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    setError('')

    try {
      const { rows, skipped, unmappedHeaders } = await parseCSV(file)

      if (!rows.length) {
        setError('No valid rows found. Make sure your CSV has a SKU column.')
        setImporting(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      const records = rows.map(r => ({ ...r, user_id: user.id }))

      const { error: upsertError, count } = await supabase
        .from('products')
        .upsert(records, { onConflict: 'user_id,sku', count: 'exact' })

      if (upsertError) {
        setError(upsertError.message)
      } else {
        setImportResult({ inserted: rows.length, skipped, unmappedHeaders })
        await fetchProducts()
      }
    } catch (err) {
      setError(err.message)
    }

    setImporting(false)
    fileInputRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length > 0
              ? `${products.length} SKU${products.length !== 1 ? 's' : ''} in your catalog`
              : 'Import a CSV to populate your catalog'}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={importing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {importResult && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          <span className="font-semibold">{importResult.inserted} product{importResult.inserted !== 1 ? 's' : ''} imported.</span>
          {importResult.skipped.length > 0 && (
            <span className="ml-1">Rows skipped (no SKU): {importResult.skipped.join(', ')}.</span>
          )}
          {importResult.unmappedHeaders.length > 0 && (
            <span className="ml-1">Unrecognized columns ignored: {importResult.unmappedHeaders.join(', ')}.</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading…
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No products yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Click <span className="font-medium">Import CSV</span> to upload your product catalog.
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Expected columns: SKU, Part Number, Description, Manufacturer, Cert Number, Expiration Date, PO Number
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Part Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Manufacturer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cert Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Issued</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Expiration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">PO Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-700">{p.part_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.manufacturer ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.cert_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.cert_issued_date ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.cert_expiration ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.po_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge product={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
