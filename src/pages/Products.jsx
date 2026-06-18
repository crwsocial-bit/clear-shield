import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseCSV } from '../utils/csvParser'

const EMPTY_FORM = {
  sku: '',
  part_number: '',
  description: '',
  manufacturer: '',
  cert_number: '',
  issuing_body: '',
  cert_issued_date: '',
  cert_expiration: '',
  po_number: '',
}

const FIELDS = [
  { name: 'part_number',      label: 'Part Number' },
  { name: 'description',      label: 'Description' },
  { name: 'manufacturer',     label: 'Manufacturer' },
  { name: 'cert_number',      label: 'Cert Number' },
  { name: 'issuing_body',     label: 'Issuing Body' },
  { name: 'cert_issued_date', label: 'Issued Date',      type: 'date' },
  { name: 'cert_expiration',  label: 'Expiration Date',  type: 'date' },
  { name: 'po_number',        label: 'PO Number' },
]

function ProductPanel({ product, onClose, onSaved, onDeleted }) {
  const isNew = !product
  const [form, setForm] = useState(
    isNew
      ? { ...EMPTY_FORM }
      : { ...EMPTY_FORM, ...Object.fromEntries(
          Object.keys(EMPTY_FORM).map(k => [k, product[k] ?? ''])
        )}
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function clearField(name) {
    setForm(f => ({ ...f, [name]: '' }))
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.sku.trim()) {
      setError('SKU is required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()])
    )

    if (isNew) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('products')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()

      if (err) {
        setError(err.message)
        setSaving(false)
      } else {
        onSaved(data, true)
      }
    } else {
      const { sku: _sku, ...patch } = payload
      const { data, error: err } = await supabase
        .from('products')
        .update(patch)
        .eq('id', product.id)
        .select()
        .single()

      if (err) {
        setError(err.message)
        setSaving(false)
      } else {
        onSaved(data, false)
      }
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (err) {
      setError(err.message)
      setDeleting(false)
      setConfirmDelete(false)
    } else {
      onDeleted(product.id)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isNew ? 'Add Product' : 'Edit Product'}
            </h2>
            {!isNew && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* SKU — editable only when adding */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            {isNew ? (
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. BRS-1234"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-400 font-mono px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                {product.sku}
                <span className="ml-2 text-xs text-gray-400 font-sans">(cannot be changed)</span>
              </p>
            )}
          </div>

          {/* All other fields with a clear button */}
          {FIELDS.map(({ name, label, type = 'text' }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form[name] && (
                  <button
                    type="button"
                    onClick={() => clearField(name)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
                    tabIndex={-1}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Delete — edit mode only */}
          {!isNew && (
            <div className="pt-4 border-t border-gray-100">
              {confirmDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700 font-medium mb-3">
                    Delete <span className="font-mono">{product.sku}</span>? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-1.5 rounded-lg hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Delete this product…
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Add Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

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
  const [panel, setPanel] = useState(null) // null | 'new' | product object
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const fileInputRef = useRef()

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true })
    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }

  function handleSaved(saved, isNew) {
    setProducts(ps =>
      isNew
        ? [...ps, saved].sort((a, b) => a.sku.localeCompare(b.sku))
        : ps.map(p => p.id === saved.id ? saved : p)
    )
    setPanel(null)
  }

  function handleDeleted(id) {
    setProducts(ps => ps.filter(p => p.id !== id))
    setPanel(null)
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
      const { error: upsertError } = await supabase
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

  const filtered = products.filter(p => {
    if (statusFilter !== 'all' && certStatus(p) !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.manufacturer?.toLowerCase().includes(q) ||
        p.part_number?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length > 0
              ? `${products.length} SKU${products.length !== 1 ? 's' : ''} in your catalog`
              : 'Add products manually or import a CSV'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPanel('new')}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Product
          </button>
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

      {/* Search + filter */}
      {products.length > 0 && (
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search SKU, description, manufacturer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="missing">No Cert</option>
            <option value="no-date">No Exp. Date</option>
          </select>
        </div>
      )}

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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No products yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Click <span className="font-medium">+ Add Product</span> to add one manually, or{' '}
            <span className="font-medium">Import CSV</span> to bulk upload.
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Expected CSV columns: SKU, Part Number, Description, Manufacturer, Cert Number, Expiration Date, PO Number
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500 text-sm">No products match your search.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            Clear filters
          </button>
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-700">{p.part_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.manufacturer ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.cert_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.cert_issued_date ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.cert_expiration ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.po_number ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge product={p} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setPanel(p)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over panel */}
      {panel && (
        <ProductPanel
          product={panel === 'new' ? null : panel}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
