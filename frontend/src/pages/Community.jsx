import { useCallback, useEffect, useState } from 'react'
import { createFeedPost, getCommunityFeed } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const CATEGORIES = [
  { id: '', label: 'All Feed' },
  { id: 'ANNOUNCEMENT', label: '📢 Announcements' },
  { id: 'LOST_FOUND', label: '🔍 Lost & Found' },
  { id: 'RECOMMENDATION', label: '⭐ Recommendations' },
  { id: 'EVENT', label: '🎉 Events' },
  { id: 'NOTICE', label: '📌 Notices' },
]

export default function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({ category: 'ANNOUNCEMENT', title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeCategory ? { category: activeCategory } : {}
      const data = await getCommunityFeed(params)
      setPosts(data)
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createFeedPost(form)
      setForm({ category: 'ANNOUNCEMENT', title: '', content: '' })
      setShowModal(false)
      loadFeed()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post to feed.')
    } finally {
      setSubmitting(false)
    }
  }

  const unverified = user && user.status !== 'VERIFIED'

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Community Hub</p>
            <h2 style={{ margin: '2px 0' }}>{user?.estate?.name || 'Estate Feed'}</h2>
          </div>
          <button
            className="btn btn-primary btn-small"
            disabled={unverified}
            onClick={() => setShowModal(true)}
          >
            + Post Announcement
          </button>
        </div>
      </div>

      <div className="page">
        {unverified && (
          <div className="card notice-card">
            🔒 Account status is <strong>{user?.status?.toLowerCase()}</strong>. Verify your estate membership to post notices.
          </div>
        )}

        <div className="tab-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && <div className="spinner" />}

        {!loading && posts.length === 0 && (
          <div className="empty-state">No announcements or feed posts yet. Be the first to share!</div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="card feed-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-category">{formatCategory(post.category)}</span>
              <span className="muted text-small">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <h3 style={{ margin: '8px 0 4px' }}>{post.title}</h3>
            <p className="feed-content">{post.content}</p>
            <div className="feed-author">
              <span className="avatar-initials">{post.author?.first_name?.[0] || 'U'}</span>
              <span>{post.author?.first_name} {post.author?.last_name}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Estate Post</h3>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="ANNOUNCEMENT">📢 Announcement</option>
                  <option value="LOST_FOUND">🔍 Lost & Found</option>
                  <option value="RECOMMENDATION">⭐ Recommendation</option>
                  <option value="EVENT">🎉 Event</option>
                  <option value="NOTICE">📌 Notice</option>
                </select>
              </div>
              <div className="field">
                <label>Title</label>
                <input
                  required
                  placeholder="e.g. Found black wallet near playground"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide full description..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Publish'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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

function formatCategory(cat) {
  const map = {
    ANNOUNCEMENT: '📢 Announcement',
    LOST_FOUND: '🔍 Lost & Found',
    RECOMMENDATION: '⭐ Recommendation',
    EVENT: '🎉 Event',
    NOTICE: '📌 Notice',
    GENERAL: '💬 General',
  }
  return map[cat] || cat
}
