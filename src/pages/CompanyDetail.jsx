import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { CompanyPanel, TypeBadge } from './Companies'

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

// Picks the doc most relevant to the product's overall status, for display in a single table row.
function primaryDoc(p) {
  const docs = p.cert_documents ?? []
  if (docs.length === 0) return null
  const status = certStatus(p)
  if (status === 'expired') {
    return [...docs].filter(d => d.cert_expiration && d.cert_expiration < TODAY)
      .sort((a, b) => b.cert_expiration.localeCompare(a.cert_expiration))[0]
  }
  if (status === 'expiring') {
    return [...docs].filter(d => d.cert_expiration && d.cert_expiration >= TODAY && d.cert_expiration <= IN_90)
      .sort((a, b) => a.cert_expiration.localeCompare(b.cert_expiration))[0]
  }
  const active = docs.filter(d => !d.cert_expiration || d.cert_expiration >= TODAY)
  return [...active].sort((a, b) => (b.cert_expiration ?? '9999-99-99').localeCompare(a.cert_expiration ?? '9999-99-99'))[0] ?? docs[0]
}

const STATUS_BADGE = {
  valid:    'bg-green-100 text-green-700',
  expiring: 'bg-yellow-100 text-yellow-700',
  expired:  'bg-red-100 text-red-700',
  missing:  'bg-gray-100 text-gray-500',
}
const STATUS_LABEL = {
  valid:'Valid', expiring:'Expiring Soon', expired:'Expired', missing:'No Cert',
}

function InfoRow({ label, value, href }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{value}</a>
        : <p className="text-sm text-gray-900">{value}</p>
      }
    </div>
  )
}

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany]   = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: co }, { data: prods }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', id).single(),
        supabase.from('products').select('*, cert_documents(*)').order('sku'),
      ])
      setCompany(co)
      setProducts(prods ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  function handleSaved(updated) {
    setCompany(updated)
    setEditing(false)
  }

  function handleDeleted() {
    navigate('/companies', { replace: true })
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
  if (!company) return <div className="text-gray-500 text-sm p-8">Company not found.</div>

  const linked = products.filter(p =>
    p.manufacturer?.toLowerCase() === company.name.toLowerCase()
  )

  const hasContactInfo = company.phone || company.email || company.website || company.address || company.notes

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/companies')} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
        ← Companies
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <TypeBadge company={company} />
          </div>
          {company.type === 'Other' && company.custom_type && (
            <p className="text-gray-500 text-sm mt-0.5">{company.custom_type}</p>
          )}
        </div>
        <button onClick={() => setEditing(true)}
          className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Edit
        </button>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact Information</h2>
        {hasContactInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Phone"   value={company.phone}   href={company.phone ? `tel:${company.phone}` : null} />
            <InfoRow label="Email"   value={company.email}   href={company.email ? `mailto:${company.email}` : null} />
            <InfoRow label="Website" value={company.website} href={company.website} />
            <InfoRow label="Address" value={company.address} />
            {company.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 font-medium">Notes</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No contact info on file.{' '}
            <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline">Add it now</button>
          </p>
        )}
      </div>

      {/* Linked products */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Products</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {linked.length > 0
                ? `${linked.length} SKU${linked.length !== 1 ? 's' : ''} with manufacturer = "${company.name}"`
                : `No products with manufacturer = "${company.name}"`}
            </p>
          </div>
          <button onClick={() => navigate('/products')}
            className="text-xs text-blue-600 hover:underline">
            Manage in Products →
          </button>
        </div>

        {linked.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No products are linked to this company yet. Products are linked automatically when their Manufacturer field matches this company's name exactly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">SKU</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Description</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Cert Number</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Expiration</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {linked.map(p => {
                  const status = certStatus(p)
                  const doc    = primaryDoc(p)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{p.sku}</td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-[200px] truncate">{p.description ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{doc?.cert_number ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{doc?.cert_expiration ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CompanyPanel
          company={company}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
