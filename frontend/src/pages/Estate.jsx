import { useCallback, useEffect, useState } from 'react'
import {
  createMaintenanceTicket,
  getEmergencyContacts,
  getEstateLevies,
  getMaintenanceTickets,
  getMyReceipts,
} from '../api/resources'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import DigitalReceiptModal from '../components/DigitalReceiptModal'
import HouseholdAuditModal from '../components/HouseholdAuditModal'

export default function Estate() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(['dues', 'maintenance', 'emergency'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dues') // 'dues' | 'maintenance' | 'emergency'
  const [contacts, setContacts] = useState([])
  const [tickets, setTickets] = useState([])
  const [levies, setLevies] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(searchParams.get('action') === 'report')

  const [form, setForm] = useState({ issue_type: 'WATER', title: '', description: '', location: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadEstateData = useCallback(async () => {
    setLoading(true)
    try {
      const [cList, tList, lList, rList] = await Promise.all([
        getEmergencyContacts().catch(() => []),
        getMaintenanceTickets().catch(() => []),
        getEstateLevies().catch(() => []),
        getMyReceipts().catch(() => []),
      ])
      setContacts(cList)
      setTickets(tList)
      setLevies(lList)
      setReceipts(rList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEstateData()
  }, [loadEstateData])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createMaintenanceTicket(form)
      setShowTicketModal(false)
      setForm({ issue_type: 'WATER', title: '', description: '', location: '' })
      loadEstateData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit maintenance ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPendingAudit = user && user.status === 'PENDING_AUDIT'

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Estate Operating Hub</p>
            <h2 style={{ margin: '2px 0' }}>{user?.estate?.name || 'Miracle Zone'}</h2>
          </div>
          <button className="btn btn-primary btn-small" onClick={() => setShowTicketModal(true)}>
            + Log Ticket
          </button>
        </div>

        {/* 3 SUB TABS */}
        <div className="segment-control" style={{ marginTop: 12 }}>
          <button className={`segment ${tab === 'dues' ? 'active' : ''}`} onClick={() => setTab('dues')}>
            💳 Dues & Levies
          </button>
          <button className={`segment ${tab === 'maintenance' ? 'active' : ''}`} onClick={() => setTab('maintenance')}>
            🔧 Maintenance ({tickets.length})
          </button>
          <button className={`segment ${tab === 'emergency' ? 'active' : ''}`} onClick={() => setTab('emergency')}>
            🚨 Directory
          </button>
        </div>
      </div>

      <div className="page">
        {isPendingAudit && (
          <div className="card notice-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>📋 Mandatory Household Audit Pending</strong>
              <p className="text-small" style={{ margin: '2px 0 0' }}>Complete your unit audit to unlock gate codes.</p>
            </div>
            <button className="btn btn-primary btn-small" onClick={() => setShowAuditModal(true)}>
              Complete Audit
            </button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
        {loading && <div className="spinner" />}

        {/* TAB 1: DUES & STAMPED RECEIPTS */}
        {!loading && tab === 'dues' && (
          <div>
            <h3 style={{ margin: '10px 0 8px' }}>💳 Active Estate Monthly Dues & Levies</h3>
            {levies.length === 0 && <p className="muted">No active estate levies posted.</p>}
            {levies.map((levy) => {
              const paidReceipt = receipts.find((r) => r.levy === levy.id)
              return (
                <div key={levy.id} className="card" style={{ borderLeft: paidReceipt ? '4px solid #158052' : '4px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-category">{levy.month_year}</span>
                      <h4 style={{ margin: '6px 0 2px' }}>{levy.title}</h4>
                      <p className="price-tag">₦{Number(levy.amount).toLocaleString()}</p>
                    </div>
                    {paidReceipt ? (
                      <span className="status-pill status-checked_in">PAID</span>
                    ) : (
                      <span className="status-pill status-pending">UNPAID</span>
                    )}
                  </div>
                  {levy.description && <p className="muted text-small" style={{ margin: '6px 0' }}>{levy.description}</p>}
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {paidReceipt ? (
                      <button className="btn btn-secondary btn-small" onClick={() => setSelectedReceipt(paidReceipt)}>
                        🧾 View Stamped Digital Receipt
                      </button>
                    ) : (
                      <p className="muted text-small">Online payment is not available yet. Contact your estate management for payment instructions.</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* MY PAYMENT RECEIPTS */}
            <h3 style={{ margin: '24px 0 8px' }}>🧾 My Payment Receipts ({receipts.length})</h3>
            {receipts.length === 0 && <p className="muted">No payment receipts generated yet.</p>}
            {receipts.map((r) => (
              <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.levy_title || 'Monthly Levy'} ({r.month_year})</strong>
                  <p className="muted text-small" style={{ margin: '2px 0' }}>Ref: {r.reference} • ₦{Number(r.amount_paid).toLocaleString()}</p>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => setSelectedReceipt(r)}>
                  View Receipt
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: MAINTENANCE TICKETS */}
        {!loading && tab === 'maintenance' && (
          <div>
            <h3 style={{ margin: '10px 0 8px' }}>🔧 Maintenance Tickets ({tickets.length})</h3>
            {tickets.length === 0 && <p className="muted">No maintenance requests submitted.</p>}
            {tickets.map((t) => (
              <div key={t.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-category">{t.issue_type}</span>
                    <h4 style={{ margin: '6px 0 2px' }}>{t.title}</h4>
                    <p className="muted text-small">{t.location || 'Resident Unit'}</p>
                  </div>
                  <span className={`status-pill status-${t.status.toLowerCase()}`}>{t.status}</span>
                </div>
                <p style={{ marginTop: 8 }}>{t.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: EMERGENCY DIRECTORY */}
        {!loading && tab === 'emergency' && (
          <div>
            <h3 style={{ margin: '10px 0 8px' }}>🚨 Emergency Contacts</h3>
            <div className="grid-2">
              {contacts.map((c) => (
                <div key={c.id} className={`card ${c.is_gate_desk ? 'gate-desk-card' : ''}`}>
                  <strong style={{ fontSize: '1rem' }}>{c.title}</strong>
                  <p className="muted text-small" style={{ margin: '4px 0' }}>{c.description}</p>
                  <a className="btn btn-secondary btn-small" href={`tel:${c.phone_number}`} style={{ marginTop: 6, display: 'inline-block' }}>
                    📞 {c.phone_number}
                  </a>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '24px 0 8px' }}>📜 Miracle Zone Rules & Bye-laws</h3>
            <div className="card">
              <p style={{ whiteSpace: 'pre-line' }}>
                1. Speed limit within Miracle Zone is 20km/h.<br />
                2. All visitor passes must be generated in the Yardly app.<br />
                3. Noise curfew starts at 10:00 PM on weekdays.<br />
                4. Waste disposal collection is scheduled for Monday and Thursday mornings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAuditModal && <HouseholdAuditModal onCompleted={() => { setShowAuditModal(false); loadEstateData(); }} />}
      {selectedReceipt && <DigitalReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}

      {/* LOG MAINTENANCE MODAL */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Maintenance Ticket</h3>
            <form onSubmit={handleCreateTicket}>
              <div className="field">
                <label>Issue Type</label>
                <select value={form.issue_type} onChange={(e) => setForm({ ...form, issue_type: e.target.value })}>
                  <option value="WATER">Water / Plumbing</option>
                  <option value="POWER">Power / Electrical</option>
                  <option value="GATE">Gate / Access Issue</option>
                  <option value="SECURITY">Security Concern</option>
                  <option value="INFRASTRUCTURE">Roads / Drainage</option>
                  <option value="OTHER">Other Complaint</option>
                </select>
              </div>
              <div className="field">
                <label>Title</label>
                <input required placeholder="e.g. Water leakage near Block 3 street light" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="field">
                <label>Location / Unit</label>
                <input placeholder="e.g. House 14, Zone B" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="field">
                <label>Details</label>
                <textarea required rows={3} placeholder="Explain the maintenance issue..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Log Ticket'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowTicketModal(false)}>
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
