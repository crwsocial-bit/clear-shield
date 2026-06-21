import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function AuditListProvider({ children }) {
  const [selection, setSelection] = useState(new Map())
  const [panelOpen, setPanelOpen] = useState(false)

  function toggle(item) {
    const key = `${item.type}:${item.id}`
    setSelection(s => {
      const next = new Map(s)
      if (next.has(key)) next.delete(key)
      else next.set(key, item)
      return next
    })
  }

  function isSelected(type, id) {
    return selection.has(`${type}:${id}`)
  }

  function clearSelection() {
    setSelection(new Map())
  }

  function loadList(items) {
    const map = new Map()
    items.forEach(item => map.set(`${item.type}:${item.id}`, item))
    setSelection(map)
  }

  const items        = [...selection.values()]
  const count        = items.length
  const productItems = items.filter(i => i.type === 'product')
  const companyItems = items.filter(i => i.type === 'company')

  return (
    <Ctx.Provider value={{
      toggle, isSelected, clearSelection, loadList,
      items, count, productItems, companyItems,
      panelOpen, setPanelOpen,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuditList() {
  return useContext(Ctx)
}
