// Server-side plan catalog. Price IDs come from Supabase secrets (set via
// `supabase secrets set STRIPE_PRICE_STARTER=price_...`), never from the
// client — the client only ever sends a plan key like "starter" or "pro".
//
// Enterprise has no self-serve Stripe price — it's a "Contact Us" plan on the
// landing page, so it's intentionally absent here.

export type PlanKey = 'starter' | 'pro'
export type BillingInterval = 'month' | 'year'

export const PLAN_CATALOG: Record<PlanKey, { priceEnvVars: Record<BillingInterval, string>; skuLimit: number | null }> = {
  starter: {
    priceEnvVars: { month: 'STRIPE_PRICE_STARTER', year: 'STRIPE_PRICE_STARTER_ANNUAL' },
    skuLimit: 500,
  },
  pro: {
    priceEnvVars: { month: 'STRIPE_PRICE_PRO', year: 'STRIPE_PRICE_PRO_ANNUAL' },
    skuLimit: null, // null = unlimited
  },
}

export function resolvePriceId(plan: PlanKey, interval: BillingInterval): string | null {
  const entry = PLAN_CATALOG[plan]
  if (!entry) return null
  return Deno.env.get(entry.priceEnvVars[interval]) ?? null
}

// Reverse lookup used by the webhook: given a Stripe price ID (monthly OR
// annual), find which plan key + sku_limit it corresponds to. Without
// checking both interval env vars here, an annual checkout's price ID would
// never match and sku_limit would silently fail to be set on the
// subscription row.
export function planForPriceId(priceId: string): { plan: PlanKey; skuLimit: number | null } | null {
  for (const [plan, entry] of Object.entries(PLAN_CATALOG) as [PlanKey, typeof PLAN_CATALOG[PlanKey]][]) {
    for (const envVar of Object.values(entry.priceEnvVars)) {
      if (Deno.env.get(envVar) === priceId) {
        return { plan, skuLimit: entry.skuLimit }
      }
    }
  }
  return null
}
