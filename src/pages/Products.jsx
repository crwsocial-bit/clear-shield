import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { parseCSV } from '../utils/csvParser'
import { TypeBadge } from './Companies'
import { useAuditList } from '../lib/auditListContext'
import SmartImportModal from '../components/SmartImportModal'
import { statusLabel } from '../utils/statusLabel'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  sku:          '',
  part_number:  '',
  description:  '',
  manufacturer: '',
  po_number:    '',
  notes:        '',
}

const FIELDS = [
  { name: 'part_number',  label: 'Part Number' },
  { name: 'description',  label: 'Description' },
  { name: 'manufacturer', label: 'Manufacturer' },
  { name: 'po_number',    label: 'PO Number' },
  { name: 'notes',        label: 'Notes', multiline: true },
]

const EMPTY_DOC = {
  document_type:    'third_party_certificate',
  issuing_body:     '',
  cert_number:      '',
  cert_scope:       '',
  cert_issued_date: '',
  cert_expiration:  '',
  notes:            '',
}

const DOC_TYPE_LABELS = {
  third_party_certificate:         'Third-Party Certificate',
  manufacturer_self_certification: 'Manufacturer Self-Certification',
  mill_test_report:                'Mill Test Report',
  other:                           'Other',
}

const ISSUING_BODIES = [
  { value: 'NSF',           label: 'NSF International' },
  { value: 'IAPMO',         label: 'IAPMO' },
  { value: 'CSA_Group',     label: 'CSA Group' },
  { value: 'UL',            label: 'UL (Underwriters Labs)' },
  { value: 'Bureau_Veritas', label: 'Bureau Veritas' },
  { value: 'other',         label: 'Other' },
]

const IB_LABEL = Object.fromEntries(ISSUING_BODIES.map(b => [b.value, b.label]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Opens a cert document's uploaded file via a short-lived signed URL (bucket is private).
// The blank tab is opened synchronously on click so browsers don't treat the later
// async redirect as a popup.
async function openCertFile(path) {
  if (!path) return
  const win = window.open('', '_blank')
  const { data, error } = await supabase.storage.from('cert-documents').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) {
    console.error('Could not generate signed URL for cert file:', error)
    win?.close()
    return
  }
  win.location.href = data.signedUrl
}

function normalizeIssuingBody(raw) {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  if (s.startsWith('nsf')) return 'NSF'
  if (s.startsWith('iapmo')) return 'IAPMO'
  if (s.startsWith('csa')) return 'CSA_Group'
  if (s.startsWith('ul') || s.startsWith('underwriter')) return 'UL'
  if (s.startsWith('bureau')) return 'Bureau_Veritas'
  if (s) return 'other'
  return null
}

export function certStatus(product) {
  const docs = product.cert_documents ?? []
  if (docs.length === 0) return 'missing'
  const today = new Date().toISOString().split('T')[0]
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const active = docs.filter(d => !d.cert_expiration || d.cert_expiration >= today)
  if (active.length === 0) return 'expired'
  if (active.some(d => d.cert_expiration && d.cert_expiration <= in90)) return 'expiring'
  return 'valid'
}

export function SellableBadge({ product }) {
  const s = certStatus(product)
  const sellable = s === 'valid' || s === 'expiring'
  const docs  = product.cert_documents ?? []
  const today = new Date().toISOString().split('T')[0]
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let detail = null
  if (s === 'expiring') {
    const soonest = docs
      .filter(d => d.cert_expiration && d.cert_expiration >= today && d.cert_expiration <= in90)
      .sort((a, b) => a.cert_expiration.localeCompare(b.cert_expiration))[0]
    if (soonest) detail = `Exp. ${soonest.cert_expiration}`
  } else if (s === 'expired') {
    const latest = docs
      .filter(d => d.cert_expiration && d.cert_expiration < today)
      .sort((a, b) => b.cert_expiration.localeCompare(a.cert_expiration))[0]
    detail = latest ? `Expired ${latest.cert_expiration}` : 'All docs expired'
  } else if (s === 'missing') {
    detail = 'No cert on file'
  }

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        sellable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sellable ? 'bg-green-500' : 'bg-red-500'}`} />
        {sellable ? statusLabel('sellable') : statusLabel('not-sellable')}
      </span>
      {detail && <span className="text-xs text-gray-400 pl-0.5">{detail}</span>}
    </div>
  )
}

// ─── ManufacturerField ────────────────────────────────────────────────────────

function ManufacturerField({ value, onChange, companies }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const matches = companies.filter(c =>
    !value || c.name.toLowerCase().includes(value.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
          >
            &times;
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {matches.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(c.name); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-gray-900">{c.name}</span>
              <TypeBadge company={c} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CertDocRow ───────────────────────────────────────────────────────────────

const DOC_TYPE_SHORT = {
  third_party_certificate:         '3rd-Party Cert',
  manufacturer_self_certification: 'Self-Cert',
  mill_test_report:                'Mill Test',
  other:                           'Other',
}

// ─── DocCountBadge ────────────────────────────────────────────────────────────

const DOC_MENU_WIDTH = 224 // px, matches w-56

function DocCountBadge({ docs }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState(null)
  const btnRef  = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function handleDismiss() { setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleDismiss, true)
    window.addEventListener('resize', handleDismiss)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleDismiss, true)
      window.removeEventListener('resize', handleDismiss)
    }
  }, [open])

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({
        top:  rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - DOC_MENU_WIDTH - 8),
      })
    }
    setOpen(o => !o)
  }

  if (docs.length === 0) return null

  if (docs.length === 1) {
    const doc = docs[0]
    const hasFile = !!doc.source_file_path
    return (
      <button
        type="button"
        disabled={!hasFile}
        onClick={() => openCertFile(doc.source_file_path)}
        title={hasFile ? 'Open document' : 'No file uploaded for this document'}
        className={`text-xs self-center ${hasFile ? 'text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-400 cursor-default'}`}
      >
        1 doc
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        onClick={toggleOpen}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline self-center"
      >
        {docs.length} docs
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: DOC_MENU_WIDTH }}
          className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          {docs.map(doc => {
            const hasFile = !!doc.source_file_path
            return (
              <button
                key={doc.id}
                type="button"
                disabled={!hasFile}
                onClick={() => { setOpen(false); openCertFile(doc.source_file_path) }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 ${hasFile ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-400 cursor-default'}`}
              >
                <span className="truncate">
                  {DOC_TYPE_SHORT[doc.document_type] ?? doc.document_type}
                  {doc.cert_number ? ` · ${doc.cert_number}` : ''}
                </span>
                {!hasFile && <span className="shrink-0 text-[10px]">No file</span>}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}

function CertDocRow({ doc, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const expired    = doc.cert_expiration && doc.cert_expiration < today
  const expiring   = !expired && doc.cert_expiration && doc.cert_expiration <= in90
  const isSelfCert = doc.document_type === 'manufacturer_self_certification'

  const borderClass = expired  ? 'border-red-200 bg-red-50'
    : expiring ? 'border-yellow-200 bg-yellow-50'
    : 'border-gray-200 bg-white'

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`px-1.5 py-0.5 rounded font-medium ${isSelfCert ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
              {DOC_TYPE_SHORT[doc.document_type] ?? doc.document_type}
            </span>
            {!isSelfCert && doc.issuing_body
              ? <span className="text-gray-600">{IB_LABEL[doc.issuing_body] ?? doc.issuing_body}</span>
              : isSelfCert && <span className="text-yellow-700 font-medium">No 3rd-party verification</span>
            }
          </div>
          {doc.cert_number && (
            <p className="font-mono text-gray-700">{doc.cert_number}</p>
          )}
          {doc.cert_scope && (
            <p className="text-gray-500 truncate mt-0.5">{doc.cert_scope}</p>
          )}
          <div className="flex gap-3 mt-1 text-gray-500">
            {doc.cert_issued_date && <span>Issued {doc.cert_issued_date}</span>}
            {doc.cert_expiration && (
              <span className={expired ? 'text-red-600 font-medium' : expiring ? 'text-yellow-700 font-medium' : ''}>
                {expired ? 'Expired' : 'Exp.'} {doc.cert_expiration}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {confirmDel ? (
            <>
              <button type="button" onClick={() => setConfirmDel(false)} className="text-gray-500 hover:text-gray-700 px-1">Cancel</button>
              <button type="button" onClick={onDelete} className="text-red-600 font-medium px-1">Delete</button>
            </>
          ) : (
            <>
              {doc.source_file_path && (
                <button type="button" onClick={() => openCertFile(doc.source_file_path)} className="text-blue-600 hover:text-blue-800 font-medium px-1">View file</button>
              )}
              <button type="button" onClick={onEdit} className="text-blue-600 hover:text-blue-800 font-medium px-1">Edit</button>
              <button type="button" onClick={() => setConfirmDel(true)} className="text-gray-300 hover:text-red-500 text-base px-1">&times;</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CertDocForm ──────────────────────────────────────────────────────────────

function CertDocForm({ doc, productId, userId, onSaved, onCancel }) {
  const isNew = !doc?.id
  const [form, setForm] = useState(
    isNew ? { ...EMPTY_DOC } : {
      document_type:    doc.document_type    ?? 'third_party_certificate',
      issuing_body:     doc.issuing_body     ?? '',
      cert_number:      doc.cert_number      ?? '',
      cert_scope:       doc.cert_scope       ?? '',
      cert_issued_date: doc.cert_issued_date ?? '',
      cert_expiration:  doc.cert_expiration  ?? '',
      notes:            doc.notes            ?? '',
    }
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const isSelfCert = form.document_type === 'manufacturer_self_certification'

  async function handleSave() {
    setSaving(true)
    setError('')
    const payload = {
      document_type:    form.document_type,
      issuing_body:     isSelfCert ? null : (form.issuing_body || null),
      cert_number:      form.cert_number.trim()      || null,
      cert_scope:       form.cert_scope.trim()       || null,
      cert_issued_date: form.cert_issued_date        || null,
      cert_expiration:  form.cert_expiration         || null,
      notes:            form.notes.trim()            || null,
    }

    if (isNew) {
      const { data, error: err } = await supabase
        .from('cert_documents')
        .insert({ ...payload, product_id: productId, user_id: userId })
        .select().single()
      if (err) { setError(err.message); setSaving(false) }
      else onSaved(data, true)
    } else {
      const { data, error: err } = await supabase
        .from('cert_documents')
        .update(payload)
        .eq('id', doc.id)
        .select().single()
      if (err) { setError(err.message); setSaving(false) }
      else onSaved(data, false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
        <select
          value={form.document_type}
          onChange={e => setForm(f => ({ ...f, document_type: e.target.value, issuing_body: '' }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {isSelfCert && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 mt-1.5">
            Self-certified — no third-party verification. Carries higher compliance risk.
          </p>
        )}
      </div>

      {!isSelfCert && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Body</label>
          <select
            value={form.issuing_body}
            onChange={e => setForm(f => ({ ...f, issuing_body: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select —</option>
            {ISSUING_BODIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cert Number</label>
        <input
          type="text"
          value={form.cert_number}
          onChange={e => setForm(f => ({ ...f, cert_number: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cert Scope</label>
        <input
          type="text"
          value={form.cert_scope}
          onChange={e => setForm(f => ({ ...f, cert_scope: e.target.value }))}
          placeholder="e.g. All brass ball valves — ½″ to 2″"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Issued Date</label>
          <input
            type="date"
            value={form.cert_issued_date}
            onChange={e => setForm(f => ({ ...f, cert_issued_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Date</label>
          <input
            type="date"
            value={form.cert_expiration}
            onChange={e => setForm(f => ({ ...f, cert_expiration: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-1.5 rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : isNew ? 'Add Document' : 'Save Document'}
        </button>
      </div>
    </div>
  )
}

// ─── CertDocSection ───────────────────────────────────────────────────────────

function CertDocSection({ product, userId, onDocsChanged }) {
  const [docs, setDocs]       = useState(product.cert_documents ?? [])
  const [editing, setEditing] = useState(null)   // null | 'new' | doc object

  function commitDocs(updated) {
    setDocs(updated)
    onDocsChanged?.(product.id, updated)
  }

  async function handleDelete(docId) {
    const { error } = await supabase.from('cert_documents').delete().eq('id', docId)
    if (!error) commitDocs(docs.filter(d => d.id !== docId))
  }

  function handleSaved(saved, isNew) {
    commitDocs(isNew ? [...docs, saved] : docs.map(d => d.id === saved.id ? saved : d))
    setEditing(null)
  }

  return (
    <div className="pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compliance Documents</p>
        {editing !== 'new' && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Document
          </button>
        )}
      </div>

      {docs.length === 0 && !editing && (
        <p className="text-xs text-gray-400 py-1 mb-2">No compliance documents attached yet.</p>
      )}

      <div className="space-y-2">
        {docs.map(doc =>
          editing?.id === doc.id ? (
            <CertDocForm
              key={doc.id}
              doc={doc}
              productId={product.id}
              userId={userId}
              onSaved={handleSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <CertDocRow
              key={doc.id}
              doc={doc}
              onEdit={() => setEditing(doc)}
              onDelete={() => handleDelete(doc.id)}
            />
          )
        )}

        {editing === 'new' && (
          <CertDocForm
            doc={null}
            productId={product.id}
            userId={userId}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── ProductPanel ─────────────────────────────────────────────────────────────

export function ProductPanel({ product, onClose, onSaved, onDeleted, onDocsChanged, companies }) {
  const navigate = useNavigate()
  const isNew = !product
  const [form, setForm] = useState(
    isNew
      ? { ...EMPTY_FORM }
      : { ...EMPTY_FORM, ...Object.fromEntries(
          Object.keys(EMPTY_FORM).map(k => [k, product[k] ?? ''])
        )}
  )
  const [userId, setUserId]               = useState(null)
  const [saving, setSaving]               = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]                 = useState('')
  const [pendingSave, setPendingSave]     = useState(null)
  const [promptMfr, setPromptMfr]         = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id))
  }, [])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function clearField(name) {
    setForm(f => ({ ...f, [name]: '' }))
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.sku.trim()) { setError('SKU is required.'); return }
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
        .select().single()
      if (err) { setError(err.message); setSaving(false) }
      else await checkAndPrompt(data, true, payload.manufacturer)
    } else {
      const { sku: _sku, ...patch } = payload
      const { data, error: err } = await supabase
        .from('products')
        .update(patch)
        .eq('id', product.id)
        .select().single()
      if (err) { setError(err.message); setSaving(false) }
      else await checkAndPrompt(data, false, payload.manufacturer)
    }
  }

  async function checkAndPrompt(data, wasNew, manufacturer) {
    if (manufacturer) {
      const { data: existing } = await supabase
        .from('companies').select('id').ilike('name', manufacturer).maybeSingle()
      if (!existing) {
        setPendingSave({ data, isNew: wasNew })
        setPromptMfr(manufacturer)
        setSaving(false)
        return
      }
    }
    onSaved(data, wasNew)
  }

  async function handleDelete() {
    setDeleting(true)
    const { error: err } = await supabase.from('products').delete().eq('id', product.id)
    if (err) { setError(err.message); setDeleting(false); setConfirmDelete(false) }
    else onDeleted(product.id)
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

        {/* Post-save company prompt */}
        {promptMfr && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✓</div>
            <div>
              <p className="text-gray-900 font-semibold">Product saved.</p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="font-medium text-gray-700">{promptMfr}</span> isn't in your Companies directory. Would you like to add their contact info?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => onSaved(pendingSave.data, pendingSave.isNew)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaved(pendingSave.data, pendingSave.isNew)
                  navigate(`/companies?name=${encodeURIComponent(promptMfr)}`)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Add Company
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`flex-1 overflow-y-auto px-6 py-5 space-y-4 ${promptMfr ? 'hidden' : ''}`}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          {/* SKU */}
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

          {/* Other core fields */}
          {FIELDS.map(({ name, label, type = 'text', multiline, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              {name === 'manufacturer' ? (
                <ManufacturerField
                  value={form.manufacturer}
                  onChange={val => setForm(f => ({ ...f, manufacturer: val }))}
                  companies={companies}
                />
              ) : multiline ? (
                <textarea
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <div className="relative">
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder ?? ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form[name] && (
                    <button
                      type="button"
                      onClick={() => clearField(name)}
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Cert documents — edit mode only (product needs an ID first) */}
          {!isNew && userId && (
            <CertDocSection
              product={product}
              userId={userId}
              onDocsChanged={onDocsChanged}
            />
          )}

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
        {!promptMfr && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-2">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isNew ? 'Cancel' : 'Close'}
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
            {!isNew && (
              <button
                type="button"
                onClick={() => window.open(`/export?ids=${product.id}`, '_blank')}
                className="w-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 text-xs font-medium py-1.5 rounded-lg transition-colors"
              >
                Export compliance packet →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Products page ────────────────────────────────────────────────────────────

export default function Products() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toggle, isSelected } = useAuditList()

  const [products, setProducts]             = useState([])
  const [companies, setCompanies]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [importing, setImporting]           = useState(false)
  const [importResult, setImportResult]     = useState(null)
  const [showSmartImport, setShowSmartImport] = useState(false)
  const [error, setError]                   = useState('')
  const [panel, setPanel]                   = useState(null)
  const VALID_STATUSES = ['valid', 'expiring', 'expired', 'missing', 'not-sellable']
  const [search, setSearch]             = useState(searchParams.get('search') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status')
    return s && VALID_STATUSES.includes(s) ? s : 'all'
  })
  const fileInputRef = useRef()

  // Sync filters when URL params change (from global search or alert links)
  useEffect(() => {
    const s = searchParams.get('search')
    if (s !== null) setSearch(s)
    const f = searchParams.get('status')
    if (f && VALID_STATUSES.includes(f)) setStatusFilter(f)
  }, [searchParams])

  useEffect(() => {
    fetchProducts()
    supabase.from('companies').select('id, name, type, custom_type').order('name')
      .then(({ data }) => setCompanies(data ?? []))
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, cert_documents(*)')
      .order('sku', { ascending: true })
    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }

  function handleSaved(saved, isNew) {
    setProducts(ps =>
      isNew
        ? [...ps, { ...saved, cert_documents: [] }].sort((a, b) => a.sku.localeCompare(b.sku))
        : ps.map(p => p.id === saved.id ? { ...saved, cert_documents: p.cert_documents } : p)
    )
    setPanel(null)
  }

  function handleDeleted(id) {
    setProducts(ps => ps.filter(p => p.id !== id))
    setPanel(null)
  }

  function handleDocsChanged(productId, updatedDocs) {
    setProducts(ps => ps.map(p =>
      p.id === productId ? { ...p, cert_documents: updatedDocs } : p
    ))
  }

  async function handleSmartImportSaved() {
    setShowSmartImport(false)
    setImportResult({ inserted: 1, skipped: [], unmappedHeaders: [] })
    await fetchProducts()
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

      const { data: upserted, error: upsertError } = await supabase
        .from('products')
        .upsert(records, { onConflict: 'user_id,sku' })
        .select('id, sku, cert_number, cert_scope, cert_issued_date, cert_expiration, issuing_body')

      if (upsertError) {
        setError(upsertError.message)
      } else {
        // Create/update cert_documents for rows that include cert data
        const certRows = (upserted ?? [])
          .filter(p => p.cert_number)
          .map(p => {
            const src = rows.find(r => r.sku === p.sku) ?? {}
            return {
              product_id:       p.id,
              user_id:          user.id,
              document_type:    'third_party_certificate',
              issuing_body:     normalizeIssuingBody(src.issuing_body ?? p.issuing_body),
              cert_number:      p.cert_number,
              cert_scope:       p.cert_scope,
              cert_issued_date: p.cert_issued_date,
              cert_expiration:  p.cert_expiration,
            }
          })

        if (certRows.length > 0) {
          await supabase
            .from('cert_documents')
            .upsert(certRows, { onConflict: 'product_id,cert_number', ignoreDuplicates: false })
        }

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
    if (statusFilter !== 'all') {
      const s = certStatus(p)
      const matches = statusFilter === 'not-sellable' ? (s === 'expired' || s === 'missing') : s === statusFilter
      if (!matches) return false
    }
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
          <button
            onClick={() => setShowSmartImport(true)}
            className="border border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Smart Import
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
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
            <option value="all">All</option>
            <option value="valid">{statusLabel('valid')}</option>
            <option value="expiring">{statusLabel('sellable')} — {statusLabel('expiring')}</option>
            <option value="not-sellable">{statusLabel('not-sellable')} — All</option>
            <option value="expired">{statusLabel('not-sellable')} — {statusLabel('expired')}</option>
            <option value="missing">{statusLabel('not-sellable')} — {statusLabel('missing')}</option>
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
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
                  <th className="px-4 py-3 w-8" />
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Part Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Manufacturer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">PO Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const selected = isSelected('product', p.id)
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggle({ type: 'product', id: p.id, label: p.sku, sublabel: p.description })}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900">{p.sku}</td>
                      <td className="px-4 py-3 text-gray-700">{p.part_number ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.description ?? '—'}</td>
                      <td className="px-4 py-3">
                        {p.manufacturer
                          ? <button onClick={() => navigate(`/companies?name=${encodeURIComponent(p.manufacturer)}`)} className="text-blue-600 hover:underline text-left text-sm">{p.manufacturer}</button>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.po_number ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-start flex-wrap gap-x-2 gap-y-1">
                          <SellableBadge product={p} />
                          {p.needs_review && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                              ⚠ Needs Review
                            </span>
                          )}
                          <DocCountBadge docs={p.cert_documents ?? []} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPanel(p)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over panel */}
      {panel && (
        <ProductPanel
          product={panel === 'new' ? null : panel}
          companies={companies}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onDocsChanged={handleDocsChanged}
        />
      )}

      {/* Smart Import modal */}
      {showSmartImport && (
        <SmartImportModal
          onClose={() => setShowSmartImport(false)}
          onSaved={handleSmartImportSaved}
        />
      )}
    </div>
  )
}
