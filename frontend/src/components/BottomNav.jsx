import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { residentNav } from './residentNav'

export default function BottomNav() {
  return <nav className="bottom-nav" aria-label="Mobile navigation">{residentNav.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon name={item.name} size={23} /><span className="nav-label">{item.label}</span></NavLink>)}</nav>
}
