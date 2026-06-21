import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuditList } from '../lib/auditListContext'

export const COMPANY_TYPES = ['Manufacturer', 'Customer', 'Utility', 'Distributor', 'Other']

const TYPE_BADGE = {
  Manufacturer: 'bg-blue-100 text-blue-700',
  Customer:     'bg-green-100 text-green-700',
  Utility:      'bg-purple-100 text-purple-700',
  Distributor:  'bg-orange-100 text-orange-700',
  Other:        'bg-gray-100 text-gray-600',
}

const EMPTY_FORM = {
  name: '', type: 'Manufacturer', custom_type: '',
  phone: '', email: '', website: '', address: '', notes: '',
}

export function TypeBadge({ company }) {
  const label = company.type === 'Other' ? (company.custom_type || 'Other') : company.type
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[company.type] ?? TYPE_BADGE.Other}`}>
      {label}
    </span>
  )
}

export function CompanyPanel({ company, prefillName, onClose, onSaved, onDeleted }) {
  const isNew = !company
  const [form, setForm] = useState(
    isNew
      ? { ...EMPTY_FORM, name: prefillName ?? '' }
      : { ...EMPTY_FORM, ...Object.fromEntries(Object.keys(EMPTY_FORM).map(k => [k, company[k] ?? ''])) }
  )
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirm]   = useState(false)
  const [error, setError]             = useState('')

  function set(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function clear(name) { setForm(f => ({ ...f, [name]: '' })) }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setSaving(true); setError('')
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v?.trim?.() ?? v])
    )
    if (isNew) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase.from('companies').insert({ ...payload, user_id: user.id }).select().single()
      if (err) { setError(err.message); setSaving(false) } else onSaved(data, true)
    } else {
      const { data, error: err } = await supabase.from('companies').update(payload).eq('id', company.id).select().single()
      if (err) { setError(err.message); setSaving(false) } else onSaved(data, false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error: err } = await supabase.from('companies').delete().eq('id', company.id)
    if (err) { setError(err.message); setDeleting(false); setConfirm(false) }
    else onDeleted(company.id)
  }

  const textFields = [
    { name: 'phone',   label: 'Phone',   type: 'tel' },
    { name: 'email',   label: 'Email',   type: 'email' },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'address', label: 'Address' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{isNew ? 'Add Company' : 'Edit Company'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <Field label="Company Name" required>
            <InputWithClear name="name" value={form.name} onChange={set} onClear={() => clear('name')} autoFocus />
          </Field>

          <Field label="Type">
            <select name="type" value={form.type} onChange={set}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          {form.type === 'Other' && (
            <Field label="Custom Type">
              <InputWithClear name="custom_type" value={form.custom_type} onChange={set} onClear={() => clear('custom_type')} placeholder="e.g. Testing Lab" />
            </Field>
          )}

          {textFields.map(({ name, label, type = 'text' }) => (
            <Field key={name} label={label}>
              <InputWithClear name={name} type={type} value={form[name]} onChange={set} onClear={() => clear(name)} />
            </Field>
          ))}

          <Field label="Notes">
            <textarea name="notes" value={form.notes} onChange={set} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </Field>

          {!isNew && (
            <div className="pt-4 border-t border-gray-100">
              {confirmDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700 font-medium mb-3">Delete <span className="font-semibold">{company.name}</span>? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirm(false)} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-1.5 rounded-lg hover:bg-white">Cancel</button>
                    <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-1.5 rounded-lg">{deleting ? 'Deleting…' : 'Yes, delete'}</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirm(true)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete this company…</button>
              )}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg">{saving ? 'Saving…' : isNew ? 'Add Company' : 'Save Changes'}</button>
        </div>
      </div>
    </>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function InputWithClear({ name, type = 'text', value, onChange, onClear, placeholder, autoFocus }) {
  return (
    <div className="relative">
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {value && (
        <button type="button" onClick={onClear} tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none">&times;</button>
      )}
    </div>
  )
}

export default function Companies() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nameParam = searchParams.get('name')
  const { toggle, isSelected } = useAuditList()

  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [panel, setPanel]         = useState(null) // null | 'new' | company object

  useEffect(() => {
    supabase.from('companies').select('*').order('name').then(({ data }) => {
      setCompanies(data ?? [])
      setLoading(false)
    })
  }, [])

  // Handle ?name= param from manufacturer link clicks
  useEffect(() => {
    if (!nameParam || loading) return
    const matches = companies.filter(c => c.name.toLowerCase() === nameParam.toLowerCase())
    if (matches.length === 1) {
      navigate(`/companies/${matches[0].id}`, { replace: true })
    } else if (matches.length === 0) {
      setPanel({ prefillName: nameParam })
    } else {
      setSearch(nameParam)
    }
  }, [nameParam, loading, companies, navigate])

  function handleSaved(saved, isNew) {
    setCompanies(cs =>
      isNew
        ? [...cs, saved].sort((a, b) => a.name.localeCompare(b.name))
        : cs.map(c => c.id === saved.id ? saved : c)
    )
    if (isNew) navigate(`/companies/${saved.id}`)
    else setPanel(null)
  }

  function handleDeleted(id) {
    setCompanies(cs => cs.filter(c => c.id !== id))
    setPanel(null)
  }

  const filtered = companies.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 text-sm mt-1">
            {companies.length > 0
              ? `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'} on file`
              : 'Add manufacturers, customers, utilities, and other contacts'}
          </p>
        </div>
        <button onClick={() => setPanel({ prefillName: '' })}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Company
        </button>
      </div>

      {companies.length > 0 && (
        <input type="text" placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No companies yet</p>
          <p className="text-gray-500 text-sm mt-1">Add manufacturers, customers, utilities, and distributors you work with.</p>
          <p className="text-gray-400 text-xs mt-3">You can also click any manufacturer name on the Products page to add it here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500 text-sm">No companies match your search.</p>
          <button onClick={() => setSearch('')} className="mt-2 text-blue-600 text-sm hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-8" />
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => {
                const selected = isSelected('company', c.id)
                return (
                  <tr key={c.id}
                    onClick={() => navigate(`/companies/${c.id}`)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggle({ type: 'company', id: c.id, label: c.name, sublabel: c.type })}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3"><TypeBadge company={c} /></td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {panel && (
        <CompanyPanel
          company={typeof panel === 'object' && panel.id ? panel : null}
          prefillName={panel.prefillName ?? ''}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
