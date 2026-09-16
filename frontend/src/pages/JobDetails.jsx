import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  acceptApplication,
  applyToJob,
  cancelJob,
  completeJob,
  confirmJob,
  createJobReview,
  createReport,
  getJob,
  getJobApplications,
  getJobReviews,
  getUser,
  startJob,
  withdrawApplication,
} from '../api/resources'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import BottomNav from '../components/BottomNav'

function whatsappLink(phoneNumber, message) {
  const digits = phoneNumber.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function JobDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [reviews, setReviews] = useState([])
  const [counterpart, setCounterpart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [working, setWorking] = useState(false)

  const isOwner = job && user && job.owner_id === user.id
  const isAssignedWorker = job && user && job.assigned_worker_id === user.id
  const myApplication = applications.find((a) => a.worker.id === user?.id)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const jobData = await getJob(id)
      setJob(jobData)

      if (jobData.owner_id === user?.id && jobData.status === 'OPEN') {
        setApplications(await getJobApplications(id))
      }
      if (jobData.status === 'CLOSED') {
        setReviews(await getJobReviews(id))
      }
      const counterpartId =
        jobData.owner_id === user?.id ? jobData.assigned_worker_id : jobData.owner_id
      if (counterpartId && ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(jobData.status)) {
        setCounterpart(await getUser(counterpartId))
      }
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (fn) => {
    setActionError('')
    setWorking(true)
    try {
      await fn()
      await load()
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setWorking(false)
    }
  }

  const handleApply = (e) => {
    e.preventDefault()
    runAction(async () => {
      await applyToJob(id, { message: applyMessage })
      setApplyMessage('')
    })
  }

  const handleReview = (e) => {
    e.preventDefault()
    runAction(async () => {
      await createJobReview(id, { rating: Number(reviewRating), comment: reviewComment })
      setReviewComment('')
    })
  }

  const handleReport = () => {
    runAction(async () => {
      const reason = window.prompt(
        'Reason (HARASSMENT, FRAUD, UNSAFE_BEHAVIOUR, INAPPROPRIATE_TASK, THEFT, PAYMENT_DISPUTE, OTHER):'
      )
      if (!reason) return
      await createReport({
        reported_user: counterpart?.id ?? job.owner_id,
        job: job.id,
        reason,
        description: window.prompt('Describe what happened:') || '',
      })
      window.alert('Report submitted. An estate admin will review it.')
    })
  }

  if (loading || !job) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )
  }

  const alreadyReviewed = reviews.some((r) => r.reviewer === user?.id)

  return (
    <>
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ marginBottom: 4 }}>{job.title}</h2>
          <StatusBadge status={job.status} />
        </div>
        <p className="muted">{job.category?.name}</p>

        <div className="card">
          <p>{job.description}</p>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <span>
              <strong>Budget:</strong> ₦{Number(job.budget).toLocaleString()}
            </span>
            <span>
              <strong>When:</strong> {job.preferred_date} at {job.preferred_time?.slice(0, 5)}
            </span>
            <span>
              <strong>Location:</strong> {job.exact_location || job.approximate_location}
            </span>
            {job.required_skills && (
              <span>
                <strong>Skills:</strong> {job.required_skills}
              </span>
            )}
          </div>
        </div>

        {actionError && <p className="error-text">{actionError}</p>}

        {counterpart && (
          <div className="card">
            <strong>{isOwner ? 'Assigned worker' : 'Task owner'}</strong>
            <p style={{ margin: '6px 0' }}>{counterpart.first_name} {counterpart.last_name}</p>
            <a
              className="btn btn-secondary btn-small"
              href={whatsappLink(counterpart.phone_number, `Hi, about the task "${job.title}" on Yardly`)}
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
          </div>
        )}

        {/* Owner: OPEN -> review applicants */}
        {isOwner && job.status === 'OPEN' && (
          <div>
            <h3>Applicants ({applications.length})</h3>
            {applications.length === 0 && <p className="muted">No applications yet.</p>}
            {applications.map((app) => (
              <div className="card" key={app.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{app.worker.first_name} {app.worker.last_name}</strong>
                  <span className="stars">★ {app.worker.worker_profile?.average_rating ?? '—'}</span>
                </div>
                <p className="muted">{app.worker.worker_profile?.completed_jobs_count ?? 0} jobs completed</p>
                {app.message && <p>{app.message}</p>}
                <button
                  className="btn btn-primary btn-small"
                  disabled={working}
                  onClick={() => runAction(() => acceptApplication(app.id))}
                >
                  Assign Task
                </button>
              </div>
            ))}
            <button className="btn btn-danger" disabled={working} onClick={() => runAction(() => cancelJob(id))}>
              Cancel Task
            </button>
          </div>
        )}

        {/* Owner: ASSIGNED/IN_PROGRESS -> cancel */}
        {isOwner && ['ASSIGNED', 'IN_PROGRESS'].includes(job.status) && (
          <button className="btn btn-danger" disabled={working} onClick={() => runAction(() => cancelJob(id))}>
            Cancel Task
          </button>
        )}

        {/* Owner: COMPLETED -> confirm */}
        {isOwner && job.status === 'COMPLETED' && (
          <div>
            <button
              className="btn btn-primary"
              disabled={working}
              onClick={() => runAction(() => confirmJob(id))}
              style={{ marginBottom: 8 }}
            >
              Confirm Completion
            </button>
            <button className="btn btn-secondary" disabled={working} onClick={handleReport}>
              Report a Problem
            </button>
          </div>
        )}

        {/* Worker: not applied, job open */}
        {!isOwner && job.status === 'OPEN' && !myApplication && (
          <form onSubmit={handleApply}>
            <div className="field">
              <label htmlFor="applyMessage">Message to the resident</label>
              <textarea
                id="applyMessage"
                rows={3}
                placeholder="I can do this around 4:30pm. I've handled similar jobs before."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={working}>
              Apply for this Task
            </button>
          </form>
        )}

        {!isOwner && myApplication && myApplication.status === 'PENDING' && (
          <div className="card">
            <p>Your application is pending.</p>
            <button
              className="btn btn-secondary btn-small"
              disabled={working}
              onClick={() => runAction(() => withdrawApplication(myApplication.id))}
            >
              Withdraw Application
            </button>
          </div>
        )}

        {/* Assigned worker actions */}
        {isAssignedWorker && job.status === 'ASSIGNED' && (
          <button className="btn btn-primary" disabled={working} onClick={() => runAction(() => startJob(id))}>
            Start Task
          </button>
        )}
        {isAssignedWorker && job.status === 'IN_PROGRESS' && (
          <button className="btn btn-primary" disabled={working} onClick={() => runAction(() => completeJob(id))}>
            Mark as Completed
          </button>
        )}
        {isAssignedWorker && job.status === 'COMPLETED' && (
          <p className="muted">Waiting for the resident to confirm completion.</p>
        )}

        {/* Reviews after close */}
        {job.status === 'CLOSED' && (isOwner || isAssignedWorker) && !alreadyReviewed && (
          <form onSubmit={handleReview} className="card">
            <h3>Leave a review</h3>
            <div className="field">
              <label htmlFor="rating">Rating</label>
              <select id="rating" value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="comment">Comment</label>
              <textarea id="comment" rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={working}>
              Submit Review
            </button>
          </form>
        )}

        {reviews.length > 0 && (
          <div>
            <h3>Reviews</h3>
            {reviews.map((r) => (
              <div className="card" key={r.id}>
                <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p className="muted">{r.reviewer_name}</p>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  )
}
