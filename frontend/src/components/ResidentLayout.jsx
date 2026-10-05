import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

import { residentNav } from './residentNav'

export function Brand() {
  return <span className="yardly-brand"><svg width="42" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M3 25L22 6l19 19M11 21v17h10V26h9v12" stroke="currentColor" strokeWidth="3"/><path d="M25 10l12 12v16" stroke="#b3542c" strokeWidth="3"/></svg>Yardly</span>
}
export default function ResidentLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}` || 'Y'
  return <div className="resident-shell">
    {open && <button className="resident-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`resident-sidebar ${open ? 'is-open' : ''}`}>
      <Link to="/dashboard" className="resident-logo" onClick={() => setOpen(false)}><Brand /></Link>
      <span className="sidebar-caption">YOUR NEIGHBOURHOOD</span>
      <nav aria-label="Main navigation">{residentNav.map(item => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => `resident-nav-link ${isActive ? 'active' : ''}`}><Icon name={item.name} /><span>{item.label}</span></NavLink>)}<NavLink to="/services" className="resident-nav-link" onClick={() => setOpen(false)}><Icon name="wrench" />Neighbourhood services</NavLink></nav>
      <div className="sidebar-bottom"><Link to="/profile" className="resident-account"><span className="resident-avatar">{initials}</span><span><strong>{user?.first_name} {user?.last_name}</strong><small>Resident</small></span><Icon name="arrow" size={16} /></Link><button className="resident-signout" onClick={logout}><Icon name="logout" size={16} />Sign out</button></div>
    </aside>
    <div className="resident-main"><header className="resident-header"><button className="resident-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Icon name="menu" /></button><div className="resident-location"><Icon name="pin" size={18} /><span>{user?.estate?.name || 'Your estate'}</span></div><Link className="mobile-brand" to="/dashboard"><Brand /></Link><div className="resident-header-account"><Link to="/notifications" className="notification-link" aria-label="Notifications"><Icon name="bell" /></Link><Link to="/profile" className="header-profile"><span className="resident-avatar">{initials}</span><span>{user?.first_name} {user?.last_name}</span><Icon name="arrow" size={14} /></Link></div></header><Outlet /></div>
  </div>
}
