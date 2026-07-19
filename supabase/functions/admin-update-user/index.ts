import { createClient } from 'npm:@supabase/supabase-js@2.108.2'
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise']

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonError('Method not allowed', 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Missing Authorization header', 401)

    // Identify the caller from their own JWT first...
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !caller) return jsonError('Not authenticated', 401)

    // ...then re-check admin status server-side via service role. Never trust
    // a client-asserted "I'm an admin" — RLS on profiles would let the caller
    // read their own row either way, but this check must hold even if a
    // future policy change or bug loosens that.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: callerProfile, error: callerProfileErr } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('user_id', caller.id)
      .maybeSingle()

    if (callerProfileErr || !callerProfile?.is_admin) {
      return jsonError('Forbidden — admin access required', 403)
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId = body.target_user_id
    if (typeof targetUserId !== 'string' || !targetUserId) {
      return jsonError('target_user_id is required')
    }

    const hasPlan = Object.prototype.hasOwnProperty.call(body, 'plan')
    const hasSkuLimit = Object.prototype.hasOwnProperty.call(body, 'sku_limit')
    const hasIsAdmin = Object.prototype.hasOwnProperty.call(body, 'is_admin')

    if (hasPlan && !VALID_PLANS.includes(body.plan)) {
      return jsonError(`plan must be one of: ${VALID_PLANS.join(', ')}`)
    }
    if (hasSkuLimit && body.sku_limit !== null && !Number.isInteger(body.sku_limit)) {
      return jsonError('sku_limit must be an integer or null (unlimited)')
    }
    if (hasIsAdmin && typeof body.is_admin !== 'boolean') {
      return jsonError('is_admin must be a boolean')
    }

    const results: Record<string, unknown> = {}

    if (hasPlan || hasSkuLimit) {
      const patch: Record<string, unknown> = {}
      if (hasPlan) patch.plan = body.plan
      if (hasSkuLimit) patch.sku_limit = body.sku_limit

      const { data, error } = await adminClient
        .from('subscriptions')
        .update(patch)
        .eq('user_id', targetUserId)
        .select()
        .maybeSingle()

      if (error) return jsonError(`Failed to update subscription: ${error.message}`, 500)
      results.subscription = data
    }

    if (hasIsAdmin) {
      const { data, error } = await adminClient
        .from('profiles')
        .update({ is_admin: body.is_admin })
        .eq('user_id', targetUserId)
        .select()
        .maybeSingle()

      if (error) return jsonError(`Failed to update profile: ${error.message}`, 500)
      results.profile = data
    }

    return jsonOk(results)
  } catch (err) {
    console.error('admin-update-user error:', err)
    return jsonError('Internal server error', 500)
  }
})
