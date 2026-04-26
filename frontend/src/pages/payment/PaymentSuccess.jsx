import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Home } from 'lucide-react'
import Navbar from '../../components/Navbar'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const failed = params.get('status') === 'failed'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: '24px',
          textAlign: 'center',
        }}
        className="animate-scale-in"
      >
        {failed ? (
          <>
            <XCircle size={72} color="var(--accent-rose)" style={{ marginBottom: '24px' }} />
            <h1 style={{ marginBottom: '12px' }}>Payment Failed</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '32px' }}>
              Your payment could not be processed. No amount has been deducted.
              Please try again or contact support.
            </p>
          </>
        ) : (
          <>
            <CheckCircle
              size={72}
              color="var(--accent-emerald)"
              style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.4))' }}
            />
            <h1 style={{ marginBottom: '12px' }}>Payment Successful! 🎉</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '32px' }}>
              Your course is now unlocked. Start learning and track your progress from the dashboard.
            </p>
          </>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/home')}>
            <Home size={15} /> Home
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/student/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
