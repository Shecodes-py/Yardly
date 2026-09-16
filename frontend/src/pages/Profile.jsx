import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateMe } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await updateMe({ bio })
      await refreshUser()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div className="page">
        <h2>Profile</h2>
        <div className="card">
          <strong>{user.first_name} {user.last_name}</strong>
          <p className="muted" style={{ margin: '4px 0' }}>{user.email}</p>
          <p className="muted" style={{ margin: '4px 0' }}>{user.phone_number}</p>
          <span className={user.status === 'VERIFIED' ? 'badge' : 'badge badge-warning'}>
            {user.status === 'VERIFIED' ? 'Verified Resident ✓' : user.status.replaceAll('_', ' ')}
          </span>
          {user.estate && <p className="muted" style={{ marginTop: 8 }}>{user.estate.name}</p>}
        </div>

        {user.worker_profile && (
          <div className="card">
            <strong>Worker stats</strong>
            <p style={{ margin: '6px 0' }}>
              <span className="stars">★ {user.worker_profile.average_rating}</span>{' '}
              <span className="muted">
                ({user.worker_profile.completed_jobs_count} jobs completed)
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="card">
          <div className="field">
            <label htmlFor="bio">Short bio</label>
            <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-small" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="muted" style={{ marginLeft: 8 }}>Saved</span>}
        </form>

        <button className="btn btn-secondary" onClick={handleLogout}>
          Log Out
        </button>
      </div>
      <BottomNav />
    </>
  )
}
