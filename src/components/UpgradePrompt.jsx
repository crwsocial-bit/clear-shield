import { useNavigate } from 'react-router-dom'

export default function UpgradePrompt({ onClose, limit, count, planName }) {
  const navigate = useNavigate()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xl mx-auto mb-4">
            ⚠
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1.5">SKU limit reached</h2>
          <p className="text-sm text-gray-500 mb-5">
            Your <span className="font-medium text-gray-700">{planName}</span> plan allows up to{' '}
            <span className="font-medium text-gray-700">{limit}</span> SKUs, and you currently have{' '}
            <span className="font-medium text-gray-700">{count}</span>. Upgrade your plan to add more products.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              View plans
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
