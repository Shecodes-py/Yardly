import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getJobs } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import JobCard from '../components/JobCard'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = activeCategory ? { category: activeCategory } : {}
    getJobs(params)
      .then((data) => setJobs(data.results ?? data))
      .finally(() => setLoading(false))
  }, [activeCategory])

  const unverified = user && user.status !== 'VERIFIED'

  return (
    <>
      <div className="top-bar">
        <p className="muted" style={{ margin: 0 }}>
          Good {timeOfDay()}, {user?.first_name}
        </p>
        <h2 style={{ margin: '2px 0 14px' }}>What do you need done?</h2>
        <Link to="/post-task" className="btn btn-primary">
          Post a Task
        </Link>
      </div>

      <div className="page">
        {unverified && (
          <div className="card" style={{ background: '#fdf3e0', border: 'none' }}>
            Your estate membership is <strong>{user.estate?.verification_status?.toLowerCase()}</strong>.
            Posting and applying to tasks unlock once an estate admin verifies you.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
          <button
            className="btn btn-small"
            style={{
              background: activeCategory === null ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeCategory === null ? '#fff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="btn btn-small"
              style={{
                background: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeCategory === cat.id ? '#fff' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <h3 style={{ margin: '12px 0' }}>Available Near You</h3>
        {loading && <div className="spinner" />}
        {!loading && jobs.length === 0 && (
          <div className="empty-state">No open tasks right now. Check back soon.</div>
        )}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      <BottomNav />
    </>
  )
}

function timeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
