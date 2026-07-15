import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff, Zap, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/auth.api'
import './Auth.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const email = location.state?.email
  const resetToken = location.state?.resetToken

  // If email or resetToken is missing, redirect to forgot-password
  useEffect(() => {
    if (!email || !resetToken) {
      toast.error('Session expired. Please initiate forgot password again.', { id: 'missing-reset-token' })
      navigate('/forgot-password', { replace: true })
    }
  }, [email, resetToken, navigate])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [strength, setStrength] = useState({ score: 0, label: 'Too short', color: 'var(--accent-rose)' })

  // Calculate password strength dynamically
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: 'Empty', color: 'var(--text-muted)' })
      return
    }

    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    let label = 'Weak'
    let color = 'var(--accent-rose)'

    if (password.length < 6) {
      label = 'Too short (Min. 6)'
      color = 'var(--accent-rose)'
    } else if (score <= 2) {
      label = 'Weak'
      color = '#ef4444'
    } else if (score <= 4) {
      label = 'Medium'
      color = 'var(--accent-gold)'
    } else {
      label = 'Strong'
      color = '#22c55e'
    }

    setStrength({ score, label, color })
  }, [password])

  const validate = () => {
    const e = {}
    if (!password || password.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }
    if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { data } = await authAPI.resetPassword(email, resetToken, password)
      
      // Auto authenticate user on success
      login(data.user, data.token)
      toast.success('Password reset successful! Welcome to Eklavya. 🎓')
      
      // Redirect to home/dashboard
      if (data.user.role === 'teacher') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please try again.')
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

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Choose a secure, strong password for your account.</p>

        <form onSubmit={handleSubmit} className="auth-form" id="reset-password-form">
          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="reset-password"
                type={showPass ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-icon-right ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPass(!showPass)}
                id="toggle-reset-password-visibility"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div style={{ marginTop: '-4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
              {strength.label.includes('Strong') ? (
                <ShieldCheck size={14} style={{ color: strength.color }} />
              ) : strength.label.includes('Too short') || strength.label.includes('Weak') ? (
                <ShieldAlert size={14} style={{ color: strength.color }} />
              ) : (
                <Shield size={14} style={{ color: strength.color }} />
              )}
              <span style={{ color: 'var(--text-muted)' }}>Strength: </span>
              <strong style={{ color: strength.color }}>{strength.label}</strong>
            </div>
          )}

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="reset-confirm-password"
                type={showConfirmPass ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-icon-right ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                id="toggle-reset-confirm-password-visibility"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="reset-submit-btn"
            style={{ marginTop: '8px' }}
          >
            {loading ? <><span className="btn-spinner" /> Resetting…</> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
