import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  Home, BookOpen, TrendingUp, Trophy, Upload, Users, BarChart2, LogOut, X
} from 'lucide-react'
import LogoutModal from './LogoutModal'
import './Sidebar.css'

const studentLinks = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/student/dashboard?tab=courses', icon: BookOpen, label: 'My Courses' },
  { to: '/student/dashboard?tab=progress', icon: TrendingUp, label: 'Progress' },
  { to: '/student/dashboard?tab=achievements', icon: Trophy, label: 'Achievements' },
]

const teacherLinks = [
  { to: '/admin/dashboard?tab=overview', icon: BarChart2, label: 'Overview' },
  { to: '/admin/dashboard?tab=subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/admin/dashboard?tab=students', icon: Users, label: 'Students' },
]

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks
  const currentUrl = location.pathname + location.search
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    navigate('/')
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
            className={() => `sidebar-link ${currentUrl === to ? 'active' : ''}`}
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

      {/* Logout Confirmation Modal */}
      <LogoutModal
        show={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </aside>
  )
}

export default Sidebar
