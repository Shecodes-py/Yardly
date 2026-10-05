import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset, confirmPasswordReset } from '../api/resources'
import { Brand } from '../components/ResidentLayout'

export default function PasswordReset() {
  const [confirming, setConfirming] = useState(false)
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    setError('')
    if (confirming && password !== confirmation) { setError('Your passwords do not match.'); return }
    setBusy(true)
    try {
      const result = confirming ? await confirmPasswordReset({ email, code, password }) : await requestPasswordReset(email)
      if (confirming) setMessage(result.detail)
      else setConfirming(true)
      setPassword(''); setConfirmation('')
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Could not reach Yardly. Please try again.')
    } finally { setBusy(false) }
  }
  return <div className="center-page"><Link to="/" aria-label="Yardly home"><Brand /></Link><h1 style={{ fontSize: 26 }}>{confirming ? 'Check your email' : 'Forgot your password?'}</h1><p className="muted">{confirming ? `If an account exists for ${email}, we’ve sent a six-digit code. Enter it below and choose a new password. The code expires in 10 minutes.` : 'Enter your account email and we’ll send you a verification code.'}</p>
    {message ? <div role="status"><p>{message}</p><Link className="btn btn-primary" to="/login">Back to sign in</Link></div> : <form onSubmit={submit}>
      {confirming ? <><div className="field"><label htmlFor="reset-code">Verification code</label><input id="reset-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></div><div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></div><div className="field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div></> : <div className="field"><label htmlFor="reset-email">Email</label><input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>}
      {error && <p className="error-text" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : confirming ? 'Reset password' : 'Send verification code'}</button>
      {confirming && <p><button type="button" className="btn" disabled={busy} onClick={() => { setConfirming(false); setCode(''); setError('') }}>Request a new code</button></p>}
    </form>}{!message && <p><Link to="/login">Back to sign in</Link></p>}</div>
}
