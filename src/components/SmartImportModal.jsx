import { useRef, useState } from 'react'
import { Sparkles, Upload, ChevronDown, ChevronRight } from 'lucide-react'
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

function extractedToProductForm(p) {
  return {
    key: crypto.randomUUID(),
    sku: '',
    product_name:         p.product_name         ?? '',
    part_number:          p.part_number          ?? '',
    manufacturer:         p.manufacturer         ?? '',
    issuing_body:         normalizeIssuingBody(p.issuing_body),
    cert_number:          p.cert_number          ?? '',
    issue_date:           p.issue_date           ?? '',
    expiration_date:      p.expiration_date      ?? '',
    lead_content_percent: p.lead_content_percent != null ? String(p.lead_content_percent) : '',
    notes:                p.notes                ?? '',
    warnings:             Array.isArray(p.warnings) ? p.warnings : [],
  }
}

function ProductFields({ product, onChange, autoFocusSku }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          SKU <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">— enter your internal SKU</span>
        </label>
        <input
          type="text"
          value={product.sku}
          onChange={e => onChange('sku', e.target.value)}
          placeholder="e.g. BRS-1234"
          autoFocus={autoFocusSku}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Product Name / Description</label>
        <input
          type="text"
          value={product.product_name}
          onChange={e => onChange('product_name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Part Number</label>
          <input
            type="text"
            value={product.part_number}
            onChange={e => onChange('part_number', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturer</label>
          <input
            type="text"
            value={product.manufacturer}
            onChange={e => onChange('manufacturer', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Body</label>
        <select
          value={product.issuing_body}
          onChange={e => onChange('issuing_body', e.target.value)}
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
          value={product.cert_number}
          onChange={e => onChange('cert_number', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
          <input
            type="date"
            value={product.issue_date}
            onChange={e => onChange('issue_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Date</label>
          <input
            type="date"
            value={product.expiration_date}
            onChange={e => onChange('expiration_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Lead Content %</label>
        <input
          type="text"
          value={product.lead_content_percent}
          onChange={e => onChange('lead_content_percent', e.target.value)}
          placeholder="e.g. 0.25"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Scope</label>
        <textarea
          value={product.notes}
          onChange={e => onChange('notes', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  )
}

function ProductWarnings({ warnings }) {
  if (warnings.length === 0) return null
  return (
    <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-3">
      <p className="text-xs font-semibold text-yellow-800 mb-1.5">
        AI flagged the following issues — review before saving:
      </p>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-700">
            <span className="shrink-0 mt-px">⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SmartImportModal({ onClose, onSaved, remainingSlots = Infinity }) {
  const fileInputRef = useRef(null)
  const [file, setFile]               = useState(null)
  const [dragging, setDragging]       = useState(false)
  const [stage, setStage]             = useState('upload') // 'upload' | 'processing' | 'review'
  const [products, setProducts]       = useState([])
  const [expanded, setExpanded]       = useState({})
  const [documentWarnings, setDocumentWarnings] = useState([])
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
      const rawProducts = Array.isArray(d.products) ? d.products : []

      if (rawProducts.length === 0) {
        setProcessError('AI could not find any products in this document. Please try a different file.')
        setStage('upload')
        return
      }

      const formProducts = rawProducts.map(extractedToProductForm)
      setProducts(formProducts)
      setExpanded(Object.fromEntries(formProducts.map((p, i) => [p.key, i === 0])))
      setDocumentWarnings(Array.isArray(d.document_warnings) ? d.document_warnings : [])
      setStage('review')
    } catch (err) {
      setProcessError(err?.message ?? 'Something went wrong. Please try again.')
      setStage('upload')
    }
  }

  function updateProduct(key, field, value) {
    setProducts(prev => prev.map(p => (p.key === key ? { ...p, [field]: value } : p)))
  }

  function removeProduct(key) {
    setProducts(prev => prev.filter(p => p.key !== key))
    setExpanded(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function toggleExpanded(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    if (products.length === 0) {
      setError('No products to save.')
      return
    }
    const missingSku = products.find(p => !p.sku.trim())
    if (missingSku) {
      setError('Every product needs a SKU before saving.')
      return
    }
    if (products.length > remainingSlots) {
      setError(`This document has ${products.length} products, but your plan only has room for ${remainingSlots} more SKU${remainingSlots === 1 ? '' : 's'}. Remove some products or upgrade your plan.`)
      return
    }
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let sourceFilePath = null
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const uploadPath = `${user.id}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadErr } = await supabase.storage
          .from('cert-documents')
          .upload(uploadPath, file, { contentType: file.type })

        if (uploadErr) {
          console.error('Cert document file upload failed:', uploadErr)
        } else {
          sourceFilePath = uploadPath
        }
      }

      for (const p of products) {
        const { data: product, error: productErr } = await supabase
          .from('products')
          .insert({
            sku:          p.sku.trim(),
            part_number:  p.part_number.trim()  || null,
            description:  p.product_name.trim() || null,
            manufacturer: p.manufacturer.trim() || null,
            notes:        p.notes.trim()        || null,
            user_id:      user.id,
            needs_review: p.warnings.length > 0,
          })
          .select()
          .single()

        if (productErr) {
          setError(`${p.sku.trim()}: ${productErr.message}`)
          setSaving(false)
          return
        }

        let certNotes = p.notes.trim() || null
        if (p.lead_content_percent.trim()) {
          const leadNote = `Lead content: ${p.lead_content_percent.trim()}%`
          certNotes = certNotes ? `${certNotes}\n${leadNote}` : leadNote
        }

        const { error: certErr } = await supabase.from('cert_documents').insert({
          product_id:       product.id,
          user_id:          user.id,
          document_type:    'third_party_certificate',
          issuing_body:     p.issuing_body || null,
          cert_number:      p.cert_number.trim() || null,
          cert_issued_date: p.issue_date || null,
          cert_expiration:  p.expiration_date || null,
          notes:            certNotes,
          source_file_path: sourceFilePath,
        })

        if (certErr) {
          setError(`${p.sku.trim()}: cert document failed to save — ${certErr.message}`)
          setSaving(false)
          return
        }
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
                    {products.length > 1
                      ? `AI found ${products.length} products in this document — review each before saving.`
                      : 'AI extracted the fields below — review and correct before saving.'}
                  </p>
                </div>

                {documentWarnings.length > 0 && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-3">
                    <p className="text-xs font-semibold text-yellow-800 mb-1.5">
                      Document-level warnings:
                    </p>
                    <ul className="space-y-1">
                      {documentWarnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-700">
                          <span className="shrink-0 mt-px">⚠</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {products.length <= 1 ? (
                  products.map(p => (
                    <div key={p.key}>
                      <ProductWarnings warnings={p.warnings} />
                      <ProductFields
                        product={p}
                        onChange={(field, value) => updateProduct(p.key, field, value)}
                        autoFocusSku
                      />
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    {products.map((p, i) => (
                      <div key={p.key} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none"
                          onClick={() => toggleExpanded(p.key)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {expanded[p.key]
                              ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                            <span className="text-sm font-medium text-gray-900 shrink-0">Product {i + 1}</span>
                            <span className="text-xs text-gray-500 truncate">
                              {p.product_name || p.part_number || 'Untitled product'}
                            </span>
                            {p.warnings.length > 0 && (
                              <span className="shrink-0 text-[10px] font-medium bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                                {p.warnings.length} warning{p.warnings.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {!p.sku.trim() && (
                              <span className="shrink-0 text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                SKU needed
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); removeProduct(p.key) }}
                            className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>

                        {expanded[p.key] && (
                          <div className="px-4 py-4 border-t border-gray-200">
                            <ProductWarnings warnings={p.warnings} />
                            <ProductFields
                              product={p}
                              onChange={(field, value) => updateProduct(p.key, field, value)}
                              autoFocusSku={false}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                  onClick={() => { setStage('upload'); setError(''); setProducts([]); setExpanded({}); setDocumentWarnings([]) }}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || products.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : products.length > 1 ? 'Save All to ClearShield' : 'Save to ClearShield'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
