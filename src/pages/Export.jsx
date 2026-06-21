import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const IB_LABEL = {
  NSF:           'NSF International',
  IAPMO:         'IAPMO',
  CSA_Group:     'CSA Group',
  UL:            'UL (Underwriters Labs)',
  Bureau_Veritas: 'Bureau Veritas',
  other:         'Other',
}

const DOC_TYPE_LABEL = {
  third_party_certificate:         'Third-Party Certificate',
  manufacturer_self_certification: 'Manufacturer Self-Certification',
  mill_test_report:                'Mill Test Report',
  other:                           'Other',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function certStatus(product) {
  const docs  = product.cert_documents ?? []
  if (docs.length === 0) return 'missing'
  const today = new Date().toISOString().split('T')[0]
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const active = docs.filter(d => !d.cert_expiration || d.cert_expiration >= today)
  if (active.length === 0) return 'expired'
  if (active.some(d => d.cert_expiration && d.cert_expiration <= in90)) return 'expiring'
  return 'valid'
}

function fmtDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${m}/${d}/${y}`
}

// ─── Inline styles ────────────────────────────────────────────────────────────
// Using inline styles throughout so the PDF output is self-contained
// and not dependent on Tailwind's print behaviour.

const SANS = 'system-ui, -apple-system, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocCard({ doc }) {
  const today      = new Date().toISOString().split('T')[0]
  const expired    = doc.cert_expiration && doc.cert_expiration < today
  const isSelfCert = doc.document_type === 'manufacturer_self_certification'

  return (
    <div style={{
      background: expired ? '#fef2f2' : '#f9fafb',
      border: `1px solid ${expired ? '#fca5a5' : '#e5e7eb'}`,
      borderRadius: '6px',
      padding: '10px 12px',
      fontFamily: SANS,
      fontSize: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <span style={{ fontWeight: '600', color: '#374151' }}>
            {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
          </span>
          {!isSelfCert && doc.issuing_body && (
            <span style={{ color: '#6b7280', marginLeft: '6px' }}>
              · {IB_LABEL[doc.issuing_body] ?? doc.issuing_body}
            </span>
          )}
          {isSelfCert && (
            <span style={{ color: '#b45309', marginLeft: '6px', fontStyle: 'italic' }}>
              · No third-party verification
            </span>
          )}
        </div>
        {doc.cert_expiration && (
          <span style={{ fontWeight: '600', color: expired ? '#dc2626' : '#374151', whiteSpace: 'nowrap' }}>
            {expired ? 'EXPIRED' : 'Exp.'} {fmtDate(doc.cert_expiration)}
          </span>
        )}
      </div>

      <div style={{ marginTop: '5px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
        {doc.cert_number    && <span>Cert #{doc.cert_number}</span>}
        {doc.cert_issued_date && <span>Issued {fmtDate(doc.cert_issued_date)}</span>}
        {doc.cert_scope     && <span style={{ color: '#9ca3af' }}>Scope: {doc.cert_scope}</span>}
      </div>
    </div>
  )
}

function ProductBlock({ product, isLast }) {
  const status   = certStatus(product)
  const sellable = status === 'valid' || status === 'expiring'
  const statusColor = sellable ? '#16a34a' : '#dc2626'

  const statusNote = {
    expiring: 'Cert expiring soon — still sellable',
    expired:  'Cert expired',
    missing:  'No cert on file',
  }[status]

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
              {product.sku}
            </span>
            {product.description && (
              <span style={{ fontFamily: SERIF, fontSize: '14px', color: '#374151' }}>
                {product.description}
              </span>
            )}
          </div>
          {(product.manufacturer || product.po_number) && (
            <div style={{ fontFamily: SANS, fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
              {[
                product.manufacturer && `Manufacturer: ${product.manufacturer}`,
                product.po_number    && `PO: ${product.po_number}`,
              ].filter(Boolean).join('  ·  ')}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', fontFamily: SANS, whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: statusColor }}>
            {sellable ? '● Sellable' : '● Not Sellable'}
          </div>
          {statusNote && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{statusNote}</div>
          )}
        </div>
      </div>

      {product.cert_documents.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '4px' }}>
          No compliance documents on file
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: SANS, fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Compliance Documents ({product.cert_documents.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {product.cert_documents.map(doc => <DocCard key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {!isLast && (
        <div style={{ marginTop: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '0' }} />
      )}
    </div>
  )
}

// ─── Export page ──────────────────────────────────────────────────────────────

export default function Export() {
  const [searchParams] = useSearchParams()
  const ids = (searchParams.get('ids') ?? '').split(',').filter(Boolean)

  const [products,    setProducts]    = useState([])
  const [companyName, setCompanyName] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  useEffect(() => {
    async function load() {
      if (ids.length === 0) { setLoading(false); return }

      const [{ data: userData }, { data: productData, error: pErr }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('products')
          .select('*, cert_documents(*)')
          .in('id', ids)
          .order('sku'),
      ])

      setCompanyName(userData.user?.user_metadata?.company_name ?? '')

      if (pErr) { setError(pErr.message); setLoading(false); return }

      // Sort each product's documents: non-expired first, then by expiration desc
      const today = new Date().toISOString().split('T')[0]
      const sorted = (productData ?? []).map(p => ({
        ...p,
        cert_documents: (p.cert_documents ?? []).sort((a, b) => {
          const aExp = a.cert_expiration ?? '9999-12-31'
          const bExp = b.cert_expiration ?? '9999-12-31'
          const aActive = aExp >= today ? 0 : 1
          const bActive = bExp >= today ? 0 : 1
          if (aActive !== bActive) return aActive - bActive
          return bExp.localeCompare(aExp)
        }),
      }))

      setProducts(sorted)
      setLoading(false)
    }
    load()
  }, [])

  // Auto-fire print dialog once data is ready
  useEffect(() => {
    if (!loading && products.length > 0) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [loading, products.length])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: SANS, color: '#6b7280', fontSize: '14px' }}>
        Preparing compliance report…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: SANS, color: '#dc2626' }}>
        Error loading products: {error}
      </div>
    )
  }

  if (ids.length === 0 || products.length === 0) {
    return (
      <div style={{ padding: '40px', fontFamily: SANS, color: '#6b7280', fontSize: '14px' }}>
        No products to export. Close this tab and select products from the Audit List.
      </div>
    )
  }

  const sellableCount    = products.filter(p => { const s = certStatus(p); return s === 'valid' || s === 'expiring' }).length
  const notSellableCount = products.length - sellableCount

  return (
    <div>
      {/* Screen-only toolbar (hidden when printing) */}
      <div className="print:hidden" style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: SANS, fontSize: '13px', color: '#6b7280' }}>
          <button onClick={() => window.close()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: '13px', padding: 0 }}>
            ← Close
          </button>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span>{products.length} SKU{products.length !== 1 ? 's' : ''} · {sellableCount} sellable</span>
        </div>
        <button
          onClick={() => window.print()}
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: SANS }}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Report body */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 48px', fontFamily: SERIF }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #111827' }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: '20px', fontWeight: '800', color: '#111827', letterSpacing: '-0.03em' }}>
              ClearShield
            </div>
            <div style={{ fontFamily: SANS, fontSize: '16px', fontWeight: '600', color: '#111827', marginTop: '2px' }}>
              Compliance Certification Packet
            </div>
            {companyName && (
              <div style={{ fontFamily: SANS, fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                {companyName}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontFamily: SANS, fontSize: '12px', color: '#6b7280' }}>
            <div>Generated {generatedAt}</div>
            <div style={{ marginTop: '4px' }}>{products.length} SKU{products.length !== 1 ? 's' : ''} included</div>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 18px', marginBottom: '32px', fontFamily: SANS }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Summary
          </div>
          <div style={{ display: 'flex', gap: '28px' }}>
            <div>
              <span style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a' }}>{sellableCount}</span>
              <span style={{ fontFamily: SANS, fontSize: '12px', color: '#6b7280', marginLeft: '6px' }}>Sellable</span>
            </div>
            <div>
              <span style={{ fontSize: '26px', fontWeight: '800', color: notSellableCount > 0 ? '#dc2626' : '#9ca3af' }}>{notSellableCount}</span>
              <span style={{ fontFamily: SANS, fontSize: '12px', color: '#6b7280', marginLeft: '6px' }}>Not Sellable</span>
            </div>
            <div>
              <span style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>{products.length}</span>
              <span style={{ fontFamily: SANS, fontSize: '12px', color: '#6b7280', marginLeft: '6px' }}>Total SKUs</span>
            </div>
          </div>
        </div>

        {/* Product blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {products.map((p, i) => (
            <ProductBlock key={p.id} product={p} isLast={i === products.length - 1} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontFamily: SANS, fontSize: '11px', color: '#9ca3af', lineHeight: '1.5' }}>
          <p>
            This report was generated by ClearShield on {generatedAt}. It reflects certification data on file at the time of generation.
            Verify all certifications against the issuing body's current certified product directory before relying on this document for regulatory purposes.
            This is not legal advice.
          </p>
          {companyName && (
            <p style={{ marginTop: '6px' }}>Prepared by: {companyName}</p>
          )}
        </div>
      </div>
    </div>
  )
}
