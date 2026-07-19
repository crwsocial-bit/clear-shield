// Server-side plan catalog. Price IDs come from Supabase secrets (set via
// `supabase secrets set STRIPE_PRICE_STARTER=price_...`), never from the
// client — the client only ever sends a plan key like "starter" or "pro".
//
// Enterprise has no self-serve Stripe price — it's a "Contact Us" plan on the
// landing page, so it's intentionally absent here.

export type PlanKey = 'starter' | 'pro'

export const PLAN_CATALOG: Record<PlanKey, { priceEnvVar: string; skuLimit: number | null }> = {
  starter: { priceEnvVar: 'STRIPE_PRICE_STARTER', skuLimit: 500 },
  pro:     { priceEnvVar: 'STRIPE_PRICE_PRO',      skuLimit: null }, // null = unlimited
}

export function resolvePriceId(plan: PlanKey): string | null {
  const entry = PLAN_CATALOG[plan]
  if (!entry) return null
  return Deno.env.get(entry.priceEnvVar) ?? null
}

// Reverse lookup used by the webhook: given a Stripe price ID, find which
// plan key + sku_limit it corresponds to.
export function planForPriceId(priceId: string): { plan: PlanKey; skuLimit: number | null } | null {
  for (const [plan, entry] of Object.entries(PLAN_CATALOG) as [PlanKey, typeof PLAN_CATALOG[PlanKey]][]) {
    if (Deno.env.get(entry.priceEnvVar) === priceId) {
      return { plan, skuLimit: entry.skuLimit }
    }
  }
  return null
}
