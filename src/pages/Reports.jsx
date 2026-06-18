import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function certStatus(p) {
  if (!p.cert_number) return 'missing'
  if (!p.cert_expiration) return 'no-date'
  const today = new Date().toISOString().split('T')[0]
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (p.cert_expiration < today) return 'expired'
  if (p.cert_expiration <= in90) return 'expiring'
  return 'valid'
}

const STATUS_LABEL = {
  valid:'Valid', expiring:'Expiring Soon', expired:'Expired', missing:'No Cert on File', 'no-date':'No Expiration Date',
}
const STATUS_PRIORITY = { expired:0, expiring:1, missing:2, 'no-date':3, valid:4 }
const STATUS_COLOR = {
  valid:'text-green-700', expiring:'text-yellow-700', expired:'text-red-700', missing:'text-gray-500', 'no-date':'text-blue-600',
}

const EMPTY_FILTERS = { search:'', manufacturer:'', poNumber:'', status:'all', expiresFrom:'', expiresTo:'' }

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${m}/${d}/${y}`
}

function downloadCSV(rows) {
  const headers = ['SKU','Part Number','Description','Manufacturer','Cert Number','Issuing Body','Cert Issued Date','Cert Expiration Date','PO Number','Status']
  const data = rows.map(p => [
    p.sku, p.part_number??'', p.description??'', p.manufacturer??'',
    p.cert_number??'', p.issuing_body??'',
    formatDate(p.cert_issued_date), formatDate(p.cert_expiration),
    p.po_number??'', STATUS_LABEL[certStatus(p)],
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
  const csv = [headers.join(','), ...data].join('\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `clearshield-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 leading-none">&times;</button>
    </span>
  )
}

export default function Reports() {
  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [userEmail,    setUserEmail]    = useState('')
  const [companyName,  setCompanyName]  = useState('')
  const [filters,      setFilters]      = useState(EMPTY_FILTERS)
  const [selectedIds,  setSelectedIds]  = useState(new Set())
  const [filtersOpen,  setFiltersOpen]  = useState(false)

  const reportDate = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  useEffect(() => {
    async function load() {
      const [{ data:{ user } }, { data:prods }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('products').select('*').order('sku'),
      ])
      setUserEmail(user?.email ?? '')
      setCompanyName(user?.user_metadata?.company_name ?? '')
      setProducts(prods ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Unique values for dropdowns
  const manufacturers = [...new Set(products.map(p => p.manufacturer).filter(Boolean))].sort()
  const poNumbers     = [...new Set(products.map(p => p.po_number).filter(Boolean))].sort()

  function updateFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
    setSelectedIds(new Set())
  }

  function clearAllFilters() {
    setFilters(EMPTY_FILTERS)
    setSelectedIds(new Set())
  }

  // Apply filters
  const filtered = [...products]
    .sort((a, b) => STATUS_PRIORITY[certStatus(a)] - STATUS_PRIORITY[certStatus(b)])
    .filter(p => {
      if (filters.manufacturer && p.manufacturer !== filters.manufacturer) return false
      if (filters.poNumber    && p.po_number    !== filters.poNumber)    return false
      if (filters.status !== 'all' && certStatus(p) !== filters.status)  return false
      if (filters.expiresFrom && (!p.cert_expiration || p.cert_expiration < filters.expiresFrom)) return false
      if (filters.expiresTo   && (!p.cert_expiration || p.cert_expiration > filters.expiresTo))   return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return p.sku?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.manufacturer?.toLowerCase().includes(q)
      }
      return true
    })

  // Export set: selected rows take priority over filtered
  const exportData = selectedIds.size > 0
    ? products.filter(p => selectedIds.has(p.id))
    : filtered

  // Active filter chips
  const activeChips = [
    filters.search       && { key:'search',       label:`"${filters.search}"` },
    filters.manufacturer && { key:'manufacturer', label:filters.manufacturer },
    filters.poNumber     && { key:'poNumber',     label:`PO: ${filters.poNumber}` },
    filters.status !== 'all' && { key:'status',  label:STATUS_LABEL[filters.status] },
    filters.expiresFrom  && { key:'expiresFrom',  label:`Expires from ${formatDate(filters.expiresFrom)}` },
    filters.expiresTo    && { key:'expiresTo',    label:`Expires to ${formatDate(filters.expiresTo)}` },
  ].filter(Boolean)

  const activeFilterCount = activeChips.length

  // Filter summary line for print
  const filterSummary = [
    ...activeChips.map(c => c.label),
    selectedIds.size > 0 && `${selectedIds.size} rows manually selected`,
  ].filter(Boolean)

  // Selection helpers
  function toggleRow(id) {
    setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    const allSelected = filtered.every(p => selectedIds.has(p.id))
    setSelectedIds(allSelected ? new Set() : new Set(filtered.map(p => p.id)))
  }
  const allVisibleSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))
  const someSelected       = filtered.some(p => selectedIds.has(p.id))

  // Export button label
  function exportLabel(base) {
    if (selectedIds.size > 0) return `${base} (${selectedIds.size} selected)`
    if (activeFilterCount > 0) return `${base} (${filtered.length} of ${products.length})`
    return `${base} (${products.length})`
  }

  // Stats over export set
  const today       = new Date().toISOString().split('T')[0]
  const total       = products.length
  const expTotal    = exportData.length
  const certified   = exportData.filter(p => p.cert_number && p.cert_expiration && p.cert_expiration >= today).length
  const expiring    = exportData.filter(p => certStatus(p) === 'expiring').length
  const expired     = exportData.filter(p => certStatus(p) === 'expired').length
  const missing     = exportData.filter(p => certStatus(p) === 'missing').length
  const coveragePct = expTotal > 0 ? Math.round((certified / expTotal) * 100) : 0

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>

  if (total === 0) return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Reports</h1></div>
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-900 font-medium">No products to report on</p>
        <p className="text-gray-500 text-sm mt-1">Import your product catalog on the Products page first.</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Screen header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">NSF/ANSI 372 compliance report — {reportDate}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => downloadCSV(exportData)}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {exportLabel('Download CSV')}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {exportLabel('Print / PDF')}
          </button>
        </div>
      </div>

      {/* Filters & Selection panel */}
      <div className="mb-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeChips.map(chip => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => updateFilter(chip.key, chip.key === 'status' ? 'all' : '')}
            />
          ))}

          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-gray-600">
              Clear all
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  placeholder="SKU, description, manufacturer…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label>
                <select value={filters.manufacturer} onChange={e => updateFilter('manufacturer', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All manufacturers</option>
                  {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PO Number</label>
                <select value={filters.poNumber} onChange={e => updateFilter('poNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All PO numbers</option>
                  {poNumbers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All statuses</option>
                  <option value="valid">Valid</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="missing">No Cert</option>
                  <option value="no-date">No Exp. Date</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Expiration From</label>
                <input type="date" value={filters.expiresFrom} onChange={e => updateFilter('expiresFrom', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Expiration To</label>
                <input type="date" value={filters.expiresTo} onChange={e => updateFilter('expiresTo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Selection count bar */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-sm text-blue-700 font-medium">{selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-blue-600 hover:underline">Clear selection</button>
          </div>
        )}
      </div>

      {/* Report document */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:rounded-none print:p-0">

        {/* Report header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">NSF/ANSI 372 Compliance Report</h2>
              <p className="text-gray-500 text-sm mt-1">Generated by ClearShield · {reportDate}</p>
              {companyName && <p className="text-gray-700 text-sm font-medium">{companyName}</p>}
              <p className="text-gray-500 text-sm">{userEmail}</p>
              {filterSummary.length > 0 && (
                <p className="text-gray-500 text-xs mt-2">
                  <span className="font-medium">Scope: </span>{filterSummary.join(' · ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Coverage</p>
              <p className="text-4xl font-bold text-gray-900">{coveragePct}%</p>
              <p className="text-xs text-gray-500">{certified} of {expTotal} SKUs certified</p>
              {expTotal < total && (
                <p className="text-xs text-gray-400 mt-0.5">{expTotal} of {total} total SKUs shown</p>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 font-medium">SKUs Shown</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{expTotal}</p>
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
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No products match the active filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="print:hidden pb-3 pr-3 w-8">
                    <input type="checkbox"
                      checked={allVisibleSelected}
                      ref={el => el && (el.indeterminate = someSelected && !allVisibleSelected)}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                {filtered.map(p => {
                  const status   = certStatus(p)
                  const selected = selectedIds.has(p.id)
                  return (
                    <tr key={p.id} className={selected ? 'bg-blue-50' : ''}>
                      <td className="print:hidden py-2.5 pr-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleRow(p.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-900">{p.sku}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{p.part_number ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-gray-700 max-w-[160px] truncate">{p.description ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{p.manufacturer ?? '—'}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-700">{p.cert_number ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{p.issuing_body ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{formatDate(p.cert_issued_date)}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{formatDate(p.cert_expiration)}</td>
                      <td className={`py-2.5 font-medium ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
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
