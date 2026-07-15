import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Zap, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth.api'
import './Auth.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!email) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email address')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { data } = await authAPI.forgotPassword(email)
      toast.success(data.message || 'OTP sent! Please check your email.')
      // Redirect to OTP verification page and pass the email
      navigate('/verify-otp', { state: { email } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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

        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a 6-digit OTP code to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form" id="forgot-password-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="forgot-email"
                type="email"
                className={`form-input input-with-icon ${error ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                disabled={loading}
              />
            </div>
            {error && <span className="form-error">{error}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="forgot-submit-btn"
            style={{ marginTop: '8px' }}
          >
            {loading ? <><span className="btn-spinner" /> Sending OTP…</> : 'Send OTP Code'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
