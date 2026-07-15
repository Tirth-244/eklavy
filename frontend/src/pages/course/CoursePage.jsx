import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Lock, Play, FileText, CheckCircle, ShoppingCart, Atom, FlaskConical, Calculator, Clock, BookOpen, ArrowLeft
} from 'lucide-react'
import ReactPlayer from 'react-player'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import ChapterList from '../../components/ChapterList'
import { courseAPI } from '../../api/course.api'
import { chapterAPI } from '../../api/chapter.api'
import { paymentAPI } from '../../api/payment.api'
import { progressAPI } from '../../api/progress.api'
import { purchaseAPI } from '../../api/purchase.api'
import { useAuth } from '../../context/AuthContext'
import './CoursePage.css'

const SUBJECT_META = {
  Physics: { icon: Atom, color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', emoji: '⚛️' },
  Chemistry: { icon: FlaskConical, color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#34d399)', emoji: '🧪' },
  Mathematics: { icon: Calculator, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fcd34d)', emoji: '📐' },
  Biology: { icon: BookOpen, color: '#14b8a6', gradient: 'linear-gradient(135deg,#14b8a6,#2dd4bf)', emoji: '🧬' },
}

const normalizeSubject = (value = 'Physics') => {
  const raw = decodeURIComponent(value || 'Physics').trim()
  const lower = raw.toLowerCase()
  if (lower === 'maths' || lower === 'math' || lower === 'mathematics') return 'Mathematics'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

const CoursePage = () => {
  const { subject } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [isPurchased, setIsPurchased] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [paying, setPaying] = useState(false)
  const [completedIds, setCompletedIds] = useState(new Set())

  const normSubject = normalizeSubject(subject)
  const meta = SUBJECT_META[normSubject] || SUBJECT_META.Physics

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingCourse(true)
      try {
        const [courseRes, chaptersRes] = await Promise.all([
          courseAPI.getBySubject(normSubject),
          chapterAPI.getBySubject(normSubject).catch(() => ({ data: { data: [] } })),
        ])
        const fetchedCourse = courseRes.data.data
        setCourse(fetchedCourse)

        const fetchedChapters = chaptersRes.data.data || []
        setChapters(fetchedChapters)

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
  }, [normSubject, isAuthenticated])

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
        description: `${normSubject} Full Course`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await paymentAPI.verify({ ...response, courseId: course._id })
            toast.success('Payment successful! Course unlocked 🎉')
            setIsPurchased(true)
            const chaptersRes = await chapterAPI.getBySubject(normSubject)
            setChapters(chaptersRes.data.data || [])
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

  const demoContent = chapters.filter((c) => c.isFree)
  const premiumContent = chapters.filter((c) => !c.isFree)

  if (loadingCourse) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading {normSubject} course…</p>
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
              <h1 className="course-header-title">{course?.subject || normSubject}</h1>
              <p className="course-header-desc">{course?.description || `Complete ${normSubject} curriculum for Board exams and competitive tests.`}</p>
              <div className="course-header-meta">
                <span><BookOpen size={14} /> {chapters.length} Chapters</span>
                <span><Play size={14} /> {demoContent.length} Free</span>
                <span><Lock size={14} /> {premiumContent.length} Premium</span>
              </div>
            </div>
          </div>
          {!isPurchased && (
            <div className="course-buy-box">
              <div className="buy-price">₹{course?.price || 999}<span>/lifetime</span></div>
              <ul className="buy-includes">
                <li><CheckCircle size={14} /> {chapters.length} detailed chapters</li>
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
                {paying ? 'Processing…' : `Buy ${normSubject} Course`}
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
        <div className="video-player-section animate-fade-in" style={{ position: 'relative' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideo(null)} id="course-video-back">
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideo(null)} id="course-video-close">
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
                onEnded={() => {
                  if (isAuthenticated) handleMarkComplete(selectedVideo._id)
                }}
              />
            </div>
            <div className="video-info">
              <h3>{selectedVideo.titleGu} ({selectedVideo.titleEn})</h3>
              <div className="video-meta">
                <span className={`badge badge-${selectedVideo.isFree ? 'emerald' : 'indigo'}`}>
                  {selectedVideo.isFree ? 'Free Demo' : 'Premium'}
                </span>
                {completedIds.has(selectedVideo._id) && (
                  <span className="badge badge-gold"><CheckCircle size={12} /> Completed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="container content-section">
        {/* Full Syllabus Section */}
        <div className="content-group">
          <ChapterList 
            chapters={chapters} 
            subject={normSubject} 
            isPurchased={isPurchased} 
            courseId={course?._id} 
            onChapterClick={(ch) => setSelectedVideo(ch)}
          />
        </div>

        {chapters.length === 0 && (
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

export default CoursePage
