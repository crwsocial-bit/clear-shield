import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Navbar() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold text-gray-900">ClearShield</span>
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
            to="/reports"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Reports
          </NavLink>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Sign out
      </button>
    </nav>
  )
}
