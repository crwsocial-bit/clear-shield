import { supabase } from './supabaseClient'

// supabase.functions.invoke() automatically attaches the current session's
// Authorization header, so the edge function can identify the caller.
//
// Stripe removed stripe.js's client-side redirectToCheckout(sessionId) as of
// 2025-09-30 (https://docs.stripe.com/changelog/clover/2025-09-30/remove-redirect-to-checkout).
// Since Stripe.js is loaded from Stripe's CDN at runtime, this broke
// regardless of the pinned @stripe/stripe-js package version — navigating to
// the session's own url is the current supported approach.
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
  const url = data?.data?.url
  if (!url) throw new Error('No checkout URL returned')
  window.location.href = url
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
