import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to="/home" replace />

  return (
    <div className="center-page">
      <h1 style={{ color: 'var(--color-primary)' }}>Yardly</h1>
      <p style={{ fontSize: 18, marginBottom: 32 }}>
        Get things done by trusted people in your community.
      </p>
      <Link to="/register" className="btn btn-primary" style={{ marginBottom: 12 }}>
        Get Started
      </Link>
      <Link to="/login" className="btn btn-secondary">
        I already have an account
      </Link>
    </div>
  )
}
