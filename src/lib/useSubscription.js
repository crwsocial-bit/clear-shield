import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Shared by Products.jsx (SKU-limit enforcement) and Billing.jsx (plan display).
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading]           = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const [{ data: sub }, { count }] = await Promise.all([
      supabase.from('subscriptions').select('*').maybeSingle(),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ])
    setSubscription(sub ?? null)
    setProductCount(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { subscription, productCount, loading, refetch }
}

// null sku_limit means unlimited.
export function remainingSkuSlots(subscription, productCount) {
  if (!subscription || subscription.sku_limit == null) return Infinity
  return Math.max(0, subscription.sku_limit - productCount)
}

export function canAddSkus(subscription, productCount, numToAdd = 1) {
  return remainingSkuSlots(subscription, productCount) >= numToAdd
}
