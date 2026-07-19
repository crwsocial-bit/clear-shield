import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.108.2'
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts'

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

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => ({}))
    const returnUrl = typeof body.return_url === 'string' ? body.return_url : null
    if (!returnUrl) return jsonError('return_url is required')

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return jsonError('No billing account found. Subscribe to a plan first.', 404)
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    })

    return jsonOk({ url: portalSession.url })
  } catch (err) {
    console.error('create-portal-session error:', err)
    return jsonError('Internal server error', 500)
  }
})
