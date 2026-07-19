import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { planLabel, skuLimitLabel } from '../lib/plans'

const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise']

const STATUS_STYLES = {
  active:   'bg-green-100 text-green-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? '—'}
    </span>
  )
}

function EditUserModal({ row, onClose, onSaved }) {
  const [plan, setPlan]         = useState(row.plan ?? 'free')
  const [unlimited, setUnlimited] = useState(row.sku_limit == null)
  const [skuLimit, setSkuLimit] = useState(row.sku_limit ?? 0)
  const [isAdmin, setIsAdmin]   = useState(row.is_admin ?? false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')

    const { data, error: err } = await supabase.functions.invoke('admin-update-user', {
      body: {
        target_user_id: row.user_id,
        plan,
        sku_limit: unlimited ? null : Number(skuLimit),
        is_admin: isAdmin,
      },
    })

    if (err) {
      setError(err.message ?? 'Failed to update user')
      setSaving(false)
      return
    }
    if (data?.error) {
      setError(data.error)
      setSaving(false)
      return
    }

    onSaved({ ...row, plan, sku_limit: unlimited ? null : Number(skuLimit), is_admin: isAdmin })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-500 mt-0.5">{row.email}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <select
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VALID_PLANS.map(p => (
                  <option key={p} value={p}>{planLabel(p)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SKU Limit</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={skuLimit}
                  disabled={unlimited}
                  onChange={e => setSkuLimit(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={e => setUnlimited(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  Unlimited
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={e => setIsAdmin(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Admin access
            </label>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Admin() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)

  async function fetchRows() {
    setLoading(true)
    setError('')
    const [{ data: profiles, error: profilesErr }, { data: subs, error: subsErr }] = await Promise.all([
      supabase.from('profiles').select('user_id, email, is_admin').order('email'),
      supabase.from('subscriptions').select('user_id, plan, sku_limit, status, current_period_end'),
    ])

    if (profilesErr || subsErr) {
      setError(profilesErr?.message ?? subsErr?.message ?? 'Failed to load users')
      setLoading(false)
      return
    }

    const subsByUser = new Map((subs ?? []).map(s => [s.user_id, s]))
    const merged = (profiles ?? []).map(p => ({
      user_id: p.user_id,
      email: p.email,
      is_admin: p.is_admin,
      plan: subsByUser.get(p.user_id)?.plan ?? 'free',
      sku_limit: subsByUser.get(p.user_id)?.sku_limit ?? 0,
      status: subsByUser.get(p.user_id)?.status ?? null,
    }))

    setRows(merged)
    setLoading(false)
  }

  useEffect(() => { fetchRows() }, [])

  function handleSaved(updated) {
    setRows(rs => rs.map(r => r.user_id === updated.user_id ? updated : r))
    setEditing(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user plans, SKU limits, and admin access.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU Limit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Admin</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{row.email}</td>
                    <td className="px-4 py-3 text-gray-700">{planLabel(row.plan)}</td>
                    <td className="px-4 py-3 text-gray-700">{skuLimitLabel(row.sku_limit)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      {row.is_admin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Admin</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditing(row)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <EditUserModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
