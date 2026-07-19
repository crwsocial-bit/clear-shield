import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.108.2'
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts'
import { resolvePriceId, type PlanKey } from '../_shared/plans.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonError('Method not allowed', 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Missing Authorization header', 401)

    // Client bound to the caller's JWT — used only to identify who's asking.
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => ({}))
    const plan = body.plan as PlanKey
    const successUrl = typeof body.success_url === 'string' ? body.success_url : null
    const cancelUrl = typeof body.cancel_url === 'string' ? body.cancel_url : null

    if (plan !== 'starter' && plan !== 'pro') {
      return jsonError('Invalid plan. Must be "starter" or "pro".')
    }
    if (!successUrl || !cancelUrl) {
      return jsonError('success_url and cancel_url are required')
    }

    const priceId = resolvePriceId(plan)
    if (!priceId) {
      console.error(`No Stripe price configured for plan "${plan}"`)
      return jsonError('This plan is not currently available for checkout.', 500)
    }

    // Service-role client for reading/writing the subscriptions row (RLS has
    // no authenticated-write policy — only service role can touch it).
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await adminClient
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
    })

    if (!session.url) return jsonError('Failed to create checkout session', 500)

    return jsonOk({ id: session.id, url: session.url })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return jsonError('Internal server error', 500)
  }
})
