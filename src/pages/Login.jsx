import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState('signin') // 'signin' | 'signup' | 'forgot'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ClearShield</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Compliance made clear.</p>
          <p className="text-gray-400 mt-1 text-xs">NSF/ANSI 372 Compliance Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {view === 'signin'  && <SignIn  onSwitch={setView} onDone={() => navigate('/')} />}
          {view === 'signup'  && <SignUp  onSwitch={setView} onDone={() => navigate('/')} />}
          {view === 'forgot'  && <Forgot  onSwitch={setView} />}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ClearShield · EPA Lead Free Rule Compliance
        </p>
      </div>
    </div>
  )
}

function SignIn({ onSwitch, onDone }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else onDone()
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
        {error && <ErrorBox message={error} />}
        <SubmitButton loading={loading} label="Sign in" loadingLabel="Signing in…" />
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <button onClick={() => onSwitch('forgot')} className="text-blue-600 hover:underline">
          Forgot password?
        </button>
        <button onClick={() => onSwitch('signup')} className="text-gray-500 hover:text-gray-700">
          Create an account
        </button>
      </div>
    </>
  )
}

function SignUp({ onSwitch, onDone }) {
  const [company,  setCompany]  = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: company.trim() } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-3">✓</p>
        <p className="text-gray-900 font-semibold">Check your email</p>
        <p className="text-gray-500 text-sm mt-2">
          We sent a confirmation link to <span className="font-medium">{email}</span>.
          Click it to activate your account, then come back to sign in.
        </p>
        <button onClick={() => onSwitch('signin')} className="mt-5 text-blue-600 text-sm hover:underline">
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Company name" type="text" value={company} onChange={setCompany} placeholder="Acme Waterworks Supply" autoComplete="organization" />
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="8+ characters" autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" />
        {error && <ErrorBox message={error} />}
        <SubmitButton loading={loading} label="Create account" loadingLabel="Creating account…" />
      </form>
      <div className="mt-5 text-center text-sm">
        <button onClick={() => onSwitch('signin')} className="text-gray-500 hover:text-gray-700">
          Already have an account? Sign in
        </button>
      </div>
    </>
  )
}

function Forgot({ onSwitch }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-3">✓</p>
        <p className="text-gray-900 font-semibold">Reset link sent</p>
        <p className="text-gray-500 text-sm mt-2">
          Check <span className="font-medium">{email}</span> for a password reset link.
        </p>
        <button onClick={() => onSwitch('signin')} className="mt-5 text-blue-600 text-sm hover:underline">
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset your password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        {error && <ErrorBox message={error} />}
        <SubmitButton loading={loading} label="Send reset link" loadingLabel="Sending…" />
      </form>
      <div className="mt-5 text-center text-sm">
        <button onClick={() => onSwitch('signin')} className="text-gray-500 hover:text-gray-700">
          Back to sign in
        </button>
      </div>
    </>
  )
}

function Field({ label, type, value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}
