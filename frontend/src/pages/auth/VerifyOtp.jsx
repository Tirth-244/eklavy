import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, Zap, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth.api'
import './Auth.css'

const VerifyOtp = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  // If email is missing, redirect to forgot-password
  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please initiate forgot password again.', { id: 'missing-email' })
      navigate('/forgot-password', { replace: true })
    }
  }, [email, navigate])

  const [otp, setOtp] = useState(new Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  
  // Cooldown & Expiry timers
  const [resendCooldown, setResendCooldown] = useState(60)
  const [expiryTime, setExpiryTime] = useState(600) // 10 minutes
  const [isExpired, setIsExpired] = useState(false)

  const inputRefs = useRef([])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (expiryTime > 0) {
      const timer = setTimeout(() => setExpiryTime(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsExpired(true)
    }
  }, [expiryTime])

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (element, index) => {
    const val = element.value.replace(/[^0-9]/g, '')
    if (!val) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }

    const digit = val[val.length - 1]
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Automatically focus next input
    if (index < 5 && val) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1].focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pastedData.length === 0) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)

    const focusIndex = Math.min(pastedData.length, 5)
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus()
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setResendLoading(true)
    try {
      const { data } = await authAPI.forgotPassword(email)
      toast.success(data.message || 'OTP code resent successfully!')
      setOtp(new Array(6).fill(''))
      setResendCooldown(60)
      setExpiryTime(600)
      setIsExpired(false)
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      toast.error('Please enter all 6 digits of the OTP code.')
      return
    }
    if (isExpired) {
      toast.error('This OTP has expired. Please request a new code.')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.verifyOtp(email, otpCode)
      toast.success('OTP verified successfully! Reset your password.')
      navigate('/reset-password', {
        state: { email, resetToken: data.resetToken },
        replace: true
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const formatExpiryTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

        <h1 className="auth-title">Verify OTP</h1>
        <p className="auth-subtitle">
          We have sent a 6-digit OTP code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="auth-form" id="otp-form">
          <div className="otp-inputs-container">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={handlePaste}
                ref={(el) => (inputRefs.current[idx] = el)}
                className={`otp-input ${isExpired ? 'input-error' : ''}`}
                disabled={loading || isExpired}
              />
            ))}
          </div>

          <div className="timer-text">
            {isExpired ? (
              <span style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>OTP has expired</span>
            ) : (
              <>OTP expires in <span className="timer-highlight">{formatExpiryTime(expiryTime)}</span></>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || isExpired}
            id="otp-submit-btn"
          >
            {loading ? <><span className="btn-spinner" /> Verifying…</> : 'Verify & Continue'}
          </button>
        </form>

        <div className="timer-text" style={{ marginTop: '20px' }}>
          {resendCooldown > 0 ? (
            <span>Resend OTP in <strong className="timer-highlight">{resendCooldown}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              id="resend-otp-btn"
            >
              {resendLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
              Resend OTP Code
            </button>
          )}
        </div>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <Link to="/forgot-password" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Change email address
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyOtp
