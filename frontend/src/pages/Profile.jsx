import { useState } from 'react'
import { Link } from 'react-router-dom'
import { joinEstate } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [unitAddress, setUnitAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await joinEstate(inviteCode, unitAddress)
      await refreshUser()
      setShowJoinModal(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid estate invite code.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="top-bar">
        <p className="muted" style={{ margin: 0 }}>Account Settings</p>
        <h2 style={{ margin: '2px 0' }}>{user?.first_name} {user?.last_name}</h2>
      </div>

      <div className="page">
        <div className="card profile-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar-large">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{user?.first_name} {user?.last_name}</h3>
              <p className="muted text-small" style={{ margin: '2px 0' }}>{user?.email}</p>
              <p className="muted text-small" style={{ margin: '2px 0' }}>📞 {user?.phone_number}</p>
              <span className={`status-pill status-${user?.status?.toLowerCase()}`} style={{ marginTop: 6 }}>
                {user?.status} RESIDENT
              </span>
            </div>
          </div>
        </div>

        {/* ESTATE MEMBERSHIP CARD */}
        <div className="card">
          <h4 style={{ margin: '0 0 6px' }}>Current Estate</h4>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            {user?.estate?.name || 'No Estate Joined'}
          </p>
          <p className="muted text-small" style={{ margin: '4px 0 10px' }}>
            Verification status: <strong>{user?.estate?.verification_status || 'PENDING'}</strong>
          </p>
          <button className="btn btn-secondary btn-small" onClick={() => setShowJoinModal(true)}>
            🔄 Join Estate / Update Unit Address
          </button>
        </div>

        {/* WORKER STATS */}
        {user?.worker_profile && (
          <div className="card">
            <h4 style={{ margin: '0 0 6px' }}>Tasker Stats</h4>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <span className="muted text-small">Completed Jobs</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user.worker_profile.completed_jobs_count || 0}</div>
              </div>
              <div>
                <span className="muted text-small">Average Rating</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>★ {user.worker_profile.average_rating || '5.0'}</div>
              </div>
            </div>
          </div>
        )}

        {/* SHORTCUT LINKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <Link to="/my-tasks" className="btn btn-secondary" style={{ textAlign: 'left' }}>
            📋 My Posted Tasks
          </Link>
          <Link to="/my-work" className="btn btn-secondary" style={{ textAlign: 'left' }}>
            🛠️ My Assigned Work & Bids
          </Link>
          <button className="btn btn-danger" onClick={logout} style={{ marginTop: 12 }}>
            Log Out
          </button>
        </div>
      </div>

      {/* JOIN ESTATE MODAL */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Join Estate</h3>
            <form onSubmit={handleJoin}>
              <div className="field">
                <label>Estate Invite Code</label>
                <input required placeholder="Enter your estate invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
              </div>
              <div className="field">
                <label>House / Flat Address (Optional)</label>
                <input placeholder="e.g. House 12, Block 4" value={unitAddress} onChange={(e) => setUnitAddress(e.target.value)} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Joining...' : 'Join Estate'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}
