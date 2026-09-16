import { Link } from 'react-router-dom'

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="card" style={{ display: 'block', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong>{job.title}</strong>
        <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
          ₦{Number(job.budget).toLocaleString()}
        </span>
      </div>
      <div className="muted" style={{ margin: '6px 0' }}>
        {job.preferred_date} • {job.preferred_time?.slice(0, 5)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="badge">{job.category?.name}</span>
        <span className="muted">Posted {timeAgo(job.created_at)}</span>
      </div>
    </Link>
  )
}
