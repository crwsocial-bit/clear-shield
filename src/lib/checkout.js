import { supabase } from './supabaseClient'
import { stripePromise } from './stripe'

// supabase.functions.invoke() automatically attaches the current session's
// Authorization header, so the edge function can identify the caller.
export async function startCheckout(plan, interval = 'month') {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      plan,
      interval,
      success_url: `${window.location.origin}/billing?checkout=success`,
      cancel_url: `${window.location.origin}/billing?checkout=cancelled`,
    },
  })
  if (error) throw new Error(error.message ?? 'Could not start checkout')
  const sessionId = data?.data?.id
  if (!sessionId) throw new Error('No checkout session returned')

  const stripe = await stripePromise
  const { error: redirectError } = await stripe.redirectToCheckout({ sessionId })
  if (redirectError) throw new Error(redirectError.message)
}

// The billing portal has no Stripe.js redirect helper — the edge function's
// returned URL is a plain navigation.
export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { return_url: `${window.location.origin}/billing` },
  })
  if (error) throw new Error(error.message ?? 'Could not open billing portal')
  const url = data?.data?.url
  if (!url) throw new Error('No billing portal URL returned')
  window.location.href = url
}
