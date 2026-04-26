import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home, BookOpen, TrendingUp, Trophy, Upload, Users, BarChart2, LogOut, X
} from 'lucide-react'
import './Sidebar.css'

const studentLinks = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/student/dashboard', icon: BookOpen, label: 'My Courses' },
  { to: '/student/dashboard#progress', icon: TrendingUp, label: 'Progress' },
  { to: '/student/dashboard#achievements', icon: Trophy, label: 'Achievements' },
]

const teacherLinks = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/teacher/dashboard', icon: BarChart2, label: 'Overview' },
  { to: '/teacher/dashboard#upload', icon: Upload, label: 'Upload Content' },
  { to: '/teacher/dashboard#students', icon: Users, label: 'Students' },
]

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">⚡ Eklavya</span>
        {onClose && (
          <button className="sidebar-close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="sidebar-username">{user?.name}</div>
          <span className={`badge ${user?.role === 'teacher' ? 'badge-indigo' : 'badge-gold'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout} id="sidebar-logout-btn">
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  )
}

export default Sidebar
