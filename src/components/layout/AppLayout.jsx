import Navbar from './Navbar'
import AuditListPanel from '../ui/AuditListPanel'
import ExpirationAlert from '../ui/ExpirationAlert'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ExpirationAlert />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
      <AuditListPanel />
    </div>
  )
}
