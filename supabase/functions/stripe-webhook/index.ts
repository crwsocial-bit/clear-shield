import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.108.2'
import { planForPriceId } from '../_shared/plans.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

// Deno has no synchronous Node crypto — signature verification must go
// through the async subtle-crypto provider.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Maps Stripe subscription statuses onto our narrower enum (active/canceled/past_due).
function mapStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'canceled' | 'past_due' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due'
    default:
      return 'canceled'
  }
}

async function upsertFromSubscription(subscription: Stripe.Subscription, userIdHint?: string) {
  const priceId = subscription.items.data[0]?.price?.id
  const mapped = priceId ? planForPriceId(priceId) : null

  const userId = userIdHint ?? subscription.metadata?.supabase_user_id
  if (!userId) {
    console.error('No supabase_user_id on subscription', subscription.id)
    return
  }

  if (!mapped) {
    console.error('Unrecognized Stripe price on subscription', subscription.id, priceId)
    return
  }

  const currentPeriodEnd = subscription.current_period_end

  const { error } = await adminClient
    .from('subscriptions')
    .update({
      stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      plan: mapped.plan,
      status: mapStatus(subscription.status),
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      sku_limit: mapped.skuLimit,
    })
    .eq('user_id', userId)

  if (error) console.error('Failed to upsert subscription row:', error)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) {
    console.error('No supabase_user_id on deleted subscription', subscription.id)
    return
  }

  const { error } = await adminClient
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      sku_limit: 0,
      stripe_subscription_id: null,
      current_period_end: null,
    })
    .eq('user_id', userId)

  if (error) console.error('Failed to reset subscription row on delete:', error)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing stripe-signature header', { status: 400 })

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET, undefined, cryptoProvider)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertFromSubscription(subscription, session.client_reference_id ?? undefined)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertFromSubscription(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('Error handling webhook event:', event.type, err)
    return new Response('Internal error handling event', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
