import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  password: '',
  invite_code: '',
  role: 'RESIDENT',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const message = data ? Object.values(data).flat().join(' ') : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="center-page">
      <h2>Join your neighbourhood</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Select your account role and enter your estate invite code to register.
      </p>

      <form onSubmit={handleSubmit}>
        {/* ROLE SELECTION CARDS */}
        <div className="field">
          <label>Select Your Account Role</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
            <button
              type="button"
              className={`btn ${form.role === 'RESIDENT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 4px', fontSize: 12, flexDirection: 'column' }}
              onClick={() => setForm({ ...form, role: 'RESIDENT' })}
            >
              <span style={{ fontSize: 18 }}>👤</span>
              <span>Resident</span>
            </button>
            <button
              type="button"
              className={`btn ${form.role === 'GATE_SECURITY' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 4px', fontSize: 12, flexDirection: 'column' }}
              onClick={() => setForm({ ...form, role: 'GATE_SECURITY' })}
            >
              <span style={{ fontSize: 18 }}>🛡️</span>
              <span>Security</span>
            </button>

            <button
              type="button"
              className={`btn ${form.role === 'ESTATE_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 4px', fontSize: 12, flexDirection: 'column' }}
              onClick={() => setForm({ ...form, role: 'ESTATE_ADMIN' })}
            >
              <span style={{ fontSize: 18 }}>👑</span>
              <span>Admin</span>
            </button>
          </div>
          {form.role === 'GATE_SECURITY' && (
            <p className="text-small muted" style={{ color: '#b45309' }}>
              🔒 Security Guard accounts require Estate Admin approval before gate access is granted.
            </p>
          )}
          {form.role === 'RESIDENT' && (
            <p className="text-small muted" style={{ color: '#158052' }}>
              📋 Residents complete a quick Household Audit after signup before unlocking gate access.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="first_name">First name</label>
          <input id="first_name" required value={form.first_name} onChange={update('first_name')} />
        </div>
        <div className="field">
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" required value={form.last_name} onChange={update('last_name')} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label htmlFor="phone_number">Phone number</label>
          <input
            id="phone_number"
            type="tel"
            required
            placeholder="08012345678"
            value={form.phone_number}
            onChange={update('phone_number')}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={update('password')}
          />
        </div>
        <div className="field">
          <label htmlFor="invite_code">Estate invite code</label>
          <input
            id="invite_code"
            required
            style={{ textTransform: 'uppercase' }}
            value={form.invite_code}
            onChange={update('invite_code')}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
