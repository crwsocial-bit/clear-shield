// Display/catalog info for the plans shown in-app (Billing page, upgrade prompts).
// The actual Stripe Price IDs never live here — the client only ever sends a
// plan key to the create-checkout-session edge function, which resolves the
// real price server-side. Enterprise has no self-serve checkout ("Contact Us").
export const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    skuLimit: 10,
    checkout: true,
    monthlyPrice: 697,        // USD/mo, billed monthly
    annualPrice: 752760,      // USD cents, yearly total when billed annually
    annualMonthly: 627.30,    // USD/mo equivalent when billed annually
  },
  pro: {
    key: 'pro',
    name: 'Professional',
    skuLimit: 25,
    checkout: true,
    monthlyPrice: 1197,
    annualPrice: 1292760,
    annualMonthly: 1077.30,
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    skuLimit: null, // unlimited
    checkout: false,
    monthlyPrice: null,
    annualPrice: null,
    annualMonthly: null,
  },
}

export const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise']

export function planLabel(planKey) {
  if (planKey === 'free') return 'No Active Plan'
  return PLANS[planKey]?.name ?? planKey
}

export function skuLimitLabel(limit) {
  return limit == null ? 'Unlimited' : String(limit)
}

export function formatUSD(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

// Computed from the plan's own numbers rather than hardcoded, so it stays
// correct if monthly/annual pricing ever changes independently.
export function annualSavingsPercent(plan) {
  if (!plan.monthlyPrice || !plan.annualPrice) return null
  const annualIfBilledMonthly = plan.monthlyPrice * 12
  const annualTotal = plan.annualPrice / 100
  return Math.round((1 - annualTotal / annualIfBilledMonthly) * 100)
}
