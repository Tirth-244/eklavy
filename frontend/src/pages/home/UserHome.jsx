import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, BookOpen, Trophy, Atom, FlaskConical, Calculator } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Chatbot from '../../components/Chatbot'
import { useAuth } from '../../context/AuthContext'
import { purchaseAPI } from '../../api/purchase.api'
import './Home.css'

const SUBJECT_CARDS = [
  { subject: 'Physics', icon: Atom, emoji: '⚛️', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'var(--physics-color)', glow: 'var(--physics-glow)' },
  { subject: 'Chemistry', icon: FlaskConical, emoji: '🧪', gradient: 'linear-gradient(135deg, #10b981, #34d399)', color: 'var(--chemistry-color)', glow: 'var(--chemistry-glow)' },
  { subject: 'Mathematics', icon: Calculator, emoji: '📐', gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)', color: 'var(--maths-color)', glow: 'var(--maths-glow)' },
  { subject: 'Biology', icon: BookOpen, emoji: '🧬', gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)', color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.35)' },
]

const UserHome = () => {
  const { user, isTeacher } = useAuth()
  const dashboardLink = isTeacher ? '/teacher/dashboard' : '/user'
  const firstName = user?.name?.split(' ')[0] || 'Student'
  
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchLink, setWatchLink] = useState('/course/Physics')

  useEffect(() => {
    if (user && !isTeacher) {
      purchaseAPI.getMy()
        .then(res => {
          const fetchedPurchases = res.data.data || []
          setPurchases(fetchedPurchases)
          if (fetchedPurchases.length > 0) {
            const sub = fetchedPurchases[0].courseId?.subject || 'Physics'
            setWatchLink(`/course/${sub}`)
          } else {
            const randomSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
            setWatchLink(`/course/${randomSubjects[Math.floor(Math.random() * randomSubjects.length)]}`)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, isTeacher])

  const purchasedSubjects = purchases.map(p => p.courseId?.subject).filter(Boolean)
  const displaySubjects = SUBJECT_CARDS.filter(c => purchasedSubjects.includes(c.subject))

  return (
    <div className="home">
      <Navbar />

      {/* ── Welcome Hero ── */}
      <section className="hero" style={{ minHeight: '60vh' }}>
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content animate-fade-in">
          <div className="hero-badge">
            <Trophy size={12} fill="currentColor" />
            <span>Welcome back!</span>
          </div>
          <h1 className="hero-title">
            Hey{' '}
            <span className="gradient-text">{firstName}</span> 👋
            <br />Ready to learn today?
          </h1>
          <p className="hero-subtitle">
            Pick up where you left off or explore new subjects. Your progress is saved automatically.
          </p>
          <div className="hero-cta">
            <Link to={dashboardLink} className="btn btn-primary btn-lg" id="userhome-dashboard-btn">
              <BookOpen size={18} />
              Go to Dashboard
            </Link>
            <Link to={watchLink} className="btn btn-ghost btn-lg" id="userhome-demo-btn">
              <Play size={16} fill="currentColor" />
              Watch a Lecture
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick Access Courses ── */}
      <section className="section courses-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Quick Access</span>
            <h2 className="section-title">Your Subjects</h2>
            <p className="section-subtitle">
              Jump directly into a course or check out the free demo lectures.
            </p>
          </div>
          <div className="courses-grid">
            {!loading && displaySubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-muted)' }}>not purchase cource you can access quick access here</p>
                <Link to="/course/Physics" className="btn btn-primary" style={{ marginTop: '16px' }}>View All Courses</Link>
              </div>
            ) : (
              displaySubjects.map(({ subject, icon: Icon, emoji, gradient, color, glow }) => (
                <div
                  key={subject}
                  className="course-card"
                  style={{ '--card-color': color, '--card-glow': glow }}
                >
                  <div className="course-card-top">
                    <div className="course-icon-wrap" style={{ background: gradient }}>
                      <Icon size={28} color="#fff" />
                    </div>
                    <span className="course-emoji">{emoji}</span>
                  </div>
                  <h3 className="course-name">{subject}</h3>
                  <div className="course-card-actions">
                    <Link
                      to={`/course/${subject.toLowerCase()}/demo`}
                      className="btn btn-ghost btn-sm course-demo-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play size={13} fill="currentColor" /> Demo
                    </Link>
                    <Link
                      to={`/course/${subject}`}
                      className="btn btn-sm course-explore-btn"
                      style={{ background: gradient, color: '#fff', border: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open <ArrowRight size={13} />
                    </Link>
                  </div>
                  <div className="course-card-glow" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <span className="footer-logo">⚡ Eklavya</span>
          <p>© {new Date().getFullYear()} Eklavya Education. All rights reserved.</p>
        </div>
      </footer>
      <Chatbot />
    </div>
  )
}

export default UserHome
