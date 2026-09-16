import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../api/resources'
import BottomNav from '../components/BottomNav'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  const handleClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    if (n.related_job) navigate(`/jobs/${n.related_job}`)
  }

  return (
    <>
      <div className="page">
        <h2>Activity</h2>
        {loading && <div className="spinner" />}
        {!loading && notifications.length === 0 && (
          <div className="empty-state">Nothing here yet.</div>
        )}
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className="card"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: n.read ? 'var(--color-surface)' : '#eaf6f0',
              cursor: n.related_job ? 'pointer' : 'default',
            }}
          >
            <strong>{n.title}</strong>
            {n.body && <p className="muted" style={{ margin: '4px 0 0' }}>{n.body}</p>}
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 11 }}>
              {new Date(n.created_at).toLocaleString()}
            </p>
          </button>
        ))}
      </div>
      <BottomNav />
    </>
  )
}
