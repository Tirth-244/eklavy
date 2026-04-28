import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, FileText, Trash2, BookOpen, Users, BarChart2, Plus, X, ArrowLeft, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { contentAPI } from '../../api/content.api'
import { courseAPI } from '../../api/course.api'
import { uploadAPI } from '../../api/upload.api'
import { subjectAPI } from '../../api/subject.api'
import { chapterAPI } from '../../api/chapter.api'
import { studentAPI } from '../../api/student.api'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

import './Dashboard.css'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [courses, setCourses] = useState([])
  const [subjectsList, setSubjectsList] = useState([])
  const [subjectChapters, setSubjectChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const setActiveTab = (tab) => setSearchParams({ tab })

  const [showUploadForm, setShowUploadForm] = useState(false)

  // Upload form state
  const [form, setForm] = useState({
    title: '', subject: '', type: 'demo', description: '', duration: '', order: 0,
  })
  const [videoFile, setVideoFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  // Student state
  const studentId = searchParams.get('studentId') || ''
  const [studentsList, setStudentsList] = useState([])
  const [studentDetails, setStudentDetails] = useState(null)

  // Subject and Chapter state
  const [newSubject, setNewSubject] = useState({ name: '', label: '' })
  const [showAddChapter, setShowAddChapter] = useState(false)
  const selectedSubject = searchParams.get('subject') || ''

  const setSelectedSubject = (subject) => {
    if (subject) {
      setSearchParams({ tab: activeTab, subject })
    } else {
      setSearchParams({ tab: activeTab })
    }
  }
  const [chapterForm, setChapterForm] = useState({
    subject: '', titleGu: '', titleEn: '', chapterNumber: 1, classLevel: 11, videoUrl: '', isFree: false, isPublished: true
  })
  const [editingChapterId, setEditingChapterId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uploadsRes, coursesRes, subjectsRes] = await Promise.all([
          contentAPI.getMyUploads(),
          courseAPI.getAll(),
          subjectAPI.getAll(),
        ])
        setUploads(uploadsRes.data.data || [])
        setCourses(coursesRes.data.data || [])
        const subs = subjectsRes.data.data || []
        setSubjectsList(subs)
        if (subs.length > 0) {
          setForm(f => ({ ...f, subject: subs[0].name }))
          setChapterForm(f => ({ ...f, subject: subs[0].name }))
        }
      } catch {
        //
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSubject && (activeTab === 'subjects' || activeTab === 'overview')) {
      chapterAPI.getBySubject(selectedSubject)
        .then(res => setSubjectChapters(res.data.data || []))
        .catch(() => setSubjectChapters([]))
    }
  }, [selectedSubject, activeTab])

  useEffect(() => {
    if (activeTab === 'students') {
      if (studentId) {
        studentAPI.getById(studentId)
          .then(res => setStudentDetails(res.data?.studentDetails || res.data?.data || res.data))
          .catch(() => setStudentDetails(null))
      } else {
        studentAPI.getAll()
          .then(res => {
            const data = res.data?.students || res.data?.data || res.data || []
            setStudentsList(Array.isArray(data) ? data : [])
          })
          .catch(() => setStudentsList([]))
      }
    }
  }, [studentId, activeTab])

  const getCourseId = () => {
    const c = courses.find((c) => c.subject === form.subject)
    return c?._id || null
  }

  // Unused upload handlers removed for brevity

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    if (!newSubject.name.trim()) return toast.error('Subject name is required')
    try {
      const res = await subjectAPI.create(newSubject)
      const sub = res.data.data
      setSubjectsList(prev => [...prev, sub])
      setNewSubject({ name: '', label: '' })
      setSelectedSubject(sub.name)
      setChapterForm(f => ({ ...f, subject: sub.name }))
      toast.success('Subject created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject')
    }
  }

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await subjectAPI.delete(id);
      const subjectToDelete = subjectsList.find(s => s._id === id);
      setSubjectsList(prev => prev.filter(s => s._id !== id));
      if (subjectToDelete && selectedSubject === subjectToDelete.name) {
        setSelectedSubject('');
        setSubjectChapters([]);
      }
      toast.success('Subject deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  }

  const handleAddChapter = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      let vUrl = chapterForm.videoUrl
      if (videoFile) {
        const fd = new FormData()
        fd.append('video', videoFile)
        const vRes = await uploadAPI.video(fd, setUploadProgress)
        vUrl = vRes.data.url
      }
      if (!vUrl) return toast.error('Video URL or Video File is required')

      if (editingChapterId) {
        const res = await chapterAPI.update(editingChapterId, { ...chapterForm, videoUrl: vUrl })
        setSubjectChapters(prev => prev.map(c => c._id === editingChapterId ? res.data.data : c))
        toast.success('Chapter updated successfully!')
      } else {
        const res = await chapterAPI.create({ ...chapterForm, videoUrl: vUrl })
        setSubjectChapters(prev => [...prev, res.data.data])
        toast.success('Chapter added successfully!')
      }

      setShowAddChapter(false)
      setEditingChapterId(null)
      setVideoFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save chapter')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleEditChapter = (ch) => {
    setChapterForm({
      subject: ch.subject,
      titleGu: ch.titleGu,
      titleEn: ch.titleEn,
      chapterNumber: ch.chapterNumber,
      classLevel: ch.classLevel,
      videoUrl: ch.videoUrl,
      isFree: ch.isFree,
      isPublished: ch.isPublished
    })
    setEditingChapterId(ch._id)
    setShowAddChapter(true)
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
              <div className="stat-value">{subjectsList.length}</div>
              <div className="stat-label">Subjects Covered</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {['overview', 'subjects', 'students'].map((tab) => (
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
                {!selectedSubject ? (
                  <>
                    <h2 className="dash-section-title">Subject Coverage</h2>
                    <div className="subject-coverage-grid">
                      {subjectsList.map((s) => {
                        const count = uploads.filter((u) => u.subject === s.name).length
                        const demos = uploads.filter((u) => u.subject === s.name && u.type === 'demo').length
                        const premium = uploads.filter((u) => u.subject === s.name && u.type === 'premium').length
                        return (
                          <div
                            key={s.name}
                            className="subject-coverage-card"
                            onClick={() => setSelectedSubject(s.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="coverage-top">
                              <span className="coverage-emoji">
                                {s.name === 'Physics' ? '⚛️' : s.name === 'Chemistry' ? '🧪' : '📚'}
                              </span>
                              <h3>{s.name}</h3>
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
                  </>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSubject('')}>
                          <ArrowLeft size={16} /> Back
                        </button>
                        <h2 className="dash-section-title" style={{ margin: 0 }}>Chapters for {selectedSubject}</h2>
                      </div>
                      <button className="btn btn-primary" onClick={() => {
                        setChapterForm(f => ({ ...f, subject: selectedSubject }))
                        setShowAddChapter(true)
                      }}>
                        <Plus size={16} /> Add Chapter
                      </button>
                    </div>
                    <div className="uploads-table-wrap">
                      <table className="uploads-table">
                        <thead>
                          <tr>
                            <th>Chapter</th>
                            <th>Class</th>
                            <th>Gujarati Title</th>
                            <th>English Title</th>
                            <th>Access</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectChapters.map(ch => (
                            <tr key={ch._id}>
                              <td>{ch.chapterNumber}</td>
                              <td>{ch.classLevel}</td>
                              <td>{ch.titleGu}</td>
                              <td>{ch.titleEn}</td>
                              <td>
                                <span className={`badge badge-${ch.isFree ? 'emerald' : 'gold'}`}>
                                  {ch.isFree ? 'Free' : 'Locked'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${ch.isPublished ? 'indigo' : 'rose'}`}>
                                  {ch.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </td>
                            <td style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditChapter(ch)}
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={async () => {
                                  if (window.confirm('Delete chapter?')) {
                                    await chapterAPI.delete(ch._id)
                                    setSubjectChapters(prev => prev.filter(c => c._id !== ch._id))
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                            </tr>
                          ))}
                          {subjectChapters.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No chapters found for this subject.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="dash-section-title" style={{ margin: 0 }}>Manage Subjects & Chapters</h2>
                </div>

                <div className="upload-form" style={{ marginBottom: '32px' }}>
                  <h3>Create New Subject</h3>
                  <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Subject Name (e.g. Biology)"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Gujarati Label (e.g. જીવવિજ્ઞાન)"
                      value={newSubject.label}
                      onChange={(e) => setNewSubject({ ...newSubject, label: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary" disabled={uploading}>Create</button>
                  </form>
                </div>

                <div className="uploads-table-wrap" style={{ marginBottom: '32px' }}>
                  <table className="uploads-table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Gujarati Label</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectsList.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.label || '—'}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteSubject(s._id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {subjectsList.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No subjects found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Subject to View Chapters</label>
                  <select
                    className="form-input form-select"
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value)
                      setChapterForm(f => ({ ...f, subject: e.target.value }))
                    }}
                  >
                    <option value="" disabled>Select a subject</option>
                    {subjectsList.map(s => <option key={s.name} value={s.name}>{s.name} ({s.label})</option>)}
                  </select>
                </div>

                {selectedSubject && (
                  <div className="uploads-table-wrap" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                      <button className="btn btn-primary" onClick={() => {
                        setEditingChapterId(null)
                        setChapterForm({
                          subject: selectedSubject, titleGu: '', titleEn: '', chapterNumber: subjectChapters.length + 1, classLevel: 11, videoUrl: '', isFree: false, isPublished: true
                        })
                        setShowAddChapter(true)
                      }}>
                        <Plus size={16} /> Add Chapter
                      </button>
                    </div>
                    <table className="uploads-table">
                      <thead>
                        <tr>
                          <th>Chapter</th>
                          <th>Class</th>
                          <th>Gujarati Title</th>
                          <th>English Title</th>
                          <th>Access</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectChapters.map(ch => (
                          <tr key={ch._id}>
                            <td>{ch.chapterNumber}</td>
                            <td>{ch.classLevel}</td>
                            <td>{ch.titleGu}</td>
                            <td>{ch.titleEn}</td>
                            <td>
                              <span className={`badge badge-${ch.isFree ? 'emerald' : 'gold'}`}>
                                {ch.isFree ? 'Free' : 'Locked'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${ch.isPublished ? 'indigo' : 'rose'}`}>
                                {ch.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditChapter(ch)}
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={async () => {
                                  if (window.confirm('Delete chapter?')) {
                                    await chapterAPI.delete(ch._id)
                                    setSubjectChapters(prev => prev.filter(c => c._id !== ch._id))
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {subjectChapters.length === 0 && (
                          <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No chapters found for this subject.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div className="animate-fade-in">
                {!studentId ? (
                  <>
                    <h2 className="dash-section-title">Students ({studentsList.length})</h2>
                    <div className="uploads-table-wrap">
                      <table className="uploads-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Purchased Courses</th>
                            <th>Joined Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsList.map((st) => (
                            <tr key={st._id}>
                              <td>{st.name}</td>
                              <td>{st.email}</td>
                              <td>
                                {st.purchasedCourses?.length > 0 
                                  ? `${st.purchasedCourses.length} Course(s)`
                                  : <span className="badge badge-rose">None</span>
                                }
                              </td>
                              <td>{new Date(st.createdAt).toLocaleDateString('en-IN')}</td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setSearchParams({ tab: 'students', studentId: st._id })}
                                >
                                  View Progress
                                </button>
                              </td>
                            </tr>
                          ))}
                          {studentsList.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No enrolled students found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : studentDetails ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({ tab: 'students' })}>
                        <ArrowLeft size={16} /> Back to List
                      </button>
                      <h2 className="dash-section-title" style={{ margin: 0 }}>Progress: {studentDetails.student.name}</h2>
                    </div>

                    <div className="dash-stats-grid" style={{ marginBottom: '24px' }}>
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                          <BookOpen size={22} color="var(--accent-indigo-light)" />
                        </div>
                        <div>
                          <div className="stat-value">{studentDetails.purchasedSubjects.length}</div>
                          <div className="stat-label">Purchased Subjects</div>
                        </div>
                      </div>
                    </div>

                    <h3 style={{ marginBottom: '16px', color: 'var(--text-bright)' }}>Subject Progress</h3>
                    <div className="subject-coverage-grid">
                      {studentDetails.progress.map(p => (
                        <div key={p.subject} className="subject-coverage-card">
                          <div className="coverage-top">
                            <span className="coverage-emoji">
                              {p.subject.toLowerCase() === 'physics' ? '⚛️' : p.subject.toLowerCase() === 'chemistry' ? '🧪' : '📚'}
                            </span>
                            <h3>{p.subject}</h3>
                          </div>
                          <div className="coverage-stats">
                            <div><span className="badge badge-emerald">{p.completedChapters} completed</span></div>
                            <div><span className="badge badge-indigo">{p.totalChapters} total</span></div>
                          </div>
                          <div className="progress-bar-wrapper" style={{ marginTop: '12px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            {p.percentage}% Completed
                          </div>
                        </div>
                      ))}
                      {studentDetails.progress.length === 0 && (
                        <p style={{ color: 'var(--text-muted)' }}>No progress data available yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px' }}>Loading student details...</div>
                )}
              </div>
            )}
          </>
        )}

        {/* Add Chapter Modal */}
        {showAddChapter && (
          <div className="modal-overlay" onClick={() => setShowAddChapter(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Add New Chapter</h2>
                <button className="modal-close" onClick={() => setShowAddChapter(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddChapter} className="upload-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Chapter Name (Gujarati)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ભૌતિક જગત"
                      value={chapterForm.titleGu}
                      onChange={(e) => setChapterForm({ ...chapterForm, titleGu: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chapter Name (English)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Physical World"
                      value={chapterForm.titleEn}
                      onChange={(e) => setChapterForm({ ...chapterForm, titleEn: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Chapter Number</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={chapterForm.chapterNumber}
                      onChange={(e) => setChapterForm({ ...chapterForm, chapterNumber: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select
                      className="form-input form-select"
                      value={chapterForm.classLevel}
                      onChange={(e) => setChapterForm({ ...chapterForm, classLevel: Number(e.target.value) })}
                    >
                      <option value={11}>Class 11</option>
                      <option value={12}>Class 12</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-input form-select"
                    value={chapterForm.subject}
                    onChange={(e) => setChapterForm({ ...chapterForm, subject: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjectsList.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Video URL (Embed or Direct Link)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={chapterForm.videoUrl}
                    onChange={(e) => setChapterForm({ ...chapterForm, videoUrl: e.target.value })}
                  />
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Or upload a video file directly below:
                  </div>
                </div>

                <div className="upload-file-box" style={{ marginBottom: '16px' }}>
                  <Upload size={20} />
                  <span>Upload Video File (Optional)</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="file-input-hidden"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                  />
                  {videoFile && <span className="file-name">{videoFile.name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Lock Type</label>
                    <select
                      className="form-input form-select"
                      value={chapterForm.isFree}
                      onChange={(e) => setChapterForm({ ...chapterForm, isFree: e.target.value === 'true' })}
                    >
                      <option value="false">Locked (Purchase required)</option>
                      <option value="true">Free</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Publish Toggle</label>
                    <select
                      className="form-input form-select"
                      value={chapterForm.isPublished}
                      onChange={(e) => setChapterForm({ ...chapterForm, isPublished: e.target.value === 'true' })}
                    >
                      <option value="true">Published</option>
                      <option value="false">Draft</option>
                    </select>
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

                <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
                  {uploading ? 'Saving…' : (editingChapterId ? 'Update Chapter' : 'Save Chapter')}
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
