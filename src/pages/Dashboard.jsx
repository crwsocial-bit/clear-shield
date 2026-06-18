import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColor ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const today = new Date().toISOString().split('T')[0]
      const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const { data, error } = await supabase
        .from('products')
        .select('cert_number, cert_expiration')

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const total = data.length
      const certified = data.filter(
        p => p.cert_number && p.cert_expiration && p.cert_expiration >= today
      ).length
      const expiringSoon = data.filter(
        p => p.cert_expiration && p.cert_expiration >= today && p.cert_expiration <= in90Days
      ).length
      const noCert = data.filter(p => !p.cert_number).length
      const coveragePct = total > 0 ? Math.round((certified / total) * 100) : 0

      setStats({ total, certified, expiringSoon, noCert, coveragePct })
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  const isEmpty = stats.total === 0

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total SKUs"
            value={stats.total}
            sub="products in catalog"
            valueColor="text-gray-900"
          />
          <StatCard
            label="Cert Coverage"
            value={`${stats.coveragePct}%`}
            sub={`${stats.certified} of ${stats.total} SKUs certified`}
            valueColor="text-green-600"
          />
          <StatCard
            label="Expiring Soon"
            value={stats.expiringSoon}
            sub="certs expiring within 90 days"
            valueColor="text-yellow-600"
          />
          <StatCard
            label="No Cert on File"
            value={stats.noCert}
            sub="SKUs missing certification"
            valueColor="text-red-600"
          />
        </div>
      )}

      {!isEmpty && stats.expiringSoon > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
          <span className="font-semibold">
            {stats.expiringSoon} certification{stats.expiringSoon > 1 ? 's' : ''} expiring within 90 days.
          </span>{' '}
          Review your Products page and renew before expiration to maintain compliance.
        </div>
      )}
    </div>
  )
}
