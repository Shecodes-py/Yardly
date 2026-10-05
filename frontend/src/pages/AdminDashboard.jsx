import { useCallback, useEffect, useState } from 'react'
import {
  approveGuard,
  createEstateLevy,
  createFeedPost,
  getAdminHouseTracker,
  getAdminMaintenanceTickets,
  getDailyGateCode,
  getPendingGuards,
  getPendingMemberships,
  rotateGateCode,
  updateEstateInviteCode,
  updateMaintenanceStatus,
  verifyMembership,
} from '../api/resources'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import { Brand } from '../components/ResidentLayout'

// Consistent clean SVG line icons
function UsersIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function WrenchIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function KeyIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

function BellIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CreditCardIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}


function MenuIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function MenuFoldIcon({ isCollapsed, size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d={isCollapsed ? "M13 15l3-3-3-3" : "M16 15l-3-3 3-3"} />
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

function LogOutIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [gateCode, setGateCode] = useState(null)
  const [pendingResidents, setPendingResidents] = useState([])
  const [pendingGuards, setPendingGuards] = useState([])
  const [tickets, setTickets] = useState([])
  const [paymentTracker, setPaymentTracker] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState(false)

  // Navigation State
  const [activeSection, setActiveSection] = useState('overview')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)


  // Forms
  const [customInviteCode, setCustomInviteCode] = useState('')
  const [levyForm, setLevyForm] = useState({
    title: '',
    amount: '',
    month_year: '',
    due_date: '',
    description: '',
  })
  const [announcement, setAnnouncement] = useState({ title: '', content: '', send_email: true })

  // Inline action feedback state
  const [actionFeedback, setActionFeedback] = useState({})
  const [submittingKey, setSubmittingKey] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setDataError(false)
    try {
      const [gCode, pendingR, pendingG, tList, tracker] = await Promise.all([
        getDailyGateCode().catch(() => { setDataError(true); return null }),
        getPendingMemberships().catch(() => { setDataError(true); return [] }),
        getPendingGuards().catch(() => { setDataError(true); return [] }),
        getAdminMaintenanceTickets().catch(() => { setDataError(true); return [] }),
        getAdminHouseTracker().catch(() => { setDataError(true); return [] }),
      ])
      setGateCode(gCode)
      if (gCode?.invite_code) setCustomInviteCode(gCode.invite_code)
      setPendingResidents(pendingR)
      setPendingGuards(pendingG)
      setTickets(tList)
      setPaymentTracker(tracker)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const handleVerifyResident = async (membershipId, name) => {
    const key = `resident-${membershipId}`
    setSubmittingKey(key)
    try {
      await verifyMembership(membershipId)
      setFeedback(key, true, `Verified ${name}`)
      await loadAdminData()
    } catch (err) {
      setFeedback(key, false, err.response?.data?.detail || 'Verification failed')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleApproveGuard = async (guardId, name) => {
    const key = `guard-${guardId}`
    setSubmittingKey(key)
    try {
      await approveGuard(guardId)
      setFeedback(key, true, `Approved ${name}`)
      await loadAdminData()
    } catch (err) {
      setFeedback(key, false, err.response?.data?.detail || 'Approval failed')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleRotateGateCode = async () => {
    const key = 'rotate-code'
    if (window.confirm('Rotate the daily gate code? The estate invite code will stay the same.')) {
      setSubmittingKey(key)
      try {
        const res = await rotateGateCode()
        setGateCode(res)
        setFeedback(key, true, `Code rotated to ${res.daily_gate_code}`)
      } catch (err) {
        setFeedback(key, false, err.response?.data?.detail || 'Rotation failed')
      } finally {
        setSubmittingKey('')
      }
    }
  }

  const handleSaveInviteCode = async () => {
    const key = 'save-invite'
    setSubmittingKey(key)
    try {
      const result = await updateEstateInviteCode(customInviteCode)
      setGateCode(result)
      setCustomInviteCode(result.invite_code)
      setFeedback(key, true, 'Estate invite code saved. Daily gate code unchanged.')
    } catch (err) {
      setFeedback(key, false, err.response?.data?.invite_code?.[0] || err.response?.data?.detail || 'Could not save invite code.')
    } finally { setSubmittingKey('') }
  }

  const handleCreateLevy = async (e) => {
    e.preventDefault()
    const key = 'create-levy'
    setSubmittingKey(key)
    try {
      await createEstateLevy(levyForm)
      setFeedback(key, true, 'Levy created successfully')
      await loadAdminData()
    } catch (err) {
      setFeedback(key, false, err.response?.data?.detail || 'Levy creation failed')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleUpdateTicket = async (ticketId, newStatus) => {
    const key = `ticket-${ticketId}`
    setSubmittingKey(key)
    try {
      await updateMaintenanceStatus(ticketId, newStatus)
      setFeedback(key, true, `Status updated to ${newStatus}`)
      await loadAdminData()
    } catch {
      setFeedback(key, false, 'Update failed')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault()
    const key = 'broadcast-announcement'
    setSubmittingKey(key)
    try {
      const result = await createFeedPost({
        category: 'ANNOUNCEMENT',
        title: announcement.title,
        content: announcement.content,
        send_email: announcement.send_email,
      })
      setFeedback(key, true, result.email_delivery ? `Published. Emails: ${result.email_delivery.sent} sent, ${result.email_delivery.failed} failed.` : 'Announcement published')
      setAnnouncement({ title: '', content: '', send_email: true })
    } catch (err) {
      setFeedback(key, false, err.response?.data?.detail || 'Publish failed')
    } finally {
      setSubmittingKey('')
    }
  }

  const openTicketsCount = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length
  const totalCollectedSum = paymentTracker.reduce((acc, curr) => acc + (curr.total_collected || 0), 0)

  const sectionTitles = {
    'overview': 'Estate overview',
    'resident-approvals': 'Resident approvals',
    'security-approvals': 'Security approvals',
    'maintenance-tickets': 'Maintenance tickets',
    'access-codes': 'Access codes',
    'announcements': 'Announcements',
    'levies-payments': 'Levies & payments',
  }

  const displayedResidentRequests = pendingResidents

  const selectNavSection = (sectionId) => {
    setActiveSection(sectionId)
    setIsDrawerOpen(false)
  }

  return (
    <div className="admin-container">

      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="admin-brand"><Brand /></h1>
            <div className="admin-estate-name">{user?.estate?.name || 'Miracle Zone'} Governance</div>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <MenuFoldIcon isCollapsed={isCollapsed} />
          </button>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => selectNavSection('overview')} title="Overview"><Icon name="home" size={18} /><span className="admin-nav-label">Overview</span></button>
          <button
            className={`admin-nav-item ${activeSection === 'resident-approvals' ? 'active' : ''}`}
            onClick={() => selectNavSection('resident-approvals')}
            title="Resident approvals"
          >
            <UsersIcon />
            <span className="admin-nav-label">Resident approvals</span>
            {pendingResidents.length > 0 && <span className="admin-nav-badge">{pendingResidents.length}</span>}
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'security-approvals' ? 'active' : ''}`}
            onClick={() => selectNavSection('security-approvals')}
            title="Security approvals"
          >
            <ShieldIcon />
            <span className="admin-nav-label">Security approvals</span>
            {pendingGuards.length > 0 && <span className="admin-nav-badge">{pendingGuards.length}</span>}
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'maintenance-tickets' ? 'active' : ''}`}
            onClick={() => selectNavSection('maintenance-tickets')}
            title="Maintenance tickets"
          >
            <WrenchIcon />
            <span className="admin-nav-label">Maintenance tickets</span>
            {openTicketsCount > 0 && <span className="admin-nav-badge">{openTicketsCount}</span>}
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'access-codes' ? 'active' : ''}`}
            onClick={() => selectNavSection('access-codes')}
            title="Access codes"
          >
            <KeyIcon />
            <span className="admin-nav-label">Access codes</span>
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'announcements' ? 'active' : ''}`}
            onClick={() => selectNavSection('announcements')}
            title="Announcements"
          >
            <BellIcon />
            <span className="admin-nav-label">Announcements</span>
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'levies-payments' ? 'active' : ''}`}
            onClick={() => selectNavSection('levies-payments')}
            title="Levies & payments"
          >
            <CreditCardIcon />
            <span className="admin-nav-label">Levies & payments</span>
          </button>

          <div className="admin-nav-divider" />
        </nav>
      </aside>

      {/* MOBILE NAVIGATION DRAWER */}
      {isDrawerOpen && (
        <div
          className="drawer-backdrop open"
          onClick={() => setIsDrawerOpen(false)}
        >
        <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div>
              <strong style={{ fontSize: 16 }}>Yardly Governance</strong>
              <div style={{ fontSize: 12, color: '#a3b899' }}>{user?.estate?.name || 'Miracle Zone'}</div>
            </div>
            <button aria-label="Close navigation" className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
              ✕
            </button>
          </div>
          <nav className="admin-nav" style={{ padding: 16 }}>
            <button className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => selectNavSection('overview')}><Icon name="home" size={18} /><span>Overview</span></button>
            <button
              className={`admin-nav-item ${activeSection === 'resident-approvals' ? 'active' : ''}`}
              onClick={() => selectNavSection('resident-approvals')}
            >
              <UsersIcon />
              <span>Resident approvals</span>
              {pendingResidents.length > 0 && <span className="admin-nav-badge">{pendingResidents.length}</span>}
            </button>

            <button
              className={`admin-nav-item ${activeSection === 'security-approvals' ? 'active' : ''}`}
              onClick={() => selectNavSection('security-approvals')}
            >
              <ShieldIcon />
              <span>Security approvals</span>
              {pendingGuards.length > 0 && <span className="admin-nav-badge">{pendingGuards.length}</span>}
            </button>

            <button
              className={`admin-nav-item ${activeSection === 'maintenance-tickets' ? 'active' : ''}`}
              onClick={() => selectNavSection('maintenance-tickets')}
            >
              <WrenchIcon />
              <span>Maintenance tickets</span>
              {openTicketsCount > 0 && <span className="admin-nav-badge">{openTicketsCount}</span>}
            </button>

            <button
              className={`admin-nav-item ${activeSection === 'access-codes' ? 'active' : ''}`}
              onClick={() => selectNavSection('access-codes')}
            >
              <KeyIcon />
              <span>Access codes</span>
            </button>

            <button
              className={`admin-nav-item ${activeSection === 'announcements' ? 'active' : ''}`}
              onClick={() => selectNavSection('announcements')}
            >
              <BellIcon />
              <span>Announcements</span>
            </button>

            <button
              className={`admin-nav-item ${activeSection === 'levies-payments' ? 'active' : ''}`}
              onClick={() => selectNavSection('levies-payments')}
            >
              <CreditCardIcon />
              <span>Levies & payments</span>
            </button>

            <div className="admin-nav-divider" />
          </nav>
        </div>
      </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* COMPACT PAGE HEADER */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-menu-btn" aria-label="Open navigation" onClick={() => setIsDrawerOpen(true)}>
              <MenuIcon />
            </button>
            <h2 className="admin-header-title">
              {sectionTitles[activeSection]}
            </h2>
          </div>

          <div className="admin-header-right">
            <span className="admin-user-info">
              {user?.first_name} {user?.last_name}
            </span>
            <button className="admin-logout-btn" onClick={logout}>
              <LogOutIcon />
              Log Out
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeSection === 'overview' && <section className="operations-welcome"><span className="home-eyebrow">ESTATE MANAGEMENT</span><h1>A better place to call home.</h1><p>Here’s what needs your attention in {user?.estate?.name || 'your estate'}.</p></section>}
          {dataError && <div className="home-load-error" role="alert">Some estate information could not be loaded. Counts may be incomplete.<button onClick={loadAdminData}>Try again</button></div>}
          {/* COMPACT HORIZONTAL METRICS STRIP WITH SUBTLE DIVIDERS */}
          <div className="admin-metrics-strip">
            <div className="admin-metric-item">
              <div className="admin-metric-label">Pending residents</div>
              <div className="admin-metric-value">{pendingResidents.length}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Pending security</div>
              <div className="admin-metric-value">{pendingGuards.length}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Open tickets</div>
              <div className="admin-metric-value">{openTicketsCount}</div>
            </div>
            <div className="admin-metric-item">
              <div className="admin-metric-label">Recorded levy payments</div>
              <div className="admin-metric-value">₦{totalCollectedSum.toLocaleString()}</div>
            </div>
          </div>

          {loading && <div className="spinner" style={{ margin: '40px auto' }} />}

          {!loading && activeSection === 'overview' && <div className="operations-overview">
            <section className="home-panel"><div className="home-panel-heading"><h2>People & approvals</h2></div><p>Welcome new neighbours and keep your estate team up to date.</p><button className="operation-row" onClick={() => selectNavSection('resident-approvals')}><span className="home-round-icon"><Icon name="visitors" /></span><span><strong>Resident approvals</strong><small>{pendingResidents.length ? `${pendingResidents.length} awaiting verification` : 'No pending resident requests'}</small></span><Icon name="arrow" size={17} /></button><button className="operation-row" onClick={() => selectNavSection('security-approvals')}><span className="home-round-icon"><ShieldIcon size={22} /></span><span><strong>Security team</strong><small>{pendingGuards.length ? `${pendingGuards.length} awaiting approval` : 'No pending security requests'}</small></span><Icon name="arrow" size={17} /></button></section>
            <section className="home-panel"><div className="home-panel-heading"><h2>Maintenance</h2><button className="operation-text-button" onClick={() => selectNavSection('maintenance-tickets')}>View all</button></div>{tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status)).slice(0, 3).map(t => <button key={t.id} className="operation-row" onClick={() => selectNavSection('maintenance-tickets')}><span className="home-square-icon"><Icon name="wrench" /></span><span><strong>{t.title}</strong><small>{t.location || 'Estate maintenance'} · {t.status.replaceAll('_', ' ').toLowerCase()}</small></span><Icon name="arrow" size={17} /></button>)}{!tickets.some(t => !['RESOLVED', 'CLOSED'].includes(t.status)) && <p className="home-empty">All clear. No open maintenance requests.</p>}</section>
            <section className="home-panel"><div className="home-panel-heading"><h2>Keep the community informed</h2></div><div className="home-notice"><span className="home-round-icon amber"><Icon name="notice" size={26} /></span><div><h3>Something your neighbours should know?</h3><p>Share estate notices, updates and upcoming events.</p></div></div><button className="admin-btn-primary" style={{ marginTop: 18 }} onClick={() => selectNavSection('announcements')}>Write an announcement</button></section>
            <section className="home-panel"><div className="home-panel-heading"><h2>Estate essentials</h2></div><button className="operation-row" onClick={() => selectNavSection('levies-payments')}><span className="home-round-icon terracotta"><Icon name="payments" /></span><span><strong>Levies & payment tracker</strong><small>Manage dues and view recorded receipts</small></span><Icon name="arrow" size={17} /></button><button className="operation-row" onClick={() => selectNavSection('access-codes')}><span className="home-round-icon"><KeyIcon size={22} /></span><span><strong>Estate access codes</strong><small>Manage invite and daily entry codes</small></span><Icon name="arrow" size={17} /></button></section>
          </div>}

          {/* SECTION 1: RESIDENT APPROVALS */}
          {!loading && activeSection === 'resident-approvals' && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Pending requests</h3>
                </div>

              </div>

              {/* EMPTY STATE OR REQUESTS TABLE */}
              {displayedResidentRequests.length === 0 ? (
                <div className="admin-empty-state">
                  <NeutralCheckIcon className="admin-empty-icon" />
                  <h4 className="admin-empty-title">All caught up</h4>
                  <p className="admin-empty-text">New resident requests will appear here.</p>
                </div>
              ) : (
                <div>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Resident Name</th>
                          <th>Email</th>
                          <th>Unit Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedResidentRequests.map((m) => {
                          const key = `resident-${m.id}`
                          const fb = actionFeedback[key]
                          const isSub = submittingKey === key
                          return (
                            <tr key={m.id}>
                              <td><strong>{m.user?.first_name} {m.user?.last_name}</strong></td>
                              <td>{m.user?.email}</td>
                              <td>{m.unit_address || 'Address pending'}</td>
                              <td>
                                <button
                                  className="admin-btn-primary"
                                  onClick={() => handleVerifyResident(m.id, `${m.user?.first_name} ${m.user?.last_name}`)}
                                  disabled={isSub}
                                >
                                  {isSub ? 'Verifying...' : 'Approve resident'}
                                </button>
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
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: SECURITY APPROVALS */}
          {!loading && activeSection === 'security-approvals' && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Security approvals</h3>
                  <div className="admin-section-subtitle">
                    Pending security officer account verifications ({pendingGuards.length})
                  </div>
                </div>
              </div>

              {pendingGuards.length === 0 ? (
                <div className="admin-empty-state">
                  <NeutralCheckIcon className="admin-empty-icon" />
                  <h4 className="admin-empty-title">All caught up</h4>
                  <p className="admin-empty-text">No security officers pending admin approval.</p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Officer Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingGuards.map((g) => {
                        const key = `guard-${g.id}`
                        const fb = actionFeedback[key]
                        const isSub = submittingKey === key
                        return (
                          <tr key={g.id}>
                            <td><strong>{g.first_name} {g.last_name}</strong></td>
                            <td>{g.email}</td>
                            <td>{g.phone_number || 'N/A'}</td>
                            <td>
                              <button
                                className="admin-btn-primary"
                                onClick={() => handleApproveGuard(g.id, `${g.first_name} ${g.last_name}`)}
                                disabled={isSub}
                              >
                                {isSub ? 'Approving...' : 'Approve officer'}
                              </button>
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
          )}

          {/* SECTION 3: MAINTENANCE TICKETS */}
          {!loading && activeSection === 'maintenance-tickets' && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Maintenance tickets</h3>
                  <div className="admin-section-subtitle">
                    Community maintenance & service requests ({tickets.length})
                  </div>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="admin-empty-state">
                  <NeutralCheckIcon className="admin-empty-icon" />
                  <h4 className="admin-empty-title">All caught up</h4>
                  <p className="admin-empty-text">No maintenance tickets currently open.</p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Issue & Title</th>
                        <th>Resident</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => {
                        const key = `ticket-${t.id}`
                        const fb = actionFeedback[key]
                        const isSub = submittingKey === key
                        return (
                          <tr key={t.id}>
                            <td>
                              <strong>{t.title}</strong>
                              <div style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{t.issue_type} • {t.description}</div>
                            </td>
                            <td>{t.resident_name}</td>
                            <td>{t.location || 'Resident unit'}</td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 600, color: t.status === 'RESOLVED' ? '#166534' : t.status === 'IN_PROGRESS' ? '#d97706' : '#57534e' }}>
                                {t.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {t.status !== 'IN_PROGRESS' && (
                                  <button
                                    className="admin-btn-secondary"
                                    onClick={() => handleUpdateTicket(t.id, 'IN_PROGRESS')}
                                    disabled={isSub}
                                  >
                                    In progress
                                  </button>
                                )}
                                {t.status !== 'RESOLVED' && (
                                  <button
                                    className="admin-btn-primary"
                                    onClick={() => handleUpdateTicket(t.id, 'RESOLVED')}
                                    disabled={isSub}
                                  >
                                    Resolve
                                  </button>
                                )}
                                {fb && (
                                  <span className={fb.success ? 'admin-inline-success' : 'admin-inline-error'}>
                                    {fb.success && <CheckIcon />} {fb.message}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: ACCESS CODES */}
          {!loading && activeSection === 'access-codes' && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Access codes</h3>
                  <div className="admin-section-subtitle">
                    Gate security rotation & estate invitation controls
                  </div>
                </div>
              </div>

              <div style={{ maxWidth: 480 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                    Estate invite code
                  </label>
                  <input
                    value={customInviteCode}
                    onChange={(e) => setCustomInviteCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', fontWeight: 600, width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                  />
                </div>

                <button className="admin-btn-secondary" onClick={handleSaveInviteCode} disabled={!customInviteCode.trim() || Boolean(submittingKey)} style={{ marginBottom: 16 }}>{submittingKey === 'save-invite' ? 'Saving…' : 'Save estate invite code'}</button>
                {actionFeedback['save-invite'] && <p role="status" className={actionFeedback['save-invite'].success ? 'admin-inline-success' : 'admin-inline-error'}>{actionFeedback['save-invite'].message}</p>}

                <div style={{ padding: '12px 14px', backgroundColor: '#faf9f5', borderRadius: 6, border: '1px solid #e2e0d8', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#57534e' }}>Current daily gate code</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a2b', letterSpacing: 2, marginTop: 2 }}>
                    {gateCode?.daily_gate_code || 'Unavailable'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    className="admin-btn-primary"
                    onClick={handleRotateGateCode}
                    disabled={Boolean(submittingKey)}
                  >
                    {submittingKey === 'rotate-code' ? 'Rotating...' : 'Rotate gate code'}
                  </button>
                  {actionFeedback['rotate-code'] && (
                    <span className={actionFeedback['rotate-code'].success ? 'admin-inline-success' : 'admin-inline-error'}>
                      {actionFeedback['rotate-code'].success && <CheckIcon />} {actionFeedback['rotate-code'].message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: ANNOUNCEMENTS */}
          {!loading && activeSection === 'announcements' && (
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Announcements</h3>
                  <div className="admin-section-subtitle">
                    Publish notices and optionally email verified residents in your estate
                  </div>
                </div>
              </div>

              <form onSubmit={handleBroadcastAnnouncement} style={{ maxWidth: 560 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                    Title
                  </label>
                  <input
                    required
                    placeholder="e.g. Scheduled power maintenance on Saturday"
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                    Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide detailed information for estate residents..."
                    value={announcement.content}
                    onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 13 }}><input type="checkbox" checked={announcement.send_email} onChange={e => setAnnouncement({ ...announcement, send_email: e.target.checked })} />Email this update to verified residents</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    className="admin-btn-primary"
                    type="submit"
                    disabled={submittingKey === 'broadcast-announcement'}
                  >
                    {submittingKey === 'broadcast-announcement' ? 'Publishing...' : 'Publish announcement'}
                  </button>
                  {actionFeedback['broadcast-announcement'] && (
                    <span className={actionFeedback['broadcast-announcement'].success ? 'admin-inline-success' : 'admin-inline-error'}>
                      {actionFeedback['broadcast-announcement'].success && <CheckIcon />} {actionFeedback['broadcast-announcement'].message}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* SECTION 6: LEVIES & PAYMENTS */}
          {!loading && activeSection === 'levies-payments' && (
            <div>
              {/* CREATE LEVY FORM */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <div>
                    <h3 className="admin-section-title">Create monthly levy</h3>
                    <div className="admin-section-subtitle">
                      Set up dues for estate maintenance & security
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateLevy}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                        Levy title
                      </label>
                      <input
                        required
                        value={levyForm.title}
                        onChange={(e) => setLevyForm({ ...levyForm, title: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                        Amount (₦)
                      </label>
                      <input
                        required
                        type="number"
                        value={levyForm.amount}
                        onChange={(e) => setLevyForm({ ...levyForm, amount: Number(e.target.value) })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                        Month & year tag
                      </label>
                      <input
                        required
                        value={levyForm.month_year}
                        onChange={(e) => setLevyForm({ ...levyForm, month_year: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 6 }}>
                        Due date
                      </label>
                      <input
                        required
                        type="date"
                        value={levyForm.due_date}
                        onChange={(e) => setLevyForm({ ...levyForm, due_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d6d3d1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      className="admin-btn-primary"
                      type="submit"
                      disabled={submittingKey === 'create-levy'}
                    >
                      {submittingKey === 'create-levy' ? 'Creating...' : 'Publish monthly levy'}
                    </button>
                    {actionFeedback['create-levy'] && (
                      <span className={actionFeedback['create-levy'].success ? 'admin-inline-success' : 'admin-inline-error'}>
                        {actionFeedback['create-levy'].success && <CheckIcon />} {actionFeedback['create-levy'].message}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* HOUSE-BY-HOUSE PAYMENT TRACKER */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <div>
                    <h3 className="admin-section-title">House payment tracker</h3>
                    <div className="admin-section-subtitle">
                      Tracking resident payment status per active levy
                    </div>
                  </div>
                </div>

                {paymentTracker.length === 0 ? (
                  <p style={{ color: '#57534e', fontSize: 13.5, margin: '8px 0' }}>
                    No active estate levies tracked yet.
                  </p>
                ) : (
                  paymentTracker.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: idx < paymentTracker.length - 1 ? '1px solid #f0eee6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                        <div>
                          <strong style={{ fontSize: 15, color: '#1c1917' }}>{item.levy.title}</strong>
                          <span style={{ fontSize: 12, color: '#57534e', marginLeft: 8 }}>({item.levy.month_year})</span>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e3a2b' }}>
                          Collected: ₦{Number(item.total_collected).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={{ backgroundColor: '#faf9f5', padding: 12, borderRadius: 6, border: '1px solid #e2e0d8' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#166534', marginBottom: 6 }}>
                            Paid Units ({item.paid_count})
                          </div>
                          {item.paid_units.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#57534e' }}>None yet</div>
                          ) : (
                            item.paid_units.map((u, i) => (
                              <div key={i} style={{ fontSize: 12.5, color: '#1c1917', margin: '3px 0' }}>
                                {u.unit_address} ({u.resident_name})
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ backgroundColor: '#faf9f5', padding: 12, borderRadius: 6, border: '1px solid #e2e0d8' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>
                            Unpaid Units ({item.unpaid_count})
                          </div>
                          {item.unpaid_units.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#57534e' }}>All units paid</div>
                          ) : (
                            item.unpaid_units.map((u, i) => (
                              <div key={i} style={{ fontSize: 12.5, color: '#1c1917', margin: '3px 0' }}>
                                {u.unit_address} ({u.resident_name})
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
