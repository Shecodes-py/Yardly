import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  createBusinessProfile,
  createClassifiedItem,
  getBusinessCategories,
  getBusinesses,
  getClassifieds,
  getJobs,
} from '../api/resources'
import JobCard from '../components/JobCard'
import BottomNav from '../components/BottomNav'

function whatsappLink(phoneNumber, message) {
  const digits = (phoneNumber || '').replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function Services() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(['tasks', 'businesses', 'classifieds'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'tasks') // 'tasks' | 'businesses' | 'classifieds'

  const [loading, setLoading] = useState(true)

  // Data states
  const [tasks, setTasks] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [businessCategories, setBusinessCategories] = useState([])
  const [classifieds, setClassifieds] = useState([])

  // Modal controls
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [showClassifiedModal, setShowClassifiedModal] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [bizForm, setBizForm] = useState({
    name: '', category: '', tagline: '', description: '', phone_number: '', whatsapp_number: '', opening_hours: '', address_or_unit: ''
  })
  const [classifiedForm, setClassifiedForm] = useState({
    title: '', description: '', price: '', category: 'FURNITURE', condition: 'USED', contact_phone: ''
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'tasks') {
        const data = await getJobs()
        setTasks(data)
      } else if (tab === 'businesses') {
        const [bizData, catsData] = await Promise.all([getBusinesses(), getBusinessCategories()])
        setBusinesses(bizData)
        setBusinessCategories(catsData)
      } else if (tab === 'classifieds') {
        const data = await getClassifieds()
        setClassifieds(data)
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateBusiness = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createBusinessProfile(bizForm)
      setShowBusinessModal(false)
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not register business.')
    }
  }

  const handleCreateClassified = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createClassifiedItem(classifiedForm)
      setShowClassifiedModal(false)
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post item.')
    }
  }

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Estate Services</p>
            <h2 style={{ margin: '2px 0' }}>Marketplace & Vendors</h2>
          </div>
          {tab === 'tasks' && (
            <Link to="/post-task" className="btn btn-primary btn-small">
              + Post Task
            </Link>
          )}
          {tab === 'businesses' && (
            <button className="btn btn-primary btn-small" onClick={() => setShowBusinessModal(true)}>
              + List Business
            </button>
          )}
          {tab === 'classifieds' && (
            <button className="btn btn-primary btn-small" onClick={() => setShowClassifiedModal(true)}>
              + Sell / Giveaway
            </button>
          )}
        </div>

        {/* 3 Sub-tabs */}
        <div className="segment-control" style={{ marginTop: 12 }}>
          <button className={`segment ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
            🛠️ Tasks
          </button>
          <button className={`segment ${tab === 'businesses' ? 'active' : ''}`} onClick={() => setTab('businesses')}>
            🏬 Vendors & Ads
          </button>
          <button className={`segment ${tab === 'classifieds' ? 'active' : ''}`} onClick={() => setTab('classifieds')}>
            🛍️ Buy & Sell
          </button>
        </div>
      </div>

      <div className="page">
        {loading && <div className="spinner" />}

        {/* TASKS TAB */}
        {!loading && tab === 'tasks' && (
          <div>
            {tasks.length === 0 ? (
              <div className="empty-state">No active task requests right now.</div>
            ) : (
              tasks.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        )}

        {/* BUSINESSES TAB */}
        {!loading && tab === 'businesses' && (
          <div>
            {businesses.length === 0 && <div className="empty-state">No local business profiles yet.</div>}
            
            {businesses.map((biz) => (
              <div key={biz.id} className={`card ${biz.is_promoted ? 'promoted-card' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {biz.is_promoted && <span className="badge badge-ad">FEATURED AD</span>}
                    <h3 style={{ margin: '4px 0 2px' }}>{biz.name}</h3>
                    <p className="muted text-small">{biz.category?.name} • {biz.address_or_unit || 'In Estate'}</p>
                  </div>
                  <span className="stars">★ {biz.average_rating > 0 ? biz.average_rating : 'New'}</span>
                </div>
                {biz.tagline && <p className="tagline">{biz.tagline}</p>}
                <p className="text-small">{biz.description}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <a
                    className="btn btn-secondary btn-small"
                    href={whatsappLink(biz.whatsapp_number || biz.phone_number, `Hi ${biz.name}, I found your service on Yardly.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                  <a className="btn btn-secondary btn-small" href={`tel:${biz.phone_number}`}>
                    📞 Call {biz.phone_number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLASSIFIEDS TAB */}
        {!loading && tab === 'classifieds' && (
          <div className="grid-2">
            {classifieds.length === 0 && <div className="empty-state" style={{ gridColumn: 'span 2' }}>No items for sale or giveaway right now.</div>}
            {classifieds.map((item) => (
              <div key={item.id} className="card classified-card">
                <span className="badge badge-category">{item.category}</span>
                <h4 style={{ margin: '6px 0 2px' }}>{item.title}</h4>
                <div className="price-tag">
                  {Number(item.price) === 0 ? 'FREE / GIVEAWAY' : `₦${Number(item.price).toLocaleString()}`}
                </div>
                <p className="muted text-small">{item.condition} • By {item.seller?.first_name}</p>
                <a
                  className="btn btn-primary btn-small"
                  style={{ width: '100%', marginTop: 8 }}
                  href={whatsappLink(item.contact_phone || item.seller?.phone_number, `Hi, is "${item.title}" still available on Yardly?`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact Seller
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW BUSINESS MODAL */}
      {showBusinessModal && (
        <div className="modal-overlay" onClick={() => setShowBusinessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Register Estate Business</h3>
            <form onSubmit={handleCreateBusiness}>
              <div className="field">
                <label>Business Name</label>
                <input required value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Category</label>
                <select required value={bizForm.category} onChange={(e) => setBizForm({ ...bizForm, category: e.target.value })}>
                  <option value="">Select category</option>
                  {businessCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tagline</label>
                <input placeholder="e.g. Fresh laundry picked up & delivered" value={bizForm.tagline} onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input required value={bizForm.phone_number} onChange={(e) => setBizForm({ ...bizForm, phone_number: e.target.value })} />
              </div>
              <div className="field">
                <label>WhatsApp Number</label>
                <input value={bizForm.whatsapp_number} onChange={(e) => setBizForm({ ...bizForm, whatsapp_number: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea required rows={3} value={bizForm.description} onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit">Submit Listing</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowBusinessModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CLASSIFIED MODAL */}
      {showClassifiedModal && (
        <div className="modal-overlay" onClick={() => setShowClassifiedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>List Item for Sale / Giveaway</h3>
            <form onSubmit={handleCreateClassified}>
              <div className="field">
                <label>Title</label>
                <input required placeholder="e.g. Samsung 43-inch Smart TV" value={classifiedForm.title} onChange={(e) => setClassifiedForm({ ...classifiedForm, title: e.target.value })} />
              </div>
              <div className="field">
                <label>Price (₦) — 0 for free</label>
                <input required type="number" value={classifiedForm.price} onChange={(e) => setClassifiedForm({ ...classifiedForm, price: e.target.value })} />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={classifiedForm.category} onChange={(e) => setClassifiedForm({ ...classifiedForm, category: e.target.value })}>
                  <option value="FURNITURE">Furniture & Home</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="FOOD_GROCERIES">Food & Groceries</option>
                  <option value="GIVEAWAY">Free Giveaway</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea required rows={3} value={classifiedForm.description} onChange={(e) => setClassifiedForm({ ...classifiedForm, description: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit">Post Item</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowClassifiedModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}
