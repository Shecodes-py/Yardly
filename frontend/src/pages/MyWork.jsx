import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyApplications, getMyWork } from '../api/resources'
import StatusBadge from '../components/StatusBadge'
import BottomNav from '../components/BottomNav'

export default function MyWork() {
  const [assignedJobs, setAssignedJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyWork(), getMyApplications()])
      .then(([jobs, apps]) => {
        setAssignedJobs(jobs)
        setApplications(apps.filter((a) => a.status === 'PENDING'))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page">
        <h2>My Work</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link to="/my-tasks" className="badge-muted badge" style={{ color: 'inherit' }}>
            ← My Tasks
          </Link>
          <span className="badge">Work I'm doing</span>
        </div>
        {loading && <div className="spinner" />}

        {!loading && (
          <>
            <h3>Assigned to me</h3>
            {assignedJobs.length === 0 && <p className="muted">Nothing here yet.</p>}
            {assignedJobs.map((job) => (
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

            <h3 style={{ marginTop: 20 }}>Pending applications</h3>
            {applications.length === 0 && <p className="muted">No pending applications.</p>}
            {applications.map((app) => (
              <Link
                key={app.id}
                to={`/jobs/${app.job.id}`}
                className="card"
                style={{ display: 'block', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{app.job.title}</strong>
                  <StatusBadge status={app.status} />
                </div>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  ₦{Number(app.job.budget).toLocaleString()} • {app.job.preferred_date}
                </p>
              </Link>
            ))}
          </>
        )}
      </div>
      <BottomNav />
    </>
  )
}
