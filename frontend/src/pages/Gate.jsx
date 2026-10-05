import { useCallback, useEffect, useState } from 'react'
import {
  cancelVisitorPass,
  createDeliveryPass,
  createSecurityAlert,
  createVisitorPass,
  getDailyGateCode,
  getDeliveryPasses,
  getVisitorPasses,
} from '../api/resources'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Gate() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [gateCode, setGateCode] = useState(null)
  const [visitorPasses, setVisitorPasses] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  const [showPassModal, setShowPassModal] = useState(searchParams.get('action') === 'invite')
  const [showDeliveryModal, setShowDeliveryModal] = useState(searchParams.get('action') === 'delivery')
  const [error, setError] = useState('')

  const [passForm, setPassForm] = useState({
    visitor_name: '', visitor_phone: '', expected_date: new Date().toISOString().slice(0, 10), expected_time: '', vehicle_number: ''
  })
  const [deliveryForm, setDeliveryForm] = useState({
    company_name: 'Chowdeck', rider_name: '', rider_phone: '', package_details: ''
  })

  const loadGateData = useCallback(async () => {
    setLoading(true)
    try {
      if (user?.status === 'VERIFIED') {
        const [code, passes, delivs] = await Promise.all([
          getDailyGateCode().catch(() => null),
          getVisitorPasses().catch(() => []),
          getDeliveryPasses().catch(() => []),
        ])
        setGateCode(code)
        setVisitorPasses(passes)
        setDeliveries(delivs)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadGateData()
  }, [loadGateData])

  const handleCreatePass = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createVisitorPass(passForm)
      setShowPassModal(false)
      loadGateData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create visitor pass.')
    }
  }

  const handleCreateDelivery = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createDeliveryPass(deliveryForm)
      setShowDeliveryModal(false)
      loadGateData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not pre-clear delivery.')
    }
  }

  const handleCancelPass = async (id) => {
    if (window.confirm('Cancel this visitor pass?')) {
      await cancelVisitorPass(id)
      loadGateData()
    }
  }

  const handleEmergencySOS = async () => {
    if (window.confirm('Trigger Emergency Security Alert to Gate Desk?')) {
      await createSecurityAlert({
        alert_type: 'EMERGENCY_SOS',
        description: 'Resident triggered emergency SOS panic alert.',
        unit_location: user?.estate?.name || 'Resident Unit',
      })
      window.alert('🚨 Emergency alert sent to Gate Desk and Estate Security!')
    }
  }

  const unverified = user && user.status !== 'VERIFIED'

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Access Control</p>
            <h2 style={{ margin: '2px 0' }}>Gate & Visitors</h2>
          </div>
          <button className="btn btn-danger btn-small" onClick={handleEmergencySOS}>
            🚨 Emergency SOS
          </button>
        </div>
      </div>

      <div className="page">
        {unverified && (
          <div className="card notice-card">
            🔒 Estate membership <strong>{user?.status?.toLowerCase()}</strong>. Gate passes and daily codes unlock once verified.
          </div>
        )}

        {/* DAILY GATE CODE CARD */}
        {gateCode && (
          <div className="card daily-code-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-category">TODAY'S ESTATE GATE CODE</span>
                <div className="daily-code-text">{gateCode.daily_gate_code}</div>
              </div>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  navigator.clipboard.writeText(gateCode.daily_gate_code)
                  window.alert('Gate code copied!')
                }}
              >
                📋 Copy
              </button>
            </div>
            <p className="muted text-small" style={{ margin: '6px 0 0' }}>
              Shared with verified residents for gate clearance. Updated daily.
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
          <button
            className="btn btn-primary"
            disabled={unverified}
            onClick={() => setShowPassModal(true)}
          >
            + Create Visitor Pass
          </button>
          <button
            className="btn btn-secondary"
            disabled={unverified}
            onClick={() => setShowDeliveryModal(true)}
          >
            📦 Pre-clear Rider / Package
          </button>
        </div>

        {loading && <div className="spinner" />}

        {/* VISITOR PASSES LIST */}
        {!loading && (
          <div>
            <h3 style={{ margin: '14px 0 8px' }}>Active Visitor Passes ({visitorPasses.length})</h3>
            {visitorPasses.length === 0 && <p className="muted">No upcoming visitor passes.</p>}

            {visitorPasses.map((pass) => (
              <div key={pass.id} className="card pass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{pass.visitor_name}</strong>
                    <p className="muted text-small">{pass.expected_date} {pass.expected_time || ''} {pass.vehicle_number ? `• Car: ${pass.vehicle_number}` : ''}</p>
                  </div>
                  <span className={`status-pill status-${pass.status.toLowerCase()}`}>{pass.status}</span>
                </div>
                <div className="pass-code-box">
                  <span className="pass-code">{pass.pass_code}</span>
                  <span className="text-small muted">Present code to gate guard</span>
                </div>
                {pass.status === 'PENDING' && (
                  <button className="btn btn-danger btn-small" style={{ marginTop: 8 }} onClick={() => handleCancelPass(pass.id)}>
                    Cancel Pass
                  </button>
                )}
              </div>
            ))}

            {/* EXPECTED DELIVERIES LIST */}
            <h3 style={{ margin: '20px 0 8px' }}>Expected Deliveries ({deliveries.length})</h3>
            {deliveries.length === 0 && <p className="muted">No expected delivery riders logged.</p>}
            {deliveries.map((deliv) => (
              <div key={deliv.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>📦 {deliv.company_name}</strong>
                    <p className="muted text-small">{deliv.rider_name ? `Rider: ${deliv.rider_name}` : 'Rider arriving soon'}</p>
                  </div>
                  <span className="pass-code" style={{ fontSize: '1rem' }}>{deliv.pass_code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE VISITOR PASS MODAL */}
      {showPassModal && (
        <div className="modal-overlay" onClick={() => setShowPassModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Generate Visitor Gate Pass</h3>
            <form onSubmit={handleCreatePass}>
              <div className="field">
                <label>Visitor Full Name</label>
                <input required placeholder="e.g. Chukwuma Eze" value={passForm.visitor_name} onChange={(e) => setPassForm({ ...passForm, visitor_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Visitor Phone</label>
                <input placeholder="08012345678" value={passForm.visitor_phone} onChange={(e) => setPassForm({ ...passForm, visitor_phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Expected Date</label>
                <input required type="date" value={passForm.expected_date} onChange={(e) => setPassForm({ ...passForm, expected_date: e.target.value })} />
              </div>
              <div className="field">
                <label>Car Plate Number (Optional)</label>
                <input placeholder="e.g. KJA-482AA" value={passForm.vehicle_number} onChange={(e) => setPassForm({ ...passForm, vehicle_number: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit">Generate Pass</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowPassModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRE-CLEAR DELIVERY MODAL */}
      {showDeliveryModal && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Pre-clear Rider / Package</h3>
            <form onSubmit={handleCreateDelivery}>
              <div className="field">
                <label>Company / Service</label>
                <select value={deliveryForm.company_name} onChange={(e) => setDeliveryForm({ ...deliveryForm, company_name: e.target.value })}>
                  <option value="Chowdeck">Chowdeck</option>
                  <option value="Uber Eats / Bolt Food">Uber Eats / Bolt Food</option>
                  <option value="Jumia Food / Express">Jumia Logistics</option>
                  <option value="DHL / Logistics Courier">DHL / Courier</option>
                  <option value="Ride Hailing (Uber/Bolt)">Uber / Bolt Driver</option>
                  <option value="Other Delivery">Other Rider</option>
                </select>
              </div>
              <div className="field">
                <label>Rider Name / Details (Optional)</label>
                <input placeholder="e.g. Rider Ibrahim" value={deliveryForm.rider_name} onChange={(e) => setDeliveryForm({ ...deliveryForm, rider_name: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit">Pre-clear Arrival</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowDeliveryModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}
