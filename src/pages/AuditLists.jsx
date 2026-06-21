import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuditList } from '../lib/auditListContext'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditLists() {
  const navigate = useNavigate()
  const { loadList, setPanelOpen } = useAuditList()
  const [lists, setLists]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId]   = useState(null)

  useEffect(() => { fetchLists() }, [])

  async function fetchLists() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_lists')
      .select('*, audit_list_items(id, entity_type, entity_id, label, sublabel)')
      .order('created_at', { ascending: false })
    setLists(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await supabase.from('audit_lists').delete().eq('id', id)
    setLists(ls => ls.filter(l => l.id !== id))
    setDeletingId(null)
    setConfirmId(null)
  }

  function handleReopen(list) {
    const items = (list.audit_list_items ?? []).map(item => ({
      type:     item.entity_type,
      id:       item.entity_id,
      label:    item.label,
      sublabel: item.sublabel,
    }))
    loadList(items)
    setPanelOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Audit Lists</h1>
        <p className="text-gray-500 text-sm mt-1">
          Named lists you've saved for audits, customer requests, or recurring exports
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-900 font-medium">No saved lists yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Select products or companies using the checkboxes, then save them as a named list.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Go to Products
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contents</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Saved</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lists.map(list => {
                const allItems     = list.audit_list_items ?? []
                const productCount = allItems.filter(i => i.entity_type === 'product').length
                const companyCount = allItems.filter(i => i.entity_type === 'company').length
                const parts = [
                  productCount > 0 && `${productCount} product${productCount !== 1 ? 's' : ''}`,
                  companyCount > 0 && `${companyCount} compan${companyCount !== 1 ? 'ies' : 'y'}`,
                ].filter(Boolean)

                return (
                  <tr key={list.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{list.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {allItems.length === 0
                        ? <span className="text-gray-400">Empty</span>
                        : <span>{parts.join(', ')}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(list.created_at)}</td>
                    <td className="px-4 py-3">
                      {confirmId === list.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">Delete this list?</span>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(list.id)}
                            disabled={deletingId === list.id}
                            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:text-red-300"
                          >
                            {deletingId === list.id ? 'Deleting…' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleReopen(list)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Re-open
                          </button>
                          <button
                            onClick={() => setConfirmId(list.id)}
                            className="text-xs text-gray-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
