import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function certStatus(p) {
  if (!p.cert_number) return 'missing'
  if (!p.cert_expiration) return 'no-date'
  const today = new Date().toISOString().split('T')[0]
  const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (p.cert_expiration < today) return 'expired'
  if (p.cert_expiration <= in90) return 'expiring'
  return 'valid'
}

const STATUS_LABEL = {
  valid:    'Valid',
  expiring: 'Expiring Soon',
  expired:  'Expired',
  missing:  'No Cert on File',
  'no-date':'No Expiration Date',
}

const STATUS_PRIORITY = { expired: 0, expiring: 1, missing: 2, 'no-date': 3, valid: 4 }

const STATUS_COLOR = {
  valid:    'text-green-700',
  expiring: 'text-yellow-700',
  expired:  'text-red-700',
  missing:  'text-gray-500',
  'no-date':'text-blue-600',
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${m}/${d}/${y}`
}

function downloadCSV(products) {
  const headers = [
    'SKU', 'Part Number', 'Description', 'Manufacturer',
    'Cert Number', 'Issuing Body', 'Cert Issued Date', 'Cert Expiration Date',
    'PO Number', 'Status'
  ]

  const rows = products.map(p => [
    p.sku,
    p.part_number ?? '',
    p.description ?? '',
    p.manufacturer ?? '',
    p.cert_number ?? '',
    p.issuing_body ?? '',
    formatDate(p.cert_issued_date),
    formatDate(p.cert_expiration),
    p.po_number ?? '',
    STATUS_LABEL[certStatus(p)],
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clearshield-compliance-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [companyName, setCompanyName] = useState('')

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: products }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('products').select('*').order('sku', { ascending: true }),
      ])
      setUserEmail(user?.email ?? '')
      setCompanyName(user?.user_metadata?.company_name ?? '')
      setProducts(products ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...products].sort(
    (a, b) => STATUS_PRIORITY[certStatus(a)] - STATUS_PRIORITY[certStatus(b)]
  )

  const total = products.length
  const today = new Date().toISOString().split('T')[0]
  const certified = products.filter(p => p.cert_number && p.cert_expiration && p.cert_expiration >= today).length
  const expiring = products.filter(p => certStatus(p) === 'expiring').length
  const expired = products.filter(p => certStatus(p) === 'expired').length
  const missing = products.filter(p => certStatus(p) === 'missing').length
  const coveragePct = total > 0 ? Math.round((certified / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (total === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No products to report on</p>
          <p className="text-gray-500 text-sm mt-1">Import your product catalog on the Products page first.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Screen header — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">NSF/ANSI 372 compliance report — {reportDate}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => downloadCSV(sorted)}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Report document */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:rounded-none print:p-0">

        {/* Report header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                NSF/ANSI 372 Compliance Report
              </h2>
              <p className="text-gray-500 text-sm mt-1">Generated by ClearShield · {reportDate}</p>
              {companyName && <p className="text-gray-700 text-sm font-medium">{companyName}</p>}
              <p className="text-gray-500 text-sm">{userEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Coverage</p>
              <p className="text-4xl font-bold text-gray-900">{coveragePct}%</p>
              <p className="text-xs text-gray-500">{certified} of {total} SKUs certified</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 font-medium">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{total}</p>
            </div>
            <div className="bg-red-50 rounded-lg px-4 py-3">
              <p className="text-xs text-red-600 font-medium">Expired</p>
              <p className="text-2xl font-bold text-red-700 mt-0.5">{expired}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg px-4 py-3">
              <p className="text-xs text-yellow-600 font-medium">Expiring Within 90 Days</p>
              <p className="text-2xl font-bold text-yellow-700 mt-0.5">{expiring}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 font-medium">No Cert on File</p>
              <p className="text-2xl font-bold text-gray-700 mt-0.5">{missing}</p>
            </div>
          </div>
        </div>

        {/* Product table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">SKU</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Part Number</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Description</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Manufacturer</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Cert Number</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Issuing Body</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Issued</th>
                <th className="text-left pb-3 font-semibold text-gray-600 pr-4">Expires</th>
                <th className="text-left pb-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(p => {
                const status = certStatus(p)
                return (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-900">{p.sku}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{p.part_number ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-700 max-w-[180px] truncate">{p.description ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{p.manufacturer ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-700">{p.cert_number ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{p.issuing_body ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{formatDate(p.cert_issued_date)}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{formatDate(p.cert_expiration)}</td>
                    <td className={`py-2.5 font-medium ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Report footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400">
          <p>
            This report was generated by ClearShield on {reportDate}. It reflects NSF/ANSI 372
            certification data as entered by the account holder. ClearShield does not independently
            verify certification status. Distributors are responsible for confirming current
            certification standing with the applicable certification body.
          </p>
        </div>
      </div>
    </div>
  )
}
