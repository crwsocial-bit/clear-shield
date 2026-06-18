import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  if (!user) return null

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
      </div>

      <div className="space-y-6">
        <CompanyNameForm user={user} onUpdated={setUser} />
        <ChangePasswordForm />
      </div>
    </div>
  )
}

function CompanyNameForm({ user, onUpdated }) {
  const [name, setName]       = useState(user.user_metadata?.company_name ?? '')
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const timer = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { data, error: err } = await supabase.auth.updateUser({
      data: { company_name: name.trim() },
    })

    if (err) {
      setError(err.message)
    } else {
      onUpdated(data.user)
      setSuccess(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <Section title="Company Name" description="Appears on your compliance reports.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Acme Waterworks Supply"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error   && <ErrorBox message={error} />}
        {success && <p className="text-green-600 text-sm">Company name updated.</p>}
        <SaveButton saving={saving} />
      </form>
    </Section>
  )
}

function ChangePasswordForm() {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')
  const timer = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (next !== confirm) { setError('New passwords do not match.'); return }
    if (next.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setSaving(true)

    // Re-authenticate first to verify current password
    const { data: { user } } = await supabase.auth.getUser()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInErr) {
      setError('Current password is incorrect.')
      setSaving(false)
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    if (updateErr) {
      setError(updateErr.message)
    } else {
      setCurrent('')
      setNext('')
      setConfirm('')
      setSuccess(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <Section title="Change Password" description="You'll remain signed in after changing your password.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField label="Current password"  value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField label="New password"       value={next}    onChange={setNext}    autoComplete="new-password" placeholder="8+ characters" />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error   && <ErrorBox message={error} />}
        {success && <p className="text-green-600 text-sm">Password updated.</p>}
        <SaveButton saving={saving} />
      </form>
    </Section>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5 mb-4">{description}</p>
      {children}
    </div>
  )
}

function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
      {message}
    </div>
  )
}

function SaveButton({ saving }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
    >
      {saving ? 'Saving…' : 'Save changes'}
    </button>
  )
}
