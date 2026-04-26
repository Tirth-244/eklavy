import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, BookOpen, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/course/Physics', label: 'Physics' },
    { to: '/course/Chemistry', label: 'Chemistry' },
    { to: '/course/Maths', label: 'Maths' },
  ]

  const dashboardLink = user?.role === 'teacher' ? '/teacher/dashboard' : '/user'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
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
    </nav>
  )
}

export default Navbar
