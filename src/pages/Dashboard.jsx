import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TODAY = new Date().toISOString().split('T')[0]
const IN_90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

function certStatus(p) {
  const docs = p.cert_documents ?? []
  if (docs.length === 0) return 'missing'
  const active = docs.filter(d => !d.cert_expiration || d.cert_expiration >= TODAY)
  if (active.length === 0) return 'expired'
  if (active.some(d => d.cert_expiration && d.cert_expiration <= IN_90)) return 'expiring'
  return 'valid'
}

function primaryExpiration(product, type) {
  const docs = product.cert_documents ?? []
  if (type === 'expired') {
    const expired = docs.filter(d => d.cert_expiration && d.cert_expiration < TODAY)
    return expired.sort((a, b) => b.cert_expiration.localeCompare(a.cert_expiration))[0]?.cert_expiration ?? null
  }
  if (type === 'expiring') {
    const expiring = docs.filter(d => d.cert_expiration && d.cert_expiration >= TODAY && d.cert_expiration <= IN_90)
    return expiring.sort((a, b) => a.cert_expiration.localeCompare(b.cert_expiration))[0]?.cert_expiration ?? null
  }
  return null
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${m}/${d}/${y}`
}

function StatCard({ label, value, sub, valueColor, onClick, active }) {
  const clickable = !!onClick
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={`text-left w-full bg-white rounded-xl border p-6 transition-colors ${
        active
          ? 'border-blue-400 ring-2 ring-blue-100'
          : clickable
          ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
          : 'border-gray-200 cursor-default'
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColor ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {clickable && value > 0 && (
        <p className="text-xs text-blue-600 mt-2">{active ? 'Hide list ↑' : 'View list →'}</p>
      )}
    </button>
  )
}

function DrillTable({ rows, type }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">SKU</th>
          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Description</th>
          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Manufacturer</th>
          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Docs</th>
          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">
            {type === 'missing' ? 'Issue' : 'Expiration'}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map(p => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-2.5 font-mono text-xs text-gray-900">{p.sku}</td>
            <td className="px-5 py-2.5 text-gray-700 max-w-[200px] truncate">{p.description ?? '—'}</td>
            <td className="px-5 py-2.5 text-gray-700">{p.manufacturer ?? '—'}</td>
            <td className="px-5 py-2.5 text-gray-500 text-xs">{p.cert_documents?.length ?? 0}</td>
            <td className="px-5 py-2.5 font-medium">
              {type === 'missing'
                ? <span className="text-gray-500">No cert on file</span>
                : type === 'expired'
                  ? <span className="text-red-600">{formatDate(primaryExpiration(p, 'expired'))}</span>
                  : <span className="text-yellow-700">{formatDate(primaryExpiration(p, 'expiring'))}</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DrillDown({ products, type, onClose }) {
  const navigate = useNavigate()

  const expiredRows  = products.filter(p => certStatus(p) === 'expired')
    .sort((a, b) => a.sku.localeCompare(b.sku))
  const missingRows  = products.filter(p => certStatus(p) === 'missing')
    .sort((a, b) => a.sku.localeCompare(b.sku))
  const expiringRows = products.filter(p => certStatus(p) === 'expiring')
    .sort((a, b) => {
      const ae = primaryExpiration(a, 'expiring') ?? ''
      const be = primaryExpiration(b, 'expiring') ?? ''
      return ae.localeCompare(be) || a.sku.localeCompare(b.sku)
    })

  const title = type === 'not-sellable' ? 'Not Sellable — Detail'
    : type === 'expiring' ? 'Expiring Within 90 Days'
    : '—'

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/products')} className="text-xs text-blue-600 hover:underline">
            Fix in Products →
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
      </div>

      {type === 'expiring' && (
        expiringRows.length === 0
          ? <p className="px-5 py-6 text-sm text-gray-400 text-center">No certs expiring within 90 days.</p>
          : <DrillTable rows={expiringRows} type="expiring" />
      )}

      {type === 'not-sellable' && (
        expiredRows.length === 0 && missingRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">All SKUs have valid compliance documentation.</p>
        ) : (
          <>
            {expiredRows.length > 0 && (
              <>
                <div className="px-5 py-2 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Expired Certifications — {expiredRows.length} SKU{expiredRows.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <DrillTable rows={expiredRows} type="expired" />
              </>
            )}
            {missingRows.length > 0 && (
              <>
                <div className={`px-5 py-2 bg-gray-50 border-b border-gray-100 ${expiredRows.length > 0 ? 'border-t border-gray-200' : ''}`}>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    No Cert on File — {missingRows.length} SKU{missingRows.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <DrillTable rows={missingRows} type="missing" />
              </>
            )}
          </>
        )
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [drillDown, setDrillDown] = useState(null)

  useEffect(() => {
    supabase.from('products').select('*, cert_documents(*)').then(({ data, error }) => {
      if (!error) setProducts(data ?? [])
      setLoading(false)
    })
  }, [])

  function toggleDrill(type) {
    setDrillDown(d => d === type ? null : type)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
  }

  const total        = products.length
  const sellable     = products.filter(p => { const s = certStatus(p); return s === 'valid' || s === 'expiring' }).length
  const expiringSoon = products.filter(p => certStatus(p) === 'expiring').length
  const notSellable  = products.filter(p => { const s = certStatus(p); return s === 'expired' || s === 'missing' }).length
  const sellablePct  = total > 0 ? Math.round((sellable / total) * 100) : 0

  const isEmpty = total === 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Lead-free compliance status across your catalog
        </p>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No products yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Import your product catalog to start tracking certifications.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Go to Products
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total SKUs"
              value={total}
              sub="products in catalog"
              valueColor="text-gray-900"
            />
            <StatCard
              label="Sellable"
              value={sellable}
              sub={`${sellablePct}% of catalog — valid cert on file`}
              valueColor="text-green-600"
            />
            <StatCard
              label="Expiring Soon"
              value={expiringSoon}
              sub="still sellable — cert expires within 90 days"
              valueColor="text-yellow-600"
              onClick={expiringSoon > 0 ? () => toggleDrill('expiring') : null}
              active={drillDown === 'expiring'}
            />
            <StatCard
              label="Not Sellable"
              value={notSellable}
              sub="expired cert or no cert on file"
              valueColor="text-red-600"
              onClick={notSellable > 0 ? () => toggleDrill('not-sellable') : null}
              active={drillDown === 'not-sellable'}
            />
          </div>

          {drillDown && (
            <DrillDown
              products={products}
              type={drillDown}
              onClose={() => setDrillDown(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
