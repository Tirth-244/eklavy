import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Lock, Play, FileText, CheckCircle, ShoppingCart, Atom, FlaskConical, Calculator, Clock, BookOpen
} from 'lucide-react'
import ReactPlayer from 'react-player'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import ChapterList from '../../components/ChapterList'
import { courseAPI } from '../../api/course.api'
import { contentAPI } from '../../api/content.api'
import { paymentAPI } from '../../api/payment.api'
import { progressAPI } from '../../api/progress.api'
import { purchaseAPI } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
import { GUJARAT_SYLLABUS } from '../../data/gujaratSyllabus'
import './CoursePage.css'

const SUBJECT_META = {
  Physics: { icon: Atom, color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', emoji: '⚛️' },
  Chemistry: { icon: FlaskConical, color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#34d399)', emoji: '🧪' },
  Maths: { icon: Calculator, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fcd34d)', emoji: '📐' },
}

const CoursePage = () => {
  const { subject } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [course, setCourse] = useState(null)
  const [contents, setContents] = useState([])
  const [isPurchased, setIsPurchased] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [paying, setPaying] = useState(false)
  const [completedIds, setCompletedIds] = useState(new Set())

  const normSubject = subject ? subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase() : 'Physics'
  const meta = SUBJECT_META[normSubject] || SUBJECT_META.Physics
  const syllabusData = GUJARAT_SYLLABUS[normSubject]
  const chapters = syllabusData?.chapters || []

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingCourse(true)
      try {
        const [courseRes, contentRes] = await Promise.all([
          courseAPI.getBySubject(subject),
          contentAPI.getByCourse('').catch(() => ({ data: { data: [], hasPurchased: false } })),
        ])
        const fetchedCourse = courseRes.data.data
        setCourse(fetchedCourse)

        const contentFetch = await contentAPI.getByCourse(fetchedCourse._id)
        setContents(contentFetch.data.data || [])

        if (isAuthenticated) {
          try {
            const purchaseRes = await purchaseAPI.getStatus(fetchedCourse._id)
            setIsPurchased(purchaseRes.data.isPurchased)
          } catch (err) {
            console.error('Failed to fetch purchase status', err)
          }
        }

        if (isAuthenticated) {
          const progressRes = await progressAPI.getMy()
          const ids = new Set(progressRes.data.data.map((p) => p.contentId?._id || p.contentId))
          setCompletedIds(ids)
        }
      } catch {
        toast.error('Failed to load course details')
      } finally {
        setLoadingCourse(false)
      }
    }
    fetchAll()
  }, [subject, isAuthenticated])

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast('Please login to purchase', { icon: '🔐' })
      return navigate('/login')
    }
    setPaying(true)
    try {
      const { data } = await paymentAPI.createOrder(course._id)
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'Eklavya Education',
        description: `${subject} Full Course`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await paymentAPI.verify({ ...response, courseId: course._id })
            toast.success('Payment successful! Course unlocked 🎉')
            setIsPurchased(true)
            const contentFetch = await contentAPI.getByCourse(course._id)
            setContents(contentFetch.data.data || [])
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#f59e0b' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.')
    } finally {
      setPaying(false)
    }
  }

  const handleMarkComplete = async (contentId) => {
    try {
      await progressAPI.markComplete(contentId)
      setCompletedIds((prev) => new Set([...prev, contentId]))
      toast.success('Marked as complete ✓')
    } catch {
      toast.error('Failed to mark as complete')
    }
  }

  const demoContent = contents.filter((c) => c.type === 'demo')
  const premiumContent = contents.filter((c) => c.type === 'premium')

  if (loadingCourse) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading {subject} course…</p>
      </div>
    )
  }

  return (
    <div className="course-page">
      <Navbar />

      {/* Course Header */}
      <div className="course-header" style={{ '--subject-gradient': meta.gradient, '--subject-color': meta.color }}>
        <div className="course-header-bg" />
        <div className="container course-header-content animate-fade-in">
          <div className="course-header-left">
            <div className="subject-icon-lg" style={{ background: meta.gradient }}>
              <meta.icon size={36} color="#fff" />
            </div>
            <div>
              <div className="course-header-badge">{meta.emoji} 11th – 12th Science</div>
              <h1 className="course-header-title">{subject}</h1>
              <p className="course-header-desc">{course?.description || `Complete ${subject} curriculum for Board exams and competitive tests.`}</p>
              <div className="course-header-meta">
                <span><BookOpen size={14} /> {course?.totalLectures || contents.length} Lectures</span>
                <span><Play size={14} /> {demoContent.length} Free</span>
                <span><Lock size={14} /> {premiumContent.length} Premium</span>
              </div>
            </div>
          </div>
          {!isPurchased && (
            <div className="course-buy-box">
              <div className="buy-price">₹{course?.price || 999}<span>/lifetime</span></div>
              <ul className="buy-includes">
                <li><CheckCircle size={14} /> {contents.length} video lectures</li>
                <li><CheckCircle size={14} /> Downloadable PDF notes</li>
                <li><CheckCircle size={14} /> Progress tracking</li>
                <li><CheckCircle size={14} /> Lifetime access</li>
              </ul>
              <button
                className="btn btn-primary btn-full"
                onClick={handleBuy}
                disabled={paying}
                id="buy-course-btn"
              >
                <ShoppingCart size={16} />
                {paying ? 'Processing…' : `Buy ${subject} Course`}
              </button>
            </div>
          )}
          {isPurchased && (
            <div className="course-buy-box purchased">
              <CheckCircle size={40} className="purchased-icon" />
              <div className="purchased-title">Course Purchased</div>
              <p>You have full access to all lectures.</p>
            </div>
          )}
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
                onEnded={() => {
                  if (isAuthenticated) handleMarkComplete(selectedVideo._id)
                }}
              />
            </div>
            <div className="video-info">
              <h3>{selectedVideo.title}</h3>
              <div className="video-meta">
                <span className={`badge badge-${selectedVideo.type === 'demo' ? 'emerald' : 'indigo'}`}>
                  {selectedVideo.type}
                </span>
                {selectedVideo.duration && (
                  <span className="video-duration"><Clock size={13} /> {selectedVideo.duration}</span>
                )}
                {completedIds.has(selectedVideo._id) && (
                  <span className="badge badge-gold"><CheckCircle size={12} /> Completed</span>
                )}
              </div>
              {selectedVideo.notesUrl && (
                <a href={selectedVideo.notesUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <FileText size={14} /> Download Notes
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="container content-section">
        {/* Demo */}
        {demoContent.length > 0 && (
          <div className="content-group">
            <div className="content-group-header">
              <Play size={18} fill="currentColor" style={{ color: 'var(--accent-emerald)' }} />
              <h2>Free Demo Lectures</h2>
              <span className="badge badge-emerald">{demoContent.length} free</span>
            </div>
            <div className="content-list">
              {demoContent.map((item, idx) => (
                <ContentItem
                  key={item._id}
                  item={item}
                  idx={idx}
                  selected={selectedVideo?._id === item._id}
                  completed={completedIds.has(item._id)}
                  locked={false}
                  onClick={() => setSelectedVideo(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Premium */}
        {premiumContent.length > 0 && (
          <div className="content-group">
            <div className="content-group-header">
              <Lock size={18} style={{ color: 'var(--accent-indigo-light)' }} />
              <h2>Premium Lectures</h2>
              <span className="badge badge-indigo">{premiumContent.length} lectures</span>
            </div>
            <div className="content-list">
              {premiumContent.map((item, idx) => (
                <ContentItem
                  key={item._id}
                  item={item}
                  idx={demoContent.length + idx}
                  selected={selectedVideo?._id === item._id}
                  completed={completedIds.has(item._id)}
                  locked={item.locked}
                  onClick={() => {
                    if (item.locked) {
                      toast('Purchase the course to unlock this lecture', { icon: '🔒' })
                    } else {
                      setSelectedVideo(item)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full Syllabus Section */}
        <div className="content-group" style={{ marginTop: '40px' }}>
          <ChapterList chapters={chapters} subject={normSubject} isPurchased={isPurchased} courseId={course?._id} />
        </div>

        {contents.length === 0 && (
          <div className="empty-content">
            <span style={{ fontSize: '3rem' }}>📚</span>
            <h3>Content Coming Soon</h3>
            <p>The teacher is preparing lectures for this course. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ContentItem = ({ item, idx, selected, completed, locked, onClick }) => (
  <div
    className={`content-item ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
    onClick={onClick}
    id={`content-item-${item._id}`}
    role="button"
    tabIndex={0}
  >
    <div className="content-item-num">{String(idx + 1).padStart(2, '0')}</div>
    <div className="content-item-icon">
      {locked ? <Lock size={15} /> : completed ? <CheckCircle size={15} color="var(--accent-emerald)" /> : <Play size={15} />}
    </div>
    <div className="content-item-info">
      <span className="content-item-title">{item.title}</span>
      <div className="content-item-meta">
        {item.duration && <span><Clock size={11} /> {item.duration}</span>}
        {item.notesUrl && <span><FileText size={11} /> Notes</span>}
      </div>
    </div>
    {locked && <span className="content-lock-badge"><Lock size={11} /> Purchase to unlock</span>}
    {completed && !locked && <CheckCircle size={16} color="var(--accent-emerald)" />}
  </div>
)

export default CoursePage
