import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSubscription } from '../lib/useSubscription'
import { PLANS, planLabel, skuLimitLabel, formatUSD, annualSavingsPercent } from '../lib/plans'
import { startCheckout, openBillingPortal } from '../lib/checkout'

const STATUS_STYLES = {
  active:    'bg-green-100 text-green-800',
  past_due:  'bg-yellow-100 text-yellow-800',
  canceled:  'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function UsageBar({ used, limit }) {
  const unlimited = limit == null
  const pct = unlimited ? 0 : Math.min(100, limit === 0 ? 100 : (used / limit) * 100)
  const danger = !unlimited && used >= limit

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-gray-600">SKU usage</span>
        <span className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {used} of {skuLimitLabel(limit)} used
        </span>
      </div>
      {!unlimited && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function CurrentPlanCard({ subscription, productCount, onManageBilling, managingBilling }) {
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Current Plan</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{planLabel(subscription?.plan)}</p>
        </div>
        <StatusBadge status={subscription?.status} />
      </div>

      <div className="space-y-4">
        <UsageBar used={productCount} limit={subscription?.sku_limit ?? 0} />

        <div className="text-sm text-gray-600">
          {renewalDate ? (
            <span>Renews on <span className="font-medium text-gray-900">{renewalDate}</span></span>
          ) : (
            <span className="text-gray-400">No active subscription</span>
          )}
        </div>
      </div>

      {subscription?.stripe_customer_id && (
        <button
          type="button"
          onClick={onManageBilling}
          disabled={managingBilling}
          className="mt-5 w-full border border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {managingBilling ? 'Opening…' : 'Manage billing'}
        </button>
      )}
    </div>
  )
}

const PLAN_FEATURES = {
  starter: ['Up to 10 SKUs', 'Unlimited cert documents', 'Red/Green compliance dashboard', 'CSV bulk import', 'Email support'],
  pro: ['Up to 25 SKUs', 'Everything in Starter', '30/60/90-day expiration alerts', 'One-click audit exports', 'Audit lists & saved lists', 'Priority support'],
  enterprise: ['Everything in Professional', 'Multi-user access', 'Custom issuing body configuration', 'Dedicated onboarding', 'SLA guarantee'],
}

function BillingIntervalToggle({ billingInterval, onChange }) {
  const savings = annualSavingsPercent(PLANS.starter)

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange('month')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          billingInterval === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('year')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          billingInterval === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Annual
        {savings != null && (
          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
            Save {savings}%
          </span>
        )}
      </button>
    </div>
  )
}

function PlanPrice({ plan, billingInterval }) {
  if (plan.monthlyPrice == null) return null

  if (billingInterval === 'year') {
    return (
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          {formatUSD(plan.annualMonthly)}<span className="text-sm font-normal text-gray-500">/mo</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">billed annually ({formatUSD(plan.annualPrice / 100)}/yr)</p>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <p className="text-3xl font-bold text-gray-900">
        {formatUSD(plan.monthlyPrice)}<span className="text-sm font-normal text-gray-500">/mo</span>
      </p>
    </div>
  )
}

function PlanCard({ planKey, currentPlan, onSelect, checkingOut, billingInterval }) {
  const plan = PLANS[planKey]
  const isCurrent = currentPlan === planKey

  return (
    <div className={`rounded-xl border p-6 flex flex-col ${isCurrent ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{skuLimitLabel(plan.skuLimit)} SKUs</p>

      {plan.checkout ? (
        <PlanPrice plan={plan} billingInterval={billingInterval} />
      ) : (
        <p className="text-2xl font-bold text-gray-900 mb-4">Custom</p>
      )}

      <ul className="space-y-2 mb-6 flex-1">
        {PLAN_FEATURES[planKey].map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <span className="w-full text-center py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700">
          Current Plan
        </span>
      ) : plan.checkout ? (
        <button
          type="button"
          onClick={() => onSelect(planKey, billingInterval)}
          disabled={checkingOut}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {checkingOut ? 'Redirecting…' : 'Select Plan'}
        </button>
      ) : (
        <a
          href="mailto:sales@clearshield.io?subject=Enterprise%20plan"
          className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          Contact Us
        </a>
      )}
    </div>
  )
}

export default function Billing() {
  const [searchParams] = useSearchParams()
  const { subscription, productCount, loading, refetch } = useSubscription()
  const [checkingOutPlan, setCheckingOutPlan]   = useState(null)
  const [managingBilling, setManagingBilling]   = useState(false)
  const [error, setError]                       = useState('')
  // Named to avoid shadowing the global setInterval() used below for polling.
  const [billingInterval, setBillingInterval]   = useState('month')

  const checkoutState = searchParams.get('checkout') // 'success' | 'cancelled' | null

  // The webhook may take a moment to land after Stripe redirects back —
  // poll briefly so the plan updates without a manual refresh.
  useEffect(() => {
    if (checkoutState !== 'success') return
    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      refetch()
      if (attempts >= 5) clearInterval(interval)
    }, 2000)
    return () => clearInterval(interval)
  }, [checkoutState, refetch])

  async function handleSelectPlan(planKey, interval) {
    setError('')
    setCheckingOutPlan(planKey)
    try {
      await startCheckout(planKey, interval)
    } catch (err) {
      setError(err.message ?? 'Could not start checkout. Please try again.')
      setCheckingOutPlan(null)
    }
  }

  async function handleManageBilling() {
    setError('')
    setManagingBilling(true)
    try {
      await openBillingPortal()
    } catch (err) {
      setError(err.message ?? 'Could not open billing portal. Please try again.')
      setManagingBilling(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your ClearShield plan and subscription.</p>
      </div>

      {checkoutState === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          Checkout complete — your plan will update within a few seconds.
        </div>
      )}
      {checkoutState === 'cancelled' && (
        <div className="mb-6 bg-gray-50 border border-gray-200 text-gray-600 text-sm px-4 py-3 rounded-lg">
          Checkout was cancelled — no changes were made.
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="mb-8">
            <CurrentPlanCard
              subscription={subscription}
              productCount={productCount}
              onManageBilling={handleManageBilling}
              managingBilling={managingBilling}
            />
          </div>

          <div className="mb-4 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Upgrade / Downgrade</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Switching plans takes effect immediately via the Stripe checkout flow.
              </p>
            </div>
            <BillingIntervalToggle billingInterval={billingInterval} onChange={setBillingInterval} />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {['starter', 'pro', 'enterprise'].map(planKey => (
              <PlanCard
                key={planKey}
                planKey={planKey}
                currentPlan={subscription?.plan}
                onSelect={handleSelectPlan}
                checkingOut={checkingOutPlan === planKey}
                billingInterval={billingInterval}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
