import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { authAPI } from '../../api/auth.api'
import './Auth.css'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email address...')
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided. Check your link.')
        return
      }
      try {
        const { data } = await authAPI.verifyEmail(token)
        setStatus('success')
        setMessage(data.message || 'Your email has been successfully verified!')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.')
      }
    }
    verifyToken()
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-card animate-scale-in" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ justifyContent: 'center' }}>
          <Zap size={28} className="auth-logo-icon" />
          <span>Eklavya</span>
        </div>

        {status === 'verifying' && (
          <div style={{ padding: '20px 0' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-gold)', margin: '0 auto 16px auto' }} />
            <h1 className="auth-title" style={{ fontSize: '1.4rem' }}>Verifying Email</h1>
            <p className="auth-subtitle" style={{ marginBottom: 0 }}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '20px 0' }}>
            <CheckCircle2 size={54} style={{ color: '#22c55e', margin: '0 auto 16px auto', filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.3))' }} />
            <h1 className="auth-title" style={{ fontSize: '1.4rem' }}>Verification Successful</h1>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '20px 0' }}>
            <XCircle size={54} style={{ color: 'var(--accent-rose)', margin: '0 auto 16px auto', filter: 'drop-shadow(0 0 8px rgba(244,63,94,0.3))' }} />
            <h1 className="auth-title" style={{ fontSize: '1.4rem' }}>Verification Failed</h1>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-secondary btn-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginBottom: '12px' }}>
              Back to Sign In
            </Link>
            <p className="auth-footer" style={{ margin: 0 }}>
              Need a new link? Register again or login to request a resend.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
