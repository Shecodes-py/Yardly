import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', icon: '🏠', label: 'Home' },
  { to: '/my-tasks', icon: '📋', label: 'My Tasks' },
  { to: '/post-task', icon: '➕', label: 'Post', isFab: true },
  { to: '/notifications', icon: '🔔', label: 'Activity' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {item.isFab ? (
            <span className="fab">{item.icon}</span>
          ) : (
            <span className="nav-icon">{item.icon}</span>
          )}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
