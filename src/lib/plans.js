// Display/catalog info for the plans shown in-app (Billing page, upgrade prompts).
// The actual Stripe Price IDs never live here — the client only ever sends a
// plan key to the create-checkout-session edge function, which resolves the
// real price server-side. Enterprise has no self-serve checkout ("Contact Us").
export const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    skuLimit: 500,
    checkout: true,
  },
  pro: {
    key: 'pro',
    name: 'Professional',
    skuLimit: null, // unlimited
    checkout: true,
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    skuLimit: null, // unlimited
    checkout: false,
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
