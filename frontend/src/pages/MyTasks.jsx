import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyJobs } from '../api/resources'
import StatusBadge from '../components/StatusBadge'
import BottomNav from '../components/BottomNav'

export default function MyTasks() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyJobs()
      .then(setJobs)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page">
        <h2>My Tasks</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span className="badge">Posted by me</span>
          <Link to="/my-work" className="badge-muted badge" style={{ color: 'inherit' }}>
            My Work →
          </Link>
        </div>
        {loading && <div className="spinner" />}
        {!loading && jobs.length === 0 && (
          <div className="empty-state">
            You haven't posted a task yet.
            <div style={{ marginTop: 12 }}>
              <Link to="/post-task" className="btn btn-primary">
                Post a Task
              </Link>
            </div>
          </div>
        )}
        {jobs.map((job) => (
          <Link key={job.id} to={`/jobs/${job.id}`} className="card" style={{ display: 'block', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{job.title}</strong>
              <StatusBadge status={job.status} />
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              ₦{Number(job.budget).toLocaleString()} • {job.preferred_date}
            </p>
          </Link>
        ))}
      </div>
      <BottomNav />
    </>
  )
}
