import { useEffect, useRef, useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Navbar() {
  const navigate = useNavigate()
  const [user, setUser]         = useState(null)
  const [open, setOpen]         = useState(false)
  const menuRef                 = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Close dropdown when clicking outside
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

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div>
          <span className="text-lg font-bold text-gray-900">ClearShield</span>
          <p className="text-xs text-gray-400 leading-none mt-0.5">Compliance made clear.</p>
        </div>
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Products
          </NavLink>
          <NavLink
            to="/companies"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Companies
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Reports
          </NavLink>
          <NavLink
            to="/compliance"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Compliance
          </NavLink>
        </div>
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </div>
          {companyName && (
            <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">
              {companyName}
            </span>
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
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Account Settings
            </NavLink>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
