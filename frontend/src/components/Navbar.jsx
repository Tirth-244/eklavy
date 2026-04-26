import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, BookOpen, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import LogoutModal from './LogoutModal'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    navigate('/')
  }

  const homeLink = isAuthenticated ? '/home' : '/'

  const navLinks = [
    { to: homeLink, label: 'Home' },
    { to: isAuthenticated ? '/course/Physics' : '/course/physics/demo', label: 'Physics' },
    { to: isAuthenticated ? '/course/Chemistry' : '/course/chemistry/demo', label: 'Chemistry' },
    { to: isAuthenticated ? '/course/Maths' : '/course/maths/demo', label: 'Maths' },
  ]

  const dashboardLink = user?.role === 'teacher' ? '/teacher/dashboard' : '/user'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={homeLink} className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Eklavya</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links hide-mobile">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to={dashboardLink} className="btn btn-ghost btn-sm hide-mobile">
                <User size={15} />
                Dashboard
              </Link>
              <div className="nav-user hide-mobile">
                <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <span className="nav-name">{user?.name?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="navbar-logout-btn">
                <LogOut size={15} />
                <span className="hide-mobile">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" id="navbar-join-btn">
              Join
            </Link>
          )}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} id="navbar-menu-toggle">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to={dashboardLink}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        show={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </nav>
  )
}

export default Navbar
