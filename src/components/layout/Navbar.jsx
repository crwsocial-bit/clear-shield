import { useEffect, useRef, useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuditList } from '../../lib/auditListContext'

function SearchBox() {
  const navigate = useNavigate()
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState(null)  // null = closed
  const [loading, setLoading]   = useState(false)
  const ref                     = useRef(null)
  const timeoutRef              = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setResults(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    clearTimeout(timeoutRef.current)
    if (!query.trim()) { setResults(null); return }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()
      const [{ data: products }, { data: companies }] = await Promise.all([
        supabase.from('products')
          .select('id, sku, description, manufacturer')
          .or(`sku.ilike.%${q}%,description.ilike.%${q}%,part_number.ilike.%${q}%,manufacturer.ilike.%${q}%`)
          .limit(6),
        supabase.from('companies')
          .select('id, name, type')
          .ilike('name', `%${q}%`)
          .limit(4),
      ])
      setResults({ products: products ?? [], companies: companies ?? [] })
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeoutRef.current)
  }, [query])

  function goTo(path) {
    navigate(path)
    setQuery('')
    setResults(null)
  }

  const hasResults = results && (results.products.length > 0 || results.companies.length > 0)

  return (
    <div className="relative w-64" ref={ref}>
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.trim() && setResults(r => r)}
          placeholder="Search products, companies…"
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-base leading-none"
          >
            &times;
          </button>
        )}
      </div>

      {(results || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
          )}

          {!loading && results && !hasResults && (
            <p className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</p>
          )}

          {!loading && results?.products.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Products</p>
              {results.products.map(p => (
                <button
                  key={p.id}
                  onClick={() => goTo(`/products?search=${encodeURIComponent(p.sku)}`)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="font-mono text-xs text-gray-900 shrink-0">{p.sku}</span>
                  {p.description && (
                    <span className="text-xs text-gray-500 truncate">{p.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && results?.companies.length > 0 && (
            <div className={results?.products.length > 0 ? 'border-t border-gray-100' : ''}>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Companies</p>
              {results.companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => goTo(`/companies/${c.id}`)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-sm text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { count, setPanelOpen } = useAuditList()
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const menuRef         = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const companyName = user?.user_metadata?.company_name
  const initials = companyName
    ? companyName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const navLink = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      {/* Logo */}
      <div className="shrink-0">
        <span className="text-lg font-bold text-gray-900">ClearShield</span>
        <p className="text-xs text-gray-400 leading-none mt-0.5">Compliance made clear.</p>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <NavLink to="/" end className={navLink}>Dashboard</NavLink>
        <NavLink to="/products" className={navLink}>Products</NavLink>
        <NavLink to="/companies" className={navLink}>Companies</NavLink>
        <NavLink to="/audit-lists" className={navLink}>Audit Lists</NavLink>
        <NavLink to="/reports" className={navLink}>Reports</NavLink>
        <NavLink to="/compliance" className={navLink}>Compliance</NavLink>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <SearchBox />
      </div>

      {/* Audit list button */}
      <button
        onClick={() => setPanelOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${
          count > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {count > 0 ? (
          <>
            List
            <span className="bg-white text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {count}
            </span>
          </>
        ) : (
          'List'
        )}
      </button>

      {/* User menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </div>
          {companyName && (
            <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">{companyName}</span>
          )}
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
            <div className="px-4 py-2.5 border-b border-gray-100">
              {companyName && <p className="text-sm font-medium text-gray-900 truncate">{companyName}</p>}
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <NavLink to="/settings" onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Account Settings
            </NavLink>
            <button onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
