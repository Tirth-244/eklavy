import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth.api'
import './Auth.css'

const GoogleIcon = () => (
  <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"
    />
    <path
      fill="#34A853"
      d="M16.04 15.345c-1.077.733-2.457 1.164-4.04 1.164-2.955 0-5.46-1.982-6.355-4.654L1.605 15c1.94 3.905 5.99 6.5 10.395 6.5 2.923 0 5.614-.973 7.64-2.655l-3.59-2.836z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.275c0-.825-.073-1.62-.21-2.385H12v4.51h6.44c-.277 1.455-1.1 2.69-2.33 3.515l3.59 2.836c2.1-1.936 3.3-4.786 3.3-8.476z"
    />
    <path
      fill="#FBBC05"
      d="M5.645 11.855A6.877 6.877 0 0 1 5.645 10.15L1.62 7.03c-.62 1.25-.97 2.66-.97 4.145s.35 2.895.97 4.145l4.025-3.12z"
    />
  </svg>
)

const GithubIcon = () => (
  <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
)

const Signup = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message, { id: 'redirect-msg' })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const validate = () => {
    const e = {}
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      toast.success(data.message || 'Verification email sent! Please check your email to verify your account. 🎓', {
        duration: 8000
      })
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      if (msg === 'User already exists. Please login instead.') {
        navigate('/login', { state: { message: msg } })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    window.location.href = `${apiBase}/api/auth/google`
  }

  const handleGithubLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    window.location.href = `${apiBase}/api/auth/github`
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-card animate-scale-in">
        <div className="auth-logo">
          <Zap size={28} className="auth-logo-icon" />
          <span>Eklavya</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of students mastering Science</p>

        <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                className={`form-input input-with-icon ${errors.name ? 'input-error' : ''}`}
                placeholder="Arjun Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="signup-email"
                type="email"
                className={`form-input input-with-icon ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-icon-right ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPass(!showPass)}
                id="toggle-signup-password"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="signup-submit-btn"
            style={{ marginTop: '8px' }}
          >
            {loading ? <><span className="btn-spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="oauth-buttons">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn oauth-btn btn-full"
            id="google-signup-btn"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            type="button"
            onClick={handleGithubLogin}
            className="btn oauth-btn btn-full"
            id="github-signup-btn"
          >
            <GithubIcon /> Continue with GitHub
          </button>
        </div>

        <div className="auth-footer">
          <p>Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
