import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Play, Clock, ArrowLeft, Lock, Unlock, Atom, FlaskConical, Calculator } from 'lucide-react'
import ReactPlayer from 'react-player'
import Navbar from '../../components/Navbar'
import ChapterList from '../../components/ChapterList'
import { courseAPI } from '../../api/course.api'
import { chapterAPI } from '../../api/chapter.api'
import { purchaseAPI } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
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
  const [chapters, setChapters] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPurchased, setIsPurchased] = useState(false)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await courseAPI.getBySubject(normSubject)
        const fetchedCourse = courseRes.data.data
        setCourse(fetchedCourse)

        // Fetch chapters
        const chaptersRes = await chapterAPI.getBySubject(normSubject)
        const allChapters = chaptersRes.data.data || []
        setChapters(allChapters)

        if (isAuthenticated) {
          try {
            const purchaseRes = await purchaseAPI.getStatus(fetchedCourse._id)
            setIsPurchased(purchaseRes.data.isPurchased)
          } catch (err) {
            console.error('Failed to fetch purchase status', err)
          }
        }

        // Auto-select the first free chapter if available
        const freeChapters = allChapters.filter(c => c.isFree)
        if (freeChapters.length > 0) setSelectedVideo(freeChapters[0])
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
        <div className="video-player-section animate-fade-in" style={{ position: 'relative' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideo(null)} id="video-back-btn">
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideo(null)} id="video-close-btn">
                <span style={{ fontSize: '1rem' }}>❌</span> Close
              </button>
            </div>
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
              <h3>{selectedVideo.titleGu} ({selectedVideo.titleEn})</h3>
              <div className="video-meta">
                {selectedVideo.isFree ? (
                  <span className="badge badge-emerald">Free Demo</span>
                ) : (
                  <span className="badge badge-indigo">Premium Chapter</span>
                )}
              </div>
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
            {/* Unlock Full Course Section */}
            <div className="unlock-course-section">
              <ChapterList 
                chapters={chapters} 
                subject={normSubject} 
                isPurchased={isPurchased} 
                courseId={course?._id} 
                onChapterClick={(ch) => setSelectedVideo(ch)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DemoPage
