import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Shared by Products.jsx (SKU-limit enforcement) and Billing.jsx (plan display).
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading]           = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubscription(null)
      setProductCount(0)
      setLoading(false)
      return
    }
    // Admins can read every row via RLS, so this must stay scoped to the
    // caller's own subscription explicitly — otherwise .maybeSingle() would
    // throw once more than one row comes back.
    const [{ data: sub }, { count }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ])
    setSubscription(sub ?? null)
    setProductCount(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { subscription, productCount, loading, refetch }
}

// null sku_limit means unlimited. Admins bypass SKU limits entirely.
export function remainingSkuSlots(subscription, productCount, isAdmin = false) {
  if (isAdmin || !subscription || subscription.sku_limit == null) return Infinity
  return Math.max(0, subscription.sku_limit - productCount)
}

export function canAddSkus(subscription, productCount, numToAdd = 1, isAdmin = false) {
  return remainingSkuSlots(subscription, productCount, isAdmin) >= numToAdd
}
