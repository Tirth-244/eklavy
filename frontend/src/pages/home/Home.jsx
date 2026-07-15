import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, BookOpen, Users, Trophy, Star, Atom, FlaskConical, Calculator } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { courseAPI } from '../../api/course.api'
import { useAuth } from '../../context/AuthContext'
import './Home.css'

const SUBJECT_META = {
  Physics: {
    icon: Atom,
    color: 'var(--physics-color)',
    glow: 'var(--physics-glow)',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    desc: 'Mechanics, Thermodynamics, Optics, Electrostatics & Modern Physics',
    emoji: '⚛️',
  },
  Chemistry: {
    icon: FlaskConical,
    color: 'var(--chemistry-color)',
    glow: 'var(--chemistry-glow)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    desc: 'Organic, Inorganic & Physical Chemistry with reaction mechanisms',
    emoji: '🧪',
  },
  Mathematics: {
    icon: Calculator,
    color: 'var(--maths-color)',
    glow: 'var(--maths-glow)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
    desc: 'Calculus, Algebra, Coordinate Geometry, Probability & Vectors',
    emoji: '📐',
  },
  Biology: {
    icon: BookOpen,
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.35)',
    gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    desc: 'Cell biology, plant physiology, genetics, ecology & human biology',
    emoji: '🧬',
  },
}

const STATS = [
  { icon: Users, value: '2,400+', label: 'Active Students' },
  { icon: Play, value: '850+', label: 'Video Lectures' },
  { icon: BookOpen, value: '3', label: 'Expert Teachers' },
  { icon: Trophy, value: '94%', label: 'Board Success Rate' },
]

const Home = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseAPI.getAll()
      .then(({ data }) => setCourses(data.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  // If backend returns courses, map them; otherwise show placeholder cards from meta
  const displaySubjects = courses.length > 0
    ? courses.map((c) => ({
        ...c,
        meta: SUBJECT_META[c.subject] || {
          icon: BookOpen,
          color: '#6366f1',
          glow: 'rgba(99, 102, 241, 0.4)',
          gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
          desc: 'Comprehensive curriculum and expert guidance.',
          emoji: '📚',
        }
      }))
    : Object.entries(SUBJECT_META).map(([subject, meta]) => ({ subject, meta, price: 999 }))

  return (
    <div className="home">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content animate-fade-in">
          <div className="hero-badge">
            <Star size={12} fill="currentColor" />
            <span>India's #1 Platform for 11th–12th Science</span>
          </div>
          <h1 className="hero-title">
            Learn from the{' '}
            <span className="gradient-text">Best Teachers</span>
            <br />Master Science, Excel in Boards
          </h1>
          <p className="hero-subtitle">
            Expert-led video lectures in Physics, Chemistry & Mathematics.
            Study at your own pace with structured content designed for JEE, NEET & Board exams.
          </p>
          <div className="hero-cta">
            <Link to="/course/Physics/demo" className="btn btn-primary btn-lg" id="hero-explore-btn">
              Explore Courses
              <ArrowRight size={18} />
            </Link>
            <Link to="/course/physics/demo" className="btn btn-ghost btn-lg" id="hero-signup-btn">
              <Play size={16} fill="currentColor" />
              Watch Demo Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="stats-strip">
        <div className="container stats-grid">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="stat-item">
              <Icon size={20} className="stat-item-icon" />
              <div>
                <div className="stat-item-value">{value}</div>
                <div className="stat-item-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Courses ── */}
      <section className="section courses-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Courses</span>
            <h2 className="section-title">Choose Your Subject</h2>
            <p className="section-subtitle">
              Complete curriculum from Chapter 1 to Board exams, taught by experienced educators.
            </p>
          </div>

          {loading ? (
            <div className="courses-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="course-card-skeleton skeleton" style={{ height: '340px' }} />
              ))}
            </div>
          ) : (
            <div className="courses-grid">
              {displaySubjects.map(({ subject, meta, price, _id }) => {
                const Icon = meta.icon
                const demoLink = `/course/${subject}/demo`
                const courseLink = `/course/${subject}`
                return (
                  <div
                    key={subject}
                    className="course-card"
                    id={`course-card-${subject.toLowerCase()}`}
                    style={{ '--card-color': meta.color, '--card-glow': meta.glow }}
                  >
                    <div className="course-card-top">
                      <div
                        className="course-icon-wrap"
                        style={{ background: meta.gradient }}
                      >
                        <Icon size={28} color="#fff" />
                      </div>
                      <span className="course-emoji">{meta.emoji}</span>
                    </div>
                    <h3 className="course-name">{subject}</h3>
                    <p className="course-desc">{meta.desc}</p>
                    <div className="course-footer">
                      <div className="course-price">
                        <span className="price-tag">₹{price || 999}</span>
                        <span className="price-label">/subject</span>
                      </div>
                    </div>
                    <div className="course-card-actions">
                      <Link
                        to={demoLink}
                        className="btn btn-ghost btn-sm course-demo-btn"
                        id={`demo-btn-${subject.toLowerCase()}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Play size={13} fill="currentColor" /> Watch Demo Free
                      </Link>
                      <Link
                        to={courseLink}
                        className="btn btn-sm course-explore-btn"
                        id={`explore-btn-${subject.toLowerCase()}`}
                        style={{ background: meta.gradient, color: '#fff', border: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Explore <ArrowRight size={13} />
                      </Link>
                    </div>
                    <div className="course-card-glow" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Eklavya ── */}
      <section className="section why-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Why Us</span>
            <h2 className="section-title">Built for Serious Students</h2>
          </div>
          <div className="features-grid">
            {[
              { icon: '🎯', title: 'Board + JEE/NEET Ready', desc: 'Curriculum perfectly aligned with CBSE, JEE Mains & NEET syllabus' },
              { icon: '🎬', title: 'HD Video Lectures', desc: 'Studio-quality recordings you can rewatch anytime, anywhere' },
              { icon: '📄', title: 'Detailed Notes', desc: 'Downloadable PDF notes with every lecture for revision' },
              { icon: '🏆', title: 'Track Your Progress', desc: 'Chapter-wise completion tracking and achievement badges' },
              { icon: '🔒', title: 'Lifetime Access', desc: 'Purchase once, access forever — no subscription traps' },
              { icon: '👨‍🏫', title: 'Expert Educators', desc: 'Teachers with 10+ years of coaching top-performing students' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="feature-card">
                <span className="feature-icon">{icon}</span>
                <h4 className="feature-title">{title}</h4>
                <p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-inner">
            <h2>Start Learning Today</h2>
            <p>Join thousands of students already excelling with Eklavya</p>
            <Link to="/signup" className="btn btn-primary btn-lg" id="home-cta-signup">
              Get Started — It's Free <ArrowRight size={18} />
            </Link>
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
    </div>
  )
}

export default Home
