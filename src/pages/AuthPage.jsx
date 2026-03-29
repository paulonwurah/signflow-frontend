import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode = 'login' }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn, signUp }      = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const from                    = location.state?.from?.pathname || '/dashboard'
  const isLogin                 = mode === 'login'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        navigate(from, { replace: true })
      } else {
        await signUp(email, password)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.logo}>Sign<span style={{ color: '#2563EB' }}>Flow</span></Link>
        <h1 style={styles.heading}>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p style={styles.sub}>{isLogin ? 'Sign in to your SignFlow account' : 'Start closing deals faster'}</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isLogin ? '••••••••' : 'Min. 8 characters'} required minLength={8} />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Sign in →' : 'Create account →'}
          </button>
        </form>

        <p style={styles.switch}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/signup' : '/login'} style={styles.switchLink}>
            {isLogin ? 'Sign up free' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F2', padding: '2rem', fontFamily: 'DM Sans, sans-serif' },
  card: { background: '#fff', border: '1px solid #E8E5DE', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420 },
  logo: { fontFamily: 'Instrument Serif, serif', fontSize: '1.4rem', fontStyle: 'italic', color: '#1A1916', textDecoration: 'none', display: 'block', marginBottom: '2rem' },
  heading: { fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.25rem', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' },
  sub: { fontSize: 14, color: '#6B6860', marginBottom: '1.75rem' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '10px 14px', border: '1px solid #D4D0C8', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans, sans-serif', color: '#1A1916', background: '#FAFAF8', outline: 'none' },
  btn: { background: '#1A1916', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 4 },
  switch: { textAlign: 'center', fontSize: 13, color: '#6B6860', marginTop: '1.5rem' },
  switchLink: { color: '#2563EB', textDecoration: 'none', fontWeight: 500 },
}
