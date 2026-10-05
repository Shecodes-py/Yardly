import { useCallback, useEffect, useState } from 'react'
import {
  checkInVisitorPass,
  getDailyGateCode,
  getGuardDeliveries,
  getGuardPasses,
  getSecurityAlerts,
  markDeliveryArrived,
} from '../api/resources'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import { Brand } from '../components/ResidentLayout'

// Clean SVG Line Icons
function SearchIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ShieldIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}




function CheckIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function NeutralCheckIcon({ size = 26, color = '#a8a29e' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function AlertTriangleIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}



function LogOutIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function SecurityDashboard() {
  const { user, logout } = useAuth()
  const [gateCode, setGateCode] = useState(null)
  const [passes, setPasses] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState(false)

  // Pass Lookup State
  const [searchCode, setSearchCode] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPass, setSelectedPass] = useState(null)
  const [lookupMessage, setLookupMessage] = useState('')

  // Tour Guide controlled state

  // Inline action feedback & working state
  const [actionFeedback, setActionFeedback] = useState({})
  const [working, setWorking] = useState(false)

  const setFeedback = (key, success, message) => {
    setActionFeedback((prev) => ({ ...prev, [key]: { success, message } }))
    setTimeout(() => {
      setActionFeedback((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, 4000)
  }

  const loadGuardData = useCallback(async () => {
    setLoading(true)
    setDataError(false)
    try {
      const [gCode, pList, dList, aList] = await Promise.all([
        getDailyGateCode().catch(() => { setDataError(true); return null }),
        getGuardPasses().catch(() => { setDataError(true); return [] }),
        getGuardDeliveries().catch(() => { setDataError(true); return [] }),
        getSecurityAlerts().catch(() => { setDataError(true); return [] }),
      ])
      setGateCode(gCode)
      setPasses(pList)
      setDeliveries(dList)
      setAlerts(aList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGuardData()
  }, [loadGuardData])

  // Step 1: "Check pass" (Lookup pass details)
  const handleCheckPass = async (e) => {
    if (e) e.preventDefault()
    const query = searchCode.trim()
    if (!query) return

    setLookupMessage('')
    setSearchResults([])
    setSelectedPass(null)
    setWorking(true)

    try {
      const results = await getGuardPasses(query)
      if (results.length === 0) {
        setLookupMessage(`No pass found matching '${query}'.`)
      } else if (results.length === 1) {
        setSelectedPass(results[0])
      } else {
        setSearchResults(results)
      }
    } catch (err) {
      setLookupMessage(err.response?.data?.detail || 'Pass lookup failed.')
    } finally {
      setWorking(false)
    }
  }

  // Step 2: "Check in" (Execute check-in for selected pass)
  const handleCheckInSelectedPass = async (passToUse) => {
    const targetPass = passToUse || selectedPass
    if (!targetPass) return

    const key = `checkin-${targetPass.id}`
    setWorking(true)
    try {
      const res = await checkInVisitorPass(targetPass.pass_code)
      setFeedback(key, true, `Checked in ${res.visitor_name}`)
      setSelectedPass(res)
      await loadGuardData()
    } catch (err) {
      const errTxt = err.response?.data?.detail || err.response?.data?.[0] || 'Check-in rejected by system'
      setFeedback(key, false, errTxt)
    } finally {
      setWorking(false)
    }
  }

  // Mark Delivery Arrived
  const handleDeliveryArrived = async (id, company) => {
    const key = `delivery-${id}`
    setWorking(true)
    try {
      await markDeliveryArrived(id)
      setFeedback(key, true, `Arrival logged for ${company}`)
      await loadGuardData()
    } catch (err) {
      setFeedback(key, false, err.response?.data?.detail || 'Could not update status')
    } finally {
      setWorking(false)
    }
  }

  // Focus pass details card when clicking "View pass"
  const handleSelectPassToInspect = (pass) => {
    setSelectedPass(pass)
    setSearchResults([])
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Metric Counts derived directly from rendered records
  const currentDate = new Date()
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
  const expectedPasses = passes.filter(p => p.status === 'PENDING' && p.expected_date >= today)
  const pendingPassesCount = expectedPasses.length
  const expectedDeliveriesCount = deliveries.filter((d) => d.status === 'EXPECTED').length
  const arrivedDeliveriesCount = deliveries.filter((d) => d.status === 'ARRIVED').length
  const checkedInPasses = passes.filter((p) => p.status === 'CHECKED_IN' && p.checked_in_at && new Date(p.checked_in_at).toLocaleDateString() === new Date().toLocaleDateString())
  const sosAlerts = alerts.filter((a) => a.alert_type === 'EMERGENCY_SOS')

  return (
    <div className="admin-container">

      <aside className="resident-sidebar security-sidebar"><div className="resident-logo"><Brand /></div><span className="sidebar-caption">GATE & SECURITY</span><nav aria-label="Security navigation"><a className="resident-nav-link active" href="#pass-lookup"><Icon name="visitors" />Gate desk</a><a className="resident-nav-link" href="#expected-visitors"><Icon name="community" />Expected visitors</a><a className="resident-nav-link" href="#recent-checkins"><Icon name="home" />Recent check-ins</a></nav><div className="sidebar-bottom"><div className="resident-account"><span className="resident-avatar">{user?.first_name?.[0]}</span><span><strong>{user?.first_name} {user?.last_name}</strong><small>Security officer</small></span></div><button className="resident-signout" onClick={logout}><Icon name="logout" size={16} />Sign out</button></div></aside>
      {/* SINGLE FOCUSED SECURITY MAIN SCREEN */}
      <main className="admin-main">
        {/* COMPACT PAGE HEADER */}
        <header className="admin-header">
          <div className="admin-header-title">
            <ShieldIcon size={18} color="#1e3a2b" />
            <span>Yardly Security</span>
            <span style={{ fontSize: 12, color: '#57534e', fontWeight: 400 }}>
              • {user?.estate?.name || 'Miracle Zone'} Main Gate
            </span>
          </div>

          <div className="admin-header-right">
            <span className="admin-user-info">
              Officer: {user?.first_name} {user?.last_name}
            </span>
            <button className="admin-logout-btn" onClick={logout}>
              <LogOutIcon />
              Log Out
            </button>
          </div>
        </header>

        <div className="admin-content"><section className="operations-welcome"><span className="home-eyebrow">YOUR ESTATE, IN SAFE HANDS</span><h1>Welcome to the gate desk.</h1><p>Check visitors, coordinate deliveries and keep your community moving.</p></section>
          {dataError && <div className="home-load-error" role="alert">Some estate information could not be loaded. Counts may be incomplete.<button onClick={loadGuardData}>Try again</button></div>}
          {/* HIGH PRIORITY: EMERGENCY SOS PANIC ALERTS FEED (Placed above routine tasks) */}
          {sosAlerts.length > 0 && (
            <div className="security-sos-banner">
              <div className="security-sos-title">
                <AlertTriangleIcon size={20} color="#991b1b" />
                <span>ACTIVE EMERGENCY SOS PANIC ALERTS ({sosAlerts.length})</span>
              </div>
              {sosAlerts.map((a) => (
                <div key={a.id} className="security-sos-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#1c1917', fontSize: 14 }}>
                      Resident: {a.reporter?.first_name} {a.reporter?.last_name} ({a.unit_location || 'Resident Unit'})
                    </strong>
                    <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                      {new Date(a.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#991b1b', fontSize: 13 }}>{a.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* PROMINENT VISITOR PASS LOOKUP HERO ("Check pass") */}
          <div id="pass-lookup" className="admin-section-card" style={{ borderLeft: '4px solid #1e3a2b' }}>
            <div className="admin-section-header" style={{ marginBottom: 12, paddingBottom: 8 }}>
              <div>
                <h3 className="admin-section-title">Visitor pass lookup</h3>
                <div className="admin-section-subtitle">
                  Enter pass code or visitor name to inspect pass details before entry clearance.
                </div>
              </div>
            </div>

            <form onSubmit={handleCheckPass} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 12px 0 36px',
                    borderRadius: 6,
                    border: '1px solid #d6d3d1',
                    fontSize: 15,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                  placeholder="Enter Pass Code (e.g. PASS-XXXXXX) or Name"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
                <div style={{ position: 'absolute', left: 12, top: 14, color: '#78716c' }}>
                  <SearchIcon size={16} />
                </div>
              </div>
              <button
                className="admin-btn-primary"
                type="submit"
                style={{ height: 44, padding: '0 20px', minWidth: 120, fontSize: 14 }}
                disabled={working || !searchCode.trim()}
              >
                {working ? 'Checking...' : 'Check pass'}
              </button>
            </form>

            {lookupMessage && (
              <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 500, margin: '8px 0' }}>
                {lookupMessage}
              </div>
            )}

            {/* MULTIPLE MATCHES SELECTION LIST */}
            {searchResults.length > 1 && (
              <div style={{ backgroundColor: '#faf9f5', border: '1px solid #e2e0d8', borderRadius: 6, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 8 }}>
                  Multiple passes match query. Select a pass to inspect details:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPassToInspect(p)}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #d6d3d1',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <strong>{p.visitor_name}</strong>
                        <div style={{ fontSize: 12, color: '#57534e' }}>
                          Code: {p.pass_code} • House: {p.resident_unit_address || 'Resident Unit'}
                        </div>
                      </div>
                      <span className={`security-status-badge security-status-${p.status.toLowerCase()}`}>
                        {p.status === 'PENDING' ? 'Pending entry' : p.status === 'CHECKED_IN' ? 'Checked in' : p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PASS DETAILS CARD */}
            {selectedPass && (
              <div style={{ backgroundColor: '#faf9f5', border: '1px solid #d6d3d1', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#57534e', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                      Pass details
                    </div>
                    <h4 style={{ margin: '2px 0 0', fontSize: 17, color: '#1c1917' }}>{selectedPass.visitor_name}</h4>
                  </div>
                  <div>
                    {selectedPass.status === 'PENDING' && (
                      <span className="security-status-badge security-status-pending">
                        🟡 Pending entry
                      </span>
                    )}
                    {selectedPass.status === 'CHECKED_IN' && (
                      <span className="security-status-badge security-status-checked_in">
                        🟢 Checked in
                      </span>
                    )}
                    {selectedPass.status === 'CANCELLED' && (
                      <span className="security-status-badge security-status-cancelled">
                        🔴 Cancelled
                      </span>
                    )}
                    {selectedPass.status === 'EXPIRED' && (
                      <span className="security-status-badge security-status-expired">
                        🔴 Expired
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5, marginBottom: 14 }}>
                  <div>
                    <span style={{ color: '#57534e' }}>Pass Code:</span>{' '}
                    <strong style={{ fontFamily: 'monospace' }}>{selectedPass.pass_code}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#57534e' }}>Destination:</span>{' '}
                    <strong>{selectedPass.resident_unit_address || 'Resident Unit'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#57534e' }}>Resident:</span>{' '}
                    <strong>{selectedPass.resident?.first_name} {selectedPass.resident?.last_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#57534e' }}>Expected:</span>{' '}
                    <strong>{selectedPass.expected_date} {selectedPass.expected_time || ''}</strong>
                  </div>
                  {selectedPass.vehicle_number && (
                    <div>
                      <span style={{ color: '#57534e' }}>Vehicle:</span>{' '}
                      <strong>{selectedPass.vehicle_number}</strong>
                    </div>
                  )}
                </div>

                {/* CHECK IN ACTION BUTTON (Enabled ONLY when status is PENDING and Backend permits entry) */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {selectedPass.status === 'PENDING' ? (
                    <button
                      className="admin-btn-primary"
                      style={{ height: 40, padding: '0 18px', fontSize: 13.5 }}
                      onClick={() => handleCheckInSelectedPass()}
                      disabled={working}
                    >
                      {working ? 'Processing...' : 'Check in visitor'}
                    </button>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#57534e' }}>
                      Entry clearance disabled for current pass status ({selectedPass.status}).
                    </div>
                  )}
                  {actionFeedback[`checkin-${selectedPass.id}`] && (
                    <span className={actionFeedback[`checkin-${selectedPass.id}`].success ? 'admin-inline-success' : 'admin-inline-error'}>
                      {actionFeedback[`checkin-${selectedPass.id}`].success && <CheckIcon />} {actionFeedback[`checkin-${selectedPass.id}`].message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COMPACT SUMMARY METRICS STRIP */}
          <div className="admin-metrics-strip">
            <div className="admin-metric-item">
              <div className="admin-metric-label">Pending passes</div>
              <div className="admin-metric-value">{pendingPassesCount}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Expected riders</div>
              <div className="admin-metric-value">{expectedDeliveriesCount}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Arrived deliveries</div>
              <div className="admin-metric-value">{arrivedDeliveriesCount}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Checked in today</div>
              <div className="admin-metric-value">{checkedInPasses.length}</div>
            </div>
          </div>

          {loading && <div className="spinner" style={{ margin: '40px auto' }} />}

          {/* 2-COLUMN LAYOUT: EXPECTED VISITORS & RIDER DELIVERIES */}
          {!loading && (
            <div id="expected-visitors" className="security-grid">
              {/* EXPECTED VISITORS */}
              <div className="admin-section-card" style={{ marginBottom: 0 }}>
                <div className="admin-section-header">
                  <div>
                    <h3 className="admin-section-title">Expected visitors</h3>
                    <div className="admin-section-subtitle">
                      Active passes expecting arrival ({expectedPasses.length})
                    </div>
                  </div>
                </div>

                {expectedPasses.length === 0 ? (
                  <div className="admin-empty-state">
                    <NeutralCheckIcon />
                    <h4 className="admin-empty-title">All clear</h4>
                    <p className="admin-empty-text">No expected visitor passes logged.</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Visitor & House</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expectedPasses.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.visitor_name}</strong>
                              <div style={{ fontSize: 12, color: '#57534e' }}>
                                House: {p.resident_unit_address || 'Resident Unit'} • Code: {p.pass_code}
                              </div>
                            </td>
                            <td>
                              <span className={`security-status-badge security-status-${p.status.toLowerCase()}`}>
                                {p.status === 'PENDING' ? 'Pending' : p.status === 'CHECKED_IN' ? 'Checked in' : p.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="admin-btn-secondary"
                                style={{ fontSize: 12, padding: '4px 10px' }}
                                onClick={() => handleSelectPassToInspect(p)}
                              >
                                View pass
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* RIDER DELIVERIES */}
              <div className="admin-section-card" style={{ marginBottom: 0 }}>
                <div className="admin-section-header">
                  <div>
                    <h3 className="admin-section-title">Rider deliveries</h3>
                    <div className="admin-section-subtitle">
                      Pre-cleared packages & dispatch riders ({deliveries.length})
                    </div>
                  </div>
                </div>

                {deliveries.length === 0 ? (
                  <div className="admin-empty-state">
                    <NeutralCheckIcon />
                    <h4 className="admin-empty-title">No expected riders</h4>
                    <p className="admin-empty-text">Incoming deliveries will appear here.</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Company & Rider</th>
                          <th>Destination</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((d) => {
                          const key = `delivery-${d.id}`
                          const fb = actionFeedback[key]
                          const isSub = working && submittingKey === key
                          return (
                            <tr key={d.id}>
                              <td>
                                <strong>{d.company_name}</strong>
                                <div style={{ fontSize: 12, color: '#57534e' }}>
                                  Rider: {d.rider_name || 'Dispatch'}
                                </div>
                              </td>
                              <td>{d.resident_unit_address || 'Resident Unit'}</td>
                              <td>
                                {d.status === 'EXPECTED' ? (
                                  <button
                                    className="admin-btn-primary"
                                    style={{ fontSize: 12, padding: '4px 10px' }}
                                    onClick={() => handleDeliveryArrived(d.id, d.company_name)}
                                    disabled={working}
                                  >
                                    {isSub ? 'Saving...' : 'Mark arrived'}
                                  </button>
                                ) : (
                                  <span className="security-status-badge security-status-checked_in">
                                    Arrived
                                  </span>
                                )}
                                {fb && (
                                  <span className={fb.success ? 'admin-inline-success' : 'admin-inline-error'}>
                                    {fb.success && <CheckIcon />} {fb.message}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <div id="recent-checkins" />
          {/* RECENT CHECK-INS ACTIVITY LIST */}
          {!loading && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Recent check-ins</h3>
                  <div className="admin-section-subtitle">
                    Visitors admitted and checked in today ({checkedInPasses.length})
                  </div>
                </div>
              </div>

              {checkedInPasses.length === 0 ? (
                <div className="admin-empty-state">
                  <NeutralCheckIcon />
                  <h4 className="admin-empty-title">No check-ins today</h4>
                  <p className="admin-empty-text">Admitted visitors will log here automatically.</p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Visitor Name</th>
                        <th>Pass Code</th>
                        <th>Destination</th>
                        <th>Resident</th>
                        <th>Time Checked In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkedInPasses.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.visitor_name}</strong></td>
                          <td style={{ fontFamily: 'monospace' }}>{p.pass_code}</td>
                          <td>{p.resident_unit_address || 'Resident Unit'}</td>
                          <td>{p.resident?.first_name} {p.resident?.last_name}</td>
                          <td>
                            {p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString() : 'Today'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COMPACT DAILY GATE CODE & HELP LINK */}
          <div className="security-grid">
            <div className="admin-section-card" style={{ marginBottom: 0 }}>
              <div className="admin-section-header" style={{ marginBottom: 8, paddingBottom: 6 }}>
                <div>
                  <h3 className="admin-section-title">Daily gate code</h3>
                  <div className="admin-section-subtitle">Active estate code for manual gate entrants</div>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a2b', letterSpacing: 2 }}>
                {gateCode?.daily_gate_code || (loading ? 'Loading…' : 'Unavailable')}
              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  )
}
