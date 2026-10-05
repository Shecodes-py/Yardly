import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBusinesses, getCommunityFeed, getEstateLevies, getJobs, getMyReceipts, getVisitorPasses } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import BottomNav from '../components/BottomNav'

function Panel({ title, to, children, label = 'View all' }) {
  return <section className="home-panel"><div className="home-panel-heading"><h2>{title}</h2><Link to={to}>{label}</Link></div>{children}</section>
}
function Empty({ children }) { return <p className="home-empty">{children}</p> }
const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value))
const date = value => new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
export default function ResidentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({})
  const [failed, setFailed] = useState([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    const requests = { notices: () => getCommunityFeed({ category: 'ANNOUNCEMENT' }), visitors: getVisitorPasses, levies: getEstateLevies, receipts: getMyReceipts, businesses: getBusinesses, jobs: getJobs }
    Promise.allSettled(Object.values(requests).map(fn => fn())).then(results => {
      if (!alive) return
      const next = {}, errors = []
      Object.keys(requests).forEach((key, i) => { if (results[i].status === 'fulfilled') next[key] = results[i].value; else errors.push(key) })
      setData(next); setFailed(errors); setLoading(false)
    })
    return () => { alive = false }
  }, [attempt])
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const visitors = (data.visitors || []).filter(v => v.status === 'PENDING' && v.expected_date >= today).sort((a, b) => `${a.expected_date}${a.expected_time || ''}`.localeCompare(`${b.expected_date}${b.expected_time || ''}`)).slice(0, 2)
  const levy = data.levies?.find(l => !data.receipts?.some(r => r.levy === l.id))
  const notice = data.notices?.[0]
  const hour = new Date().getHours()
  const unavailable = key => loading ? 'Loading…' : failed.includes(key) ? 'Unable to load this section.' : null
  return <main className="resident-home">
    <section className="resident-welcome"><div><span className="home-eyebrow">AT HOME WITH YARDLY</span><h1>Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {user?.first_name || 'neighbour'}</h1><p>Your neighbourhood, a little closer.</p><span className="welcome-address"><Icon name="pin" size={18} />{user?.household_audit?.unit_address || user?.estate?.name || 'Welcome to your community'}</span></div><div className="estate-art" aria-hidden="true"><svg viewBox="0 0 420 180"><path d="M0 164h420" stroke="#a8b7a3"/><path d="M45 164V76l52-39 52 39v88M162 164V53h113v111M291 164V87l45-33 45 33v77" fill="#ece6d9" stroke="#b8b4a6" strokeWidth="2"/><path d="M36 77l61-48 62 48M152 52h133M283 88l53-41 53 41" fill="none" stroke="#244636" strokeWidth="8"/><path d="M77 164v-51h39v51M202 164v-63h34v63M323 164v-42h27v42" fill="#315343"/><path d="M179 69h17v20h-17zM246 69h17v20h-17zM59 89h16v19H59zM123 89h16v19h-16zM300 96h14v18h-14zM357 96h14v18h-14z" fill="#8faaa0"/><path d="M18 164v-54M399 164v-65" stroke="#987f57" strokeWidth="5"/><circle cx="18" cy="98" r="26" fill="#668269"/><circle cx="399" cy="85" r="30" fill="#668269"/><path d="M7 169h405" stroke="#819578" strokeWidth="10"/></svg></div></section>
    {user?.status !== 'VERIFIED' && <div className="home-status"><Icon name="alert" size={20} /><span>{user?.status === 'PENDING_AUDIT' ? 'Complete your household details to get started.' : 'Your account is awaiting estate approval.'}</span><Link to="/estate">View status</Link></div>}
    <div className="home-quick-actions">{[{ icon: 'visitors', label: 'Invite a visitor', to: '/gate?action=invite' }, { icon: 'delivery', label: 'Expect a delivery', to: '/gate?action=delivery' }, { icon: 'payments', label: 'Pay dues', to: '/estate?tab=dues' }, { icon: 'wrench', label: 'Report an issue', to: '/estate?tab=maintenance&action=report' }].map(a => <Link key={a.label} to={a.to}><Icon name={a.icon} size={28} /><span>{a.label}</span><Icon name="arrow" size={15} /></Link>)}</div>
    {failed.length > 0 && <div className="home-load-error" role="status">Some information could not be loaded.<button onClick={() => { setLoading(true); setAttempt(a => a + 1) }}>Try again</button></div>}
    <div className="home-columns"><div className="home-column">
      <Panel title="Community notice board" to="/community">{notice ? <div className="home-notice"><span className="home-round-icon amber"><Icon name="notice" size={28} /></span><div><h3>{notice.title}</h3><p>{notice.content}</p><small>From {notice.author?.first_name || 'your estate community'} {notice.author?.last_name}</small></div></div> : <Empty>{unavailable('notices') || 'All caught up. Estate announcements will appear here.'}</Empty>}</Panel>
      <Panel title="Around the neighbourhood" to="/services?tab=businesses"><div className="home-business-grid">{data.businesses?.slice(0, 2).map((b, i) => <Link to="/services?tab=businesses" key={b.id} className="home-business"><div className={`business-cover cover-${i}`}>{b.photo ? <img src={b.photo} alt={b.name} /> : <><Icon name={i ? 'wrench' : 'home'} size={46} /><span>LOCAL & CLOSE TO HOME</span></>}</div><div className="business-caption"><div><h3>{b.name}</h3><p>{b.tagline || b.address_or_unit || 'Discover a local business'}</p></div><Icon name="arrow" size={17} /></div></Link>)}</div>{!data.businesses?.length && <Empty>{unavailable('businesses') || 'Local businesses will appear here as your neighbourhood grows.'}</Empty>}</Panel>
      <Panel title="Neighbourhood jobs" to="/services?tab=tasks">{data.jobs?.slice(0, 3).map(j => <Link className="home-job" key={j.id} to={`/jobs/${j.id}`}><span className="home-square-icon"><Icon name="leaf" /></span><div><h3>{j.title}</h3><p>{j.approximate_location || 'In your estate'}{j.budget ? ` · ${money(j.budget)}` : ''}</p></div><Icon name="arrow" size={16} /></Link>)}{!data.jobs?.length && <Empty>{unavailable('jobs') || 'No open jobs nearby. Post a task to ask your neighbours for help.'}</Empty>}<Link className="home-text-link" to="/post-task">+ Post a neighbourhood job</Link></Panel>
    </div><div className="home-column">
      <Panel title="Your visitors" to="/gate">{visitors.map(v => <div className="home-visitor" key={v.id}><span className="resident-avatar">{v.visitor_name?.[0]}</span><div><h3>{v.visitor_name}</h3><p>{date(v.expected_date)}{v.expected_time ? ` · ${v.expected_time.slice(0, 5)}` : ''}</p><span className="home-expected">Expected</span></div><Link className="home-outline-button" to="/gate">View pass</Link></div>)}{!visitors.length && <Empty>{unavailable('visitors') || 'No visitors expected. Invite someone over.'}</Empty>}</Panel>
      <Panel title="Estate dues" to="/estate?tab=dues" label="View details">{levy && !failed.includes('receipts') ? <div className="home-dues"><span className="home-round-icon terracotta"><Icon name="payments" size={26} /></span><div><h3>{levy.title}</h3><strong className="home-amount">{money(levy.amount)}</strong><p>Due {date(levy.due_date)}</p><Link className="home-primary-button" to="/estate?tab=dues">View payment</Link></div></div> : <Empty>{unavailable('levies') || unavailable('receipts') || (data.levies?.length ? 'You’re up to date with your estate dues.' : 'No active dues at the moment.')}</Empty>}</Panel>
      <Panel title="Community" to="/community"><Link to="/community" className="home-community"><span className="home-round-icon"><Icon name="chat" size={28} /></span><div><h3>Join the estate conversation</h3><p>Share updates, ask questions and connect with your neighbours.</p></div><Icon name="arrow" size={17} /></Link></Panel>
      <Link className="home-emergency" to="/estate?tab=emergency"><Icon name="alert" size={28} /><strong>Emergency help</strong><Icon name="arrow" size={16} /></Link>
      <div className="home-footnote"><Icon name="leaf" size={17} /><span>A little connection makes a better neighbourhood.</span></div>
    </div></div><BottomNav />
  </main>
}
