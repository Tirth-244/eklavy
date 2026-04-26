import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Play, Clock, ArrowLeft, Lock, Unlock, Atom, FlaskConical, Calculator } from 'lucide-react'
import ReactPlayer from 'react-player'
import Navbar from '../../components/Navbar'
import ChapterList from '../../components/ChapterList'
import { courseAPI } from '../../api/course.api'
import { contentAPI } from '../../api/content.api'
import { useAuth } from '../../context/AuthContext'
import { GUJARAT_SYLLABUS } from '../../data/gujaratSyllabus'
import './CoursePage.css'
import './DemoPage.css'

const SUBJECT_META = {
  Physics: {
    icon: Atom,
    gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
    color: '#6366f1',
    emoji: '⚛️',
  },
  Chemistry: {
    icon: FlaskConical,
    gradient: 'linear-gradient(135deg,#10b981,#34d399)',
    color: '#10b981',
    emoji: '🧪',
  },
  Maths: {
    icon: Calculator,
    gradient: 'linear-gradient(135deg,#f59e0b,#fcd34d)',
    color: '#f59e0b',
    emoji: '📐',
  },
}

const DemoPage = () => {
  const { subject } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  // Normalise capitalisation: "physics" → "Physics"
  const normSubject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase()
  const meta = SUBJECT_META[normSubject] || SUBJECT_META.Physics

  const [course, setCourse] = useState(null)
  const [demoContent, setDemoContent] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // Get syllabus data for this subject
  const syllabusData = GUJARAT_SYLLABUS[normSubject]
  const chapters = syllabusData?.chapters || []

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await courseAPI.getBySubject(normSubject)
        const fetchedCourse = courseRes.data.data
        setCourse(fetchedCourse)

        // Fetch content — unauthenticated, demo items only
        const contentRes = await contentAPI.getByCourse(fetchedCourse._id)
        const demos = (contentRes.data.data || []).filter((c) => c.type === 'demo')
        setDemoContent(demos)

        // Auto-select the first demo
        if (demos.length > 0) setSelectedVideo(demos[0])
      } catch {
        // Course may not exist yet — show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [normSubject])

  const SubjectIcon = meta.icon

  return (
    <div className="course-page demo-page">
      <Navbar />

      {/* Header */}
      <div
        className="course-header demo-header"
        style={{ '--subject-gradient': meta.gradient, '--subject-color': meta.color }}
      >
        <div className="course-header-bg" />
        <div className="container demo-header-inner animate-fade-in">
          <Link to="/" className="demo-back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="course-header-left">
            <div className="subject-icon-lg" style={{ background: meta.gradient }}>
              <SubjectIcon size={36} color="#fff" />
            </div>
            <div>
              <div className="course-header-badge">{meta.emoji} Free Demo Lectures</div>
              <h1 className="course-header-title">{normSubject}</h1>
              <p className="course-header-desc">
                Watch these free demo classes to experience our teaching style before enrolling.
              </p>
              <div className="demo-cta-chips">
                <Link to="/signup" className="btn btn-primary btn-sm" id="demo-signup-btn">
                  Join Free → Full Access
                </Link>
                <Link to="/login" className="btn btn-ghost btn-sm" id="demo-login-btn">
                  Already a member? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <div className="video-player-section animate-fade-in">
          <div className="container">
            <div className="video-wrapper">
              <ReactPlayer
                url={selectedVideo.videoUrl}
                controls
                width="100%"
                height="100%"
                style={{ borderRadius: '12px', overflow: 'hidden' }}
              />
            </div>
            <div className="video-info">
              <h3>{selectedVideo.title}</h3>
              <div className="video-meta">
                <span className="badge badge-emerald">Free Demo</span>
                {selectedVideo.duration && (
                  <span className="video-duration">
                    <Clock size={13} /> {selectedVideo.duration}
                  </span>
                )}
              </div>
              {selectedVideo.description && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {selectedVideo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="container content-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Demo lectures */}
            {demoContent.length > 0 ? (
              <div className="content-group">
                <div className="content-group-header">
                  <Play size={18} fill="currentColor" style={{ color: 'var(--accent-emerald)' }} />
                  <h2>Free Demo Lectures</h2>
                  <span className="badge badge-emerald">{demoContent.length} free</span>
                </div>
                <div className="content-list">
                  {demoContent.map((item, idx) => (
                    <div
                      key={item._id}
                      className={`content-item ${selectedVideo?._id === item._id ? 'selected' : ''}`}
                      onClick={() => setSelectedVideo(item)}
                      role="button"
                      tabIndex={0}
                      id={`demo-item-${item._id}`}
                    >
                      <div className="content-item-num">{String(idx + 1).padStart(2, '0')}</div>
                      <div className="content-item-icon">
                        <Play size={15} />
                      </div>
                      <div className="content-item-info">
                        <span className="content-item-title">{item.title}</span>
                        {item.duration && (
                          <div className="content-item-meta">
                            <span><Clock size={11} /> {item.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-content">
                <span style={{ fontSize: '3rem' }}>📚</span>
                <h3>No Demo Lectures Yet</h3>
                <p>The teacher is preparing demo content for {normSubject}. Check back soon!</p>
              </div>
            )}

            {/* Unlock Full Course Section */}
            <div className="unlock-course-section">
              {!isUnlocked ? (
                <div className="demo-premium-teaser">
                  <div className="teaser-icon">
                    <Lock size={28} color="var(--accent-gold)" />
                  </div>
                  <div className="teaser-content">
                    <h3>Unlock Full {normSubject} Course</h3>
                    <p>
                      {syllabusData?.label} — ગુજરાત બોર્ડ અભ્યાસક્રમ (ધોરણ 11-12).
                      Get access to all {chapters.length} chapters, premium lectures, PDF notes and progress tracking.
                    </p>
                  </div>
                  <div className="teaser-actions">
                    <button
                      className="btn btn-primary"
                      id={`unlock-btn-${normSubject.toLowerCase()}`}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login')
                        } else {
                          setIsUnlocked(true)
                        }
                      }}
                    >
                      <Unlock size={16} />
                      Unlock Full {normSubject} Course
                    </button>
                  </div>
                </div>
              ) : (
                <ChapterList chapters={chapters} subject={normSubject} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DemoPage
