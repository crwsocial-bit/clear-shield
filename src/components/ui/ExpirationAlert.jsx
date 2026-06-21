import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const TODAY = new Date().toISOString().split('T')[0]
const IN_30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const IN_90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

function plural(n, word) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`
}

export default function ExpirationAlert() {
  const navigate   = useNavigate()
  const [counts, setCounts]     = useState(null)  // null = not yet loaded
  const [dismissed, setDismiss] = useState(
    () => sessionStorage.getItem('expirationAlertDismissed') === 'true'
  )

  useEffect(() => {
    if (dismissed) return

    async function load() {
      // Fetch all cert_documents (product_id + expiration only) so we can
      // correctly determine per-product status — a product with one expired
      // cert but another valid cert is still sellable and shouldn't show as "expired".
      const { data, error } = await supabase
        .from('cert_documents')
        .select('product_id, cert_expiration')

      if (error || !data || data.length === 0) return

      // Group expiration dates by product
      const byProduct = {}
      for (const { product_id, cert_expiration } of data) {
        if (!byProduct[product_id]) byProduct[product_id] = []
        byProduct[product_id].push(cert_expiration)
      }

      let expired = 0, expiring30 = 0, expiring90 = 0

      for (const expirations of Object.values(byProduct)) {
        // Docs with no expiration date never expire — always active
        const active = expirations.filter(e => !e || e >= TODAY)

        if (active.length === 0) {
          // Every doc for this product has lapsed
          expired++
          continue
        }

        // Find the soonest expiry among active dated docs
        const withDates = active.filter(Boolean).sort()
        const soonest   = withDates[0] ?? null

        if (soonest && soonest <= IN_30) expiring30++
        else if (soonest && soonest <= IN_90) expiring90++
        // else: valid and not expiring soon — no alert
      }

      if (expired > 0 || expiring30 > 0 || expiring90 > 0) {
        setCounts({ expired, expiring30, expiring90 })
      }
    }

    load()
  }, [dismissed])

  function dismiss() {
    sessionStorage.setItem('expirationAlertDismissed', 'true')
    setDismiss(true)
  }

  if (dismissed || !counts) return null

  const { expired, expiring30, expiring90 } = counts
  const isRed   = expired > 0
  const isAmber = !isRed && expiring30 > 0

  const theme = isRed
    ? { bar: 'bg-red-50 border-red-200',   text: 'text-red-800',   dot: 'bg-red-500' }
    : isAmber
    ? { bar: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' }
    : { bar: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-400' }

  // Build a concise message, most urgent first
  const parts = [
    expired    > 0 && `${plural(expired,    'SKU')} with all certs expired`,
    expiring30 > 0 && `${plural(expiring30, 'SKU')} expiring within 30 days`,
    expiring90 > 0 && `${plural(expiring90, 'SKU')} expiring within 90 days`,
  ].filter(Boolean)

  const linkStatus = isRed ? 'expired' : 'expiring'

  return (
    <div className={`border-b ${theme.bar} ${theme.text} px-6 py-2.5 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-2.5 text-sm min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
        <span className="font-medium truncate">{parts.join(' · ')}</span>
        <button
          onClick={() => navigate(`/products?status=${linkStatus}`)}
          className="underline underline-offset-2 font-semibold hover:no-underline shrink-0"
        >
          Review →
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="opacity-50 hover:opacity-100 text-xl leading-none shrink-0 transition-opacity"
      >
        &times;
      </button>
    </div>
  )
}
