import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, BookOpen, Users, BarChart2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { contentAPI } from '../../api/content.api'
import { courseAPI } from '../../api/course.api'
import { uploadAPI } from '../../api/upload.api'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

const SUBJECTS = ['Physics', 'Chemistry', 'Maths']

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUploadForm, setShowUploadForm] = useState(false)

  // Upload form state
  const [form, setForm] = useState({
    title: '', subject: 'Physics', type: 'demo', description: '', duration: '', order: 0,
  })
  const [videoFile, setVideoFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uploadsRes, coursesRes] = await Promise.all([
          contentAPI.getMyUploads(),
          courseAPI.getAll(),
        ])
        setUploads(uploadsRes.data.data || [])
        setCourses(coursesRes.data.data || [])
      } catch {
        //
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getCourseId = () => {
    const c = courses.find((c) => c.subject === form.subject)
    return c?._id || null
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')

    const courseId = getCourseId()
    if (!courseId) return toast.error(`No course found for ${form.subject}. Ask admin to create it.`)

    setUploading(true)
    setUploadProgress(0)
    try {
      let videoUrl = ''
      let notesUrl = ''

      if (videoFile) {
        const fd = new FormData()
        fd.append('video', videoFile)
        const vRes = await uploadAPI.video(fd, setUploadProgress)
        videoUrl = vRes.data.url
      }

      if (pdfFile) {
        const pfd = new FormData()
        pfd.append('pdf', pdfFile)
        const pRes = await uploadAPI.pdf(pfd)
        notesUrl = pRes.data.url
      }

      const newContent = await contentAPI.upload({
        ...form,
        courseId,
        videoUrl,
        notesUrl,
      })

      setUploads((prev) => [newContent.data.data, ...prev])
      setForm({ title: '', subject: 'Physics', type: 'demo', description: '', duration: '', order: 0 })
      setVideoFile(null)
      setPdfFile(null)
      setShowUploadForm(false)
      toast.success('Content uploaded successfully! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content?')) return
    try {
      await contentAPI.delete(id)
      setUploads((prev) => prev.filter((u) => u._id !== id))
      toast.success('Content deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Teacher Dashboard</h1>
            <p className="dash-subtitle">Manage your content for {user?.name}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadForm(true)}
            id="open-upload-form-btn"
          >
            <Plus size={16} /> Upload Content
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <BookOpen size={22} color="var(--accent-indigo-light)" />
            </div>
            <div>
              <div className="stat-value">{uploads.length}</div>
              <div className="stat-label">Total Uploads</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <BarChart2 size={22} color="var(--accent-emerald)" />
            </div>
            <div>
              <div className="stat-value">{uploads.filter((u) => u.type === 'demo').length}</div>
              <div className="stat-label">Demo Lectures</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Upload size={22} color="var(--accent-gold)" />
            </div>
            <div>
              <div className="stat-value">{uploads.filter((u) => u.type === 'premium').length}</div>
              <div className="stat-label">Premium Lectures</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(244,63,94,0.15)' }}>
              <Users size={22} color="var(--accent-rose)" />
            </div>
            <div>
              <div className="stat-value">{SUBJECTS.length}</div>
              <div className="stat-label">Subjects Covered</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {['overview', 'uploads'].map((tab) => (
            <button
              key={tab}
              className={`dash-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              id={`teacher-tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                <h2 className="dash-section-title">Subject Coverage</h2>
                <div className="subject-coverage-grid">
                  {SUBJECTS.map((s) => {
                    const count = uploads.filter((u) => u.subject === s).length
                    const demos = uploads.filter((u) => u.subject === s && u.type === 'demo').length
                    const premium = uploads.filter((u) => u.subject === s && u.type === 'premium').length
                    return (
                      <div key={s} className="subject-coverage-card">
                        <div className="coverage-top">
                          <span className="coverage-emoji">
                            {s === 'Physics' ? '⚛️' : s === 'Chemistry' ? '🧪' : '📐'}
                          </span>
                          <h3>{s}</h3>
                        </div>
                        <div className="coverage-stats">
                          <div><span className="badge badge-emerald">{demos} demo</span></div>
                          <div><span className="badge badge-indigo">{premium} premium</span></div>
                        </div>
                        <div className="progress-bar-wrapper" style={{ marginTop: '12px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(count * 5, 100)}%` }}
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {count} total lecture{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'uploads' && (
              <div className="animate-fade-in">
                <h2 className="dash-section-title">Your Uploads ({uploads.length})</h2>
                {uploads.length === 0 ? (
                  <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>🎬</span>
                    <h3>No uploads yet</h3>
                    <p>Click "Upload Content" to add your first lecture.</p>
                    <button className="btn btn-primary" onClick={() => setShowUploadForm(true)}>Start Uploading</button>
                  </div>
                ) : (
                  <div className="uploads-table-wrap">
                    <table className="uploads-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Subject</th>
                          <th>Type</th>
                          <th>Video</th>
                          <th>Notes</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploads.map((u) => (
                          <tr key={u._id}>
                            <td className="upload-title">{u.title}</td>
                            <td>
                              <span className={`badge badge-${u.subject === 'Physics' ? 'indigo' : u.subject === 'Chemistry' ? 'emerald' : 'gold'}`}>
                                {u.subject}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${u.type === 'demo' ? 'emerald' : 'indigo'}`}>
                                {u.type}
                              </span>
                            </td>
                            <td>{u.videoUrl ? '✅' : '—'}</td>
                            <td>{u.notesUrl ? '✅' : '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {new Date(u.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(u._id)}
                                id={`delete-content-${u._id}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {showUploadForm && (
          <div className="modal-overlay" onClick={() => setShowUploadForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload New Content</h2>
                <button className="modal-close" onClick={() => setShowUploadForm(false)} id="close-upload-modal">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="upload-form" id="teacher-upload-form">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    id="upload-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Laws of Motion — Chapter 1"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select
                      id="upload-subject"
                      className="form-input form-select"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    >
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      id="upload-type"
                      className="form-input form-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="demo">Demo (Free)</option>
                      <option value="premium">Premium (Paid)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      id="upload-duration"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 42:30"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order</label>
                    <input
                      id="upload-order"
                      type="number"
                      className="form-input"
                      placeholder="1"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    id="upload-desc"
                    className="form-input"
                    rows={3}
                    placeholder="Brief description of this lecture…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="upload-file-grid">
                  <div className="upload-file-box">
                    <Upload size={20} />
                    <span>Video File</span>
                    <input
                      id="upload-video-file"
                      type="file"
                      accept="video/*"
                      className="file-input-hidden"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                    />
                    {videoFile && <span className="file-name">{videoFile.name}</span>}
                  </div>
                  <div className="upload-file-box">
                    <FileText size={20} />
                    <span>PDF Notes</span>
                    <input
                      id="upload-pdf-file"
                      type="file"
                      accept=".pdf"
                      className="file-input-hidden"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                    />
                    {pdfFile && <span className="file-name">{pdfFile.name}</span>}
                  </div>
                </div>
                {uploading && (
                  <div className="upload-progress">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-full" disabled={uploading} id="submit-upload-btn">
                  {uploading ? 'Uploading…' : 'Upload Content'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TeacherDashboard
