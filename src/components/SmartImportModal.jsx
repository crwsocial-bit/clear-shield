import { useRef, useState } from 'react'
import { Sparkles, Upload } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const ISSUING_BODIES = [
  { value: 'NSF',            label: 'NSF International' },
  { value: 'IAPMO',          label: 'IAPMO' },
  { value: 'CSA_Group',      label: 'CSA Group' },
  { value: 'UL',             label: 'UL (Underwriters Labs)' },
  { value: 'Bureau_Veritas', label: 'Bureau Veritas' },
  { value: 'other',          label: 'Other' },
]

function normalizeIssuingBody(raw) {
  if (!raw) return ''
  const s = raw.toLowerCase()
  if (s.includes('nsf')) return 'NSF'
  if (s.includes('iapmo')) return 'IAPMO'
  if (s.includes('csa')) return 'CSA_Group'
  if (s.includes('underwriter') || (s.startsWith('ul') && s.length < 4)) return 'UL'
  if (s.includes('bureau') || s.includes('veritas')) return 'Bureau_Veritas'
  return 'other'
}

const EMPTY_REVIEW = {
  sku: '',
  product_name: '',
  part_number: '',
  manufacturer: '',
  issuing_body: '',
  cert_number: '',
  issue_date: '',
  expiration_date: '',
  lead_content_percent: '',
  notes: '',
}

export default function SmartImportModal({ onClose, onSaved }) {
  const fileInputRef = useRef(null)
  const [file, setFile]               = useState(null)
  const [dragging, setDragging]       = useState(false)
  const [stage, setStage]             = useState('upload') // 'upload' | 'processing' | 'review'
  const [form, setForm]               = useState(EMPTY_REVIEW)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [processError, setProcessError] = useState('')

  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/jpg']

  function handleFileSelect(f) {
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setProcessError('Please upload a PDF, PNG, JPG, or WEBP file.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setProcessError('File too large. Maximum size is 10MB.')
      return
    }
    setProcessError('')
    setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  async function handleProcess() {
    if (!file) return
    setStage('processing')
    setProcessError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const fd = new FormData()
      fd.append('file', file)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/smart-import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: fd,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setProcessError(result.error ?? 'Failed to process document. Please try again.')
        setStage('upload')
        return
      }

      const d = result.data ?? {}
      setForm({
        sku: '',
        product_name:         d.product_name         ?? '',
        part_number:          d.part_number          ?? '',
        manufacturer:         d.manufacturer         ?? '',
        issuing_body:         normalizeIssuingBody(d.issuing_body),
        cert_number:          d.cert_number          ?? '',
        issue_date:           d.issue_date           ?? '',
        expiration_date:      d.expiration_date      ?? '',
        lead_content_percent: d.lead_content_percent != null ? String(d.lead_content_percent) : '',
        notes:                d.notes                ?? '',
      })
      setStage('review')
    } catch (err) {
      setProcessError(err?.message ?? 'Something went wrong. Please try again.')
      setStage('upload')
    }
  }

  async function handleSave() {
    if (!form.sku.trim()) {
      setError('SKU is required.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: product, error: productErr } = await supabase
        .from('products')
        .insert({
          sku:          form.sku.trim(),
          part_number:  form.part_number.trim()  || null,
          description:  form.product_name.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
          notes:        form.notes.trim()        || null,
          user_id:      user.id,
        })
        .select()
        .single()

      if (productErr) {
        setError(productErr.message)
        setSaving(false)
        return
      }

      const hasCertData = form.cert_number || form.issuing_body || form.issue_date || form.expiration_date
      if (hasCertData) {
        let certNotes = form.notes.trim() || null
        if (form.lead_content_percent.trim()) {
          const leadNote = `Lead content: ${form.lead_content_percent.trim()}%`
          certNotes = certNotes ? `${certNotes}\n${leadNote}` : leadNote
        }

        await supabase.from('cert_documents').insert({
          product_id:       product.id,
          user_id:          user.id,
          document_type:    'third_party_certificate',
          issuing_body:     form.issuing_body || null,
          cert_number:      form.cert_number.trim() || null,
          cert_issued_date: form.issue_date || null,
          cert_expiration:  form.expiration_date || null,
          notes:            certNotes,
        })
      }

      onSaved()
    } catch (err) {
      setError(err?.message ?? 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Smart Import</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── Upload stage ── */}
            {stage === 'upload' && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a compliance certificate and AI will extract the product and certification details automatically.
                </p>

                {processError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {processError}
                  </div>
                )}

                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors select-none ${
                    dragging
                      ? 'border-blue-400 bg-blue-50'
                      : file
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={e => handleFileSelect(e.target.files?.[0])}
                  />
                  <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-green-500' : 'text-gray-400'}`} />
                  {file ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(0)} KB · click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, or WEBP · max 10MB</p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Processing stage ── */}
            {stage === 'processing' && (
              <div className="flex flex-col items-center justify-center py-14 gap-4">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Reading document…</p>
                  <p className="text-xs text-gray-500 mt-1">AI is extracting certification details</p>
                </div>
              </div>
            )}

            {/* ── Review stage ── */}
            {stage === 'review' && (
              <>
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-700 font-medium">
                    AI extracted the fields below — review and correct before saving.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SKU <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-1">— enter your internal SKU</span>
                    </label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                      placeholder="e.g. BRS-1234"
                      autoFocus
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Name / Description</label>
                    <input
                      type="text"
                      value={form.product_name}
                      onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Part Number</label>
                      <input
                        type="text"
                        value={form.part_number}
                        onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturer</label>
                      <input
                        type="text"
                        value={form.manufacturer}
                        onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cert Number</label>
                    <input
                      type="text"
                      value={form.cert_number}
                      onChange={e => setForm(f => ({ ...f, cert_number: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={form.issue_date}
                        onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={form.expiration_date}
                        onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Lead Content %</label>
                    <input
                      type="text"
                      value={form.lead_content_percent}
                      onChange={e => setForm(f => ({ ...f, lead_content_percent: e.target.value }))}
                      placeholder="e.g. 0.25"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Scope</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            {stage === 'upload' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!file}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Process Document
                </button>
              </div>
            )}

            {stage === 'review' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStage('upload'); setError('') }}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : 'Save to ClearShield'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
