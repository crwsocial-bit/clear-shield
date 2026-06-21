import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuditList } from '../../lib/auditListContext'

export default function AuditListPanel() {
  const navigate = useNavigate()
  const { items, productItems, companyItems, count, clearSelection, panelOpen, setPanelOpen } = useAuditList()
  const [listName, setListName]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedId, setSavedId]     = useState(null)

  if (!panelOpen) return null

  function handleClose() {
    setPanelOpen(false)
    setListName('')
    setSaveError('')
    setSavedId(null)
  }

  async function handleSaveList() {
    if (!listName.trim()) { setSaveError('Enter a name for this list.'); return }
    setSaving(true)
    setSaveError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: list, error: listErr } = await supabase
      .from('audit_lists')
      .insert({ name: listName.trim(), user_id: user.id })
      .select().single()

    if (listErr) { setSaveError(listErr.message); setSaving(false); return }

    const rows = items.map(item => ({
      audit_list_id: list.id,
      entity_type:   item.type,
      entity_id:     item.id,
      label:         item.label    ?? null,
      sublabel:      item.sublabel ?? null,
    }))

    const { error: itemsErr } = await supabase.from('audit_list_items').insert(rows)
    if (itemsErr) { setSaveError(itemsErr.message); setSaving(false); return }

    setSaving(false)
    setSavedId(list.id)
    setListName('')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Audit List</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {count === 0 ? 'No items selected' : `${count} item${count !== 1 ? 's' : ''} selected`}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {count === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No items selected yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Use the checkboxes on Products or Companies to build your list.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {productItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Products ({productItems.length})
                  </p>
                  <div className="space-y-1">
                    {productItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-gray-50 text-sm">
                        <span className="font-mono text-xs text-gray-900 shrink-0">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-gray-400 truncate text-xs">{item.sublabel}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {companyItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Companies ({companyItems.length})
                  </p>
                  <div className="space-y-1">
                    {companyItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-gray-50 text-sm">
                        <span className="text-gray-900 shrink-0">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-gray-400 text-xs">{item.sublabel}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 space-y-3">
          {savedId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4 text-center">
              <p className="text-sm font-semibold text-green-800">List saved!</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { handleClose(); navigate('/audit-lists') }}
                  className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50"
                >
                  View Saved Lists
                </button>
                <button
                  onClick={() => { clearSelection(); handleClose() }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg"
                >
                  Clear &amp; Close
                </button>
              </div>
            </div>
          ) : count > 0 ? (
            <>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1.5">Save as named list</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={listName}
                    onChange={e => { setListName(e.target.value); setSaveError('') }}
                    placeholder='e.g. "Q2 Audit – Acme"'
                    onKeyDown={e => e.key === 'Enter' && handleSaveList()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveList}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { clearSelection(); handleClose() }}
                  className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => {
                    const ids = productItems.map(i => i.id)
                    if (ids.length === 0) return
                    window.open(`/export?ids=${ids.join(',')}`, '_blank')
                  }}
                  disabled={productItems.length === 0}
                  title={productItems.length === 0 ? 'Select products to export' : `Export ${productItems.length} product${productItems.length !== 1 ? 's' : ''}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Export Now →
                </button>
              </div>
              {productItems.length === 0 && companyItems.length > 0 && (
                <p className="text-xs text-gray-400 text-center">Select products (not just companies) to export a compliance packet.</p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Select items from Products or Companies to get started.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
