import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Shared by the Admin nav link, the /admin route guard, and SKU-limit
// enforcement (admins bypass limits in useSubscription.js + Products.jsx).
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) { setIsAdmin(false); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setIsAdmin(data?.is_admin ?? false)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { isAdmin, loading }
}
