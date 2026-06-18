import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TODAY = new Date().toISOString().split('T')[0]
const IN_90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

function certStatus(p) {
  if (!p.cert_number) return 'missing'
  if (!p.cert_expiration) return 'no-date'
  if (p.cert_expiration < TODAY) return 'expired'
  if (p.cert_expiration <= IN_90) return 'expiring'
  return 'valid'
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

const DRILL_CONFIG = {
  expiring: {
    label: 'Expiring Within 90 Days',
    rowColor: 'text-yellow-700',
    emptyText: 'No certs expiring within 90 days.',
  },
  expired: {
    label: 'Expired Certifications',
    rowColor: 'text-red-700',
    emptyText: 'No expired certifications.',
  },
  missing: {
    label: 'SKUs with No Cert on File',
    rowColor: 'text-gray-500',
    emptyText: 'All SKUs have a cert number on file.',
  },
}

function DrillDown({ products, type, onClose }) {
  const navigate = useNavigate()
  const cfg = DRILL_CONFIG[type]
  const rows = products.filter(p => certStatus(p) === type)
    .sort((a, b) => (a.cert_expiration ?? '').localeCompare(b.cert_expiration ?? '') || a.sku.localeCompare(b.sku))

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700">{cfg.label}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/products')}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit in Products →
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400 text-center">{cfg.emptyText}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">SKU</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Description</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Manufacturer</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Cert Number</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Expiration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-mono text-xs text-gray-900">{p.sku}</td>
                <td className="px-5 py-2.5 text-gray-700 max-w-[200px] truncate">{p.description ?? '—'}</td>
                <td className="px-5 py-2.5 text-gray-700">{p.manufacturer ?? '—'}</td>
                <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{p.cert_number ?? '—'}</td>
                <td className={`px-5 py-2.5 font-medium ${cfg.rowColor}`}>{formatDate(p.cert_expiration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [drillDown, setDrillDown] = useState(null)

  useEffect(() => {
    supabase.from('products').select('*').then(({ data, error }) => {
      if (!error) setProducts(data ?? [])
      setLoading(false)
    })
  }, [])

  function toggleDrill(type) {
    setDrillDown(d => d === type ? null : type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  const total = products.length
  const certified = products.filter(p => p.cert_number && p.cert_expiration && p.cert_expiration >= TODAY).length
  const expiringSoon = products.filter(p => certStatus(p) === 'expiring').length
  const expired = products.filter(p => certStatus(p) === 'expired').length
  const noCert = products.filter(p => certStatus(p) === 'missing').length
  const coveragePct = total > 0 ? Math.round((certified / total) * 100) : 0

  const isEmpty = total === 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          NSF/ANSI 372 certification coverage across your catalog
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
              label="Cert Coverage"
              value={`${coveragePct}%`}
              sub={`${certified} of ${total} SKUs certified`}
              valueColor="text-green-600"
            />
            <StatCard
              label="Expiring Soon"
              value={expiringSoon}
              sub="certs expiring within 90 days"
              valueColor="text-yellow-600"
              onClick={expiringSoon > 0 ? () => toggleDrill('expiring') : null}
              active={drillDown === 'expiring'}
            />
            <StatCard
              label="Expired"
              value={expired}
              sub="certifications past expiration"
              valueColor="text-red-600"
              onClick={expired > 0 ? () => toggleDrill('expired') : null}
              active={drillDown === 'expired'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <StatCard
              label="No Cert on File"
              value={noCert}
              sub="SKUs missing certification"
              valueColor="text-gray-700"
              onClick={noCert > 0 ? () => toggleDrill('missing') : null}
              active={drillDown === 'missing'}
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
