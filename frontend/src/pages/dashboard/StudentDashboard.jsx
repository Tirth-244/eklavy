import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, TrendingUp, Trophy, Play, Lock, CheckCircle, Clock } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { purchaseAPI } from '../../api/payment.api'
import { progressAPI } from '../../api/progress.api'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

const TAB_MAP = { courses: 'courses', progress: 'progress', achievements: 'achievements' }

const StudentDashboard = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [purchases, setPurchases] = useState([])
  const [progress, setProgress] = useState({ data: [], byCourse: {} })
  const [loading, setLoading] = useState(true)

  // Read active tab from URL, default to 'courses'
  const activeTab = TAB_MAP[searchParams.get('tab')] || 'courses'
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchaseRes, progressRes] = await Promise.all([
          purchaseAPI.getMy(),
          progressAPI.getMy(),
        ])
        setPurchases(purchaseRes.data.data || [])
        setProgress(progressRes.data)
      } catch {
        // handled silently
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const completedCount = progress.data?.length || 0
  const subjects = ['Physics', 'Chemistry', 'Maths']
  const purchased = purchases.map((p) => p.courseId?.subject).filter(Boolean)

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dash-subtitle">Continue your learning journey</p>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <BookOpen size={22} color="var(--accent-indigo-light)" />
            </div>
            <div>
              <div className="stat-value">{purchases.length}</div>
              <div className="stat-label">Courses Enrolled</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <CheckCircle size={22} color="var(--accent-gold)" />
            </div>
            <div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Lectures Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <TrendingUp size={22} color="var(--accent-emerald)" />
            </div>
            <div>
              <div className="stat-value">
                {purchases.length > 0
                  ? Math.round((completedCount / (purchases.length * 10)) * 100) + '%'
                  : '0%'}
              </div>
              <div className="stat-label">Overall Progress</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(244,63,94,0.15)' }}>
              <Trophy size={22} color="var(--accent-rose)" />
            </div>
            <div>
              <div className="stat-value">{completedCount >= 10 ? '🥇' : completedCount >= 5 ? '🥈' : '🌱'}</div>
              <div className="stat-label">Achievement Tier</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {['courses', 'progress', 'achievements'].map((tab) => (
            <button
              key={tab}
              className={`dash-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              id={`tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {activeTab === 'courses' && (
              <div className="animate-fade-in">
                <h2 className="dash-section-title">My Courses</h2>
                {purchases.length === 0 ? (
                  <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>📚</span>
                    <h3>No courses yet</h3>
                    <p>Explore our subjects and purchase a course to get started.</p>
                    <Link to="/home" className="btn btn-primary">Browse Courses</Link>
                  </div>
                ) : (
                  <div className="dash-courses-grid">
                    {purchases.map((p) => {
                      const subj = p.courseId?.subject
                      const subjProgress = progress.byCourse[subj]?.length || 0
                      return (
                        <Link
                          key={p._id}
                          to={`/course/${subj}`}
                          className="dash-course-card"
                          id={`my-course-${subj?.toLowerCase()}`}
                        >
                          <div className="dash-course-top">
                            <span className="dash-course-emoji">
                              {subj === 'Physics' ? '⚛️' : subj === 'Chemistry' ? '🧪' : '📐'}
                            </span>
                            <span className="badge badge-gold">Enrolled</span>
                          </div>
                          <h3 className="dash-course-name">{subj}</h3>
                          <div className="dash-course-progress">
                            <div className="progress-meta">
                              <span>{subjProgress} completed</span>
                            </div>
                            <div className="progress-bar-wrapper">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${Math.min(subjProgress * 10, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="dash-course-cta">Continue Learning →</span>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Explore unpurchased courses */}
                <h2 className="dash-section-title" style={{ marginTop: '36px' }}>Available Courses</h2>
                <div className="dash-courses-grid">
                  {subjects.filter((s) => !purchased.includes(s)).map((s) => (
                    <Link
                      key={s}
                      to={`/course/${s}`}
                      className="dash-course-card locked-course"
                      id={`explore-course-${s.toLowerCase()}`}
                    >
                      <div className="dash-course-top">
                        <span className="dash-course-emoji">
                          {s === 'Physics' ? '⚛️' : s === 'Chemistry' ? '🧪' : '📐'}
                        </span>
                        <span className="badge badge-muted">Explore</span>
                      </div>
                      <h3 className="dash-course-name">{s}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Demo lectures available free
                      </p>
                      <span className="dash-course-cta" style={{ color: 'var(--text-muted)' }}>View Course →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="animate-fade-in">
                <h2 className="dash-section-title">Learning Progress</h2>
                {progress.data.length === 0 ? (
                  <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>📊</span>
                    <h3>No activity yet</h3>
                    <p>Start watching a lecture and it will appear here.</p>
                  </div>
                ) : (
                  <div className="progress-list">
                    {progress.data.map((p) => (
                      <div key={p._id} className="progress-item">
                        <CheckCircle size={18} color="var(--accent-emerald)" />
                        <div>
                          <div className="progress-item-title">{p.contentId?.title || 'Lecture'}</div>
                          <div className="progress-item-sub">
                            {p.contentId?.subject} •{' '}
                            {p.watchedAt ? new Date(p.watchedAt).toLocaleDateString('en-IN') : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="animate-fade-in">
                <h2 className="dash-section-title">Achievements</h2>
                <div className="achievements-grid">
                  {[
                    { icon: '🌱', title: 'Beginner', desc: 'Joined Eklavya', unlocked: true },
                    { icon: '🔥', title: 'First Lecture', desc: 'Complete 1 lecture', unlocked: completedCount >= 1 },
                    { icon: '⚡', title: 'On a Roll', desc: 'Complete 5 lectures', unlocked: completedCount >= 5 },
                    { icon: '🥇', title: 'Scholar', desc: 'Complete 10 lectures', unlocked: completedCount >= 10 },
                    { icon: '💎', title: 'Course Master', desc: 'Purchase 2 courses', unlocked: purchases.length >= 2 },
                    { icon: '🚀', title: 'All Star', desc: 'Complete 25 lectures', unlocked: completedCount >= 25 },
                  ].map(({ icon, title, desc, unlocked }) => (
                    <div key={title} className={`achievement-card ${!unlocked ? 'locked' : ''}`}>
                      <span className="achievement-icon">{unlocked ? icon : '🔒'}</span>
                      <div className="achievement-title">{title}</div>
                      <div className="achievement-desc">{desc}</div>
                      {unlocked && <span className="badge badge-gold">Unlocked</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default StudentDashboard
