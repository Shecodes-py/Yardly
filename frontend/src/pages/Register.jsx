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
      navigate('/home')
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
      <h2>Join your estate</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        You'll need the invite code from your estate management to join.
      </p>
      <form onSubmit={handleSubmit}>
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
            placeholder="+234..."
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
