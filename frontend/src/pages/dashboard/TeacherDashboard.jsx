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
import { lectureAPI } from '../../api/lecture.api'

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

  // Lecture Tab States
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [courseLectures, setCourseLectures] = useState([])
  const [loadingLectures, setLoadingLectures] = useState(false)
  const [showLectureForm, setShowLectureForm] = useState(false)
  const [lectureTitle, setLectureTitle] = useState('')
  const [lectureDesc, setLectureDesc] = useState('')
  const [lectureOrder, setLectureOrder] = useState(0)
  const [lectureVideo, setLectureVideo] = useState(null)
  
  // Course creation state
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [newCourseForm, setNewCourseForm] = useState({
    subject: '',
    description: '',
    price: 999,
  })

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

  // Lectures Tab logic and handlers
  const fetchCourseLectures = async (courseId) => {
    if (!courseId) return
    setLoadingLectures(true)
    try {
      const res = await lectureAPI.getByCourse(courseId)
      setCourseLectures(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load lectures for this course')
    } finally {
      setLoadingLectures(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'lectures' && selectedCourseId) {
      fetchCourseLectures(selectedCourseId)
    }
  }, [activeTab, selectedCourseId])

  // Poll status of processing HLS videos
  useEffect(() => {
    let timer
    const hasProcessing = courseLectures.some(l => l.status === 'pending' || l.status === 'processing')
    if (activeTab === 'lectures' && selectedCourseId && hasProcessing) {
      timer = setInterval(() => {
        lectureAPI.getByCourse(selectedCourseId)
          .then(res => setCourseLectures(res.data.data || []))
          .catch(() => {})
      }, 5000)
    }
    return () => clearInterval(timer)
  }, [activeTab, selectedCourseId, courseLectures])

  const handleUploadLecture = async (e) => {
    e.preventDefault()
    if (!selectedCourseId) return toast.error('Please select a course first')
    if (!lectureVideo) return toast.error('Please select a video file')
    
    setUploading(true)
    setUploadProgress(0)

    try {
      const fd = new FormData()
      fd.append('courseId', selectedCourseId)
      fd.append('title', lectureTitle)
      fd.append('description', lectureDesc)
      fd.append('order', lectureOrder)
      fd.append('video', lectureVideo)

      await lectureAPI.create(fd, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(pct)
      })

      toast.success('Lecture uploaded and processing started!')
      setShowLectureForm(false)
      setLectureTitle('')
      setLectureDesc('')
      setLectureOrder(0)
      setLectureVideo(null)
      
      // Refresh list
      fetchCourseLectures(selectedCourseId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload lecture')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!newCourseForm.subject.trim()) return toast.error('Subject is required')
    try {
      const res = await courseAPI.create(newCourseForm)
      const newC = res.data.data
      setCourses(prev => [...prev, newC])
      setSelectedCourseId(newC._id)
      setNewCourseForm({ subject: '', description: '', price: 999 })
      setShowCourseForm(false)
      toast.success('Course created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course')
    }
  }

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return
    try {
      await lectureAPI.delete(lectureId)
      setCourseLectures(prev => prev.filter(l => l._id !== lectureId))
      toast.success('Lecture deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lecture')
    }
  }


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
          {['overview', 'subjects', 'lectures', 'students'].map((tab) => (

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

            {activeTab === 'lectures' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h2 className="dash-section-title" style={{ margin: 0 }}>Course Lecture Videos (Secure HLS)</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={() => setShowCourseForm(!showCourseForm)}>
                      {showCourseForm ? 'Cancel New Course' : 'Create New Course'}
                    </button>
                    {selectedCourseId && (
                      <button className="btn btn-primary" onClick={() => setShowLectureForm(true)}>
                        <Plus size={16} /> Upload Lecture
                      </button>
                    )}
                  </div>
                </div>

                {/* New Course Form */}
                {showCourseForm && (
                  <div className="upload-form" style={{ marginBottom: '24px', background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3>Create New Course / Subject</h3>
                    <form onSubmit={handleCreateCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px', alignItems: 'end' }}>
                      <div className="form-group">
                        <label className="form-label">Subject (e.g. Biology)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newCourseForm.subject}
                          onChange={(e) => setNewCourseForm({ ...newCourseForm, subject: e.target.value })}
                          placeholder="Physics / Biology / Maths"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Course Description</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newCourseForm.description}
                          onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                          placeholder="Enter course description"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Price (INR)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={newCourseForm.price}
                            onChange={(e) => setNewCourseForm({ ...newCourseForm, price: Number(e.target.value) })}
                            min="0"
                            required
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Create Course</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Course Selector */}
                <div className="form-group" style={{ marginBottom: '24px', maxWidth: '400px' }}>
                  <label className="form-label">Select Course to Manage Lectures</label>
                  <select
                    className="form-input form-select"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value)
                      fetchCourseLectures(e.target.value)
                    }}
                  >
                    <option value="" disabled>-- Choose a Course --</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.subject} (Price: ₹{c.price})</option>
                    ))}
                  </select>
                </div>

                {/* Lectures List */}
                {selectedCourseId ? (
                  loadingLectures ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                      <div className="spinner" />
                    </div>
                  ) : (
                    <div className="uploads-table-wrap">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-bright)' }}>Lectures ({courseLectures.length})</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => fetchCourseLectures(selectedCourseId)}>
                          Refresh Status
                        </button>
                      </div>
                      <table className="uploads-table">
                        <thead>
                          <tr>
                            <th>Seq No.</th>
                            <th>Lecture Title</th>
                            <th>Description</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseLectures.map(l => (
                            <tr key={l._id}>
                              <td style={{ width: '80px' }}><strong>#{l.order}</strong></td>
                              <td><strong>{l.title}</strong></td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {l.description || 'No description'}
                              </td>
                              <td>{l.duration || '--:--'}</td>
                              <td>
                                {l.status === 'ready' ? (
                                  <span className="badge badge-emerald">✓ Ready</span>
                                ) : l.status === 'processing' ? (
                                  <span className="badge badge-indigo animate-pulse">⚙️ Processing HLS...</span>
                                ) : (
                                  <span className="badge badge-gold animate-pulse">⏳ Uploading / Pending...</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteLecture(l._id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {courseLectures.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                No lectures uploaded yet. Click "Upload Lecture" to add your first video!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                    <h3 style={{ color: 'var(--text-bright)' }}>No Course Selected</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Please select a course from the dropdown above to manage and upload HLS secure video lectures.</p>
                  </div>
                )}

                {/* Upload Lecture Modal */}
                {showLectureForm && (
                  <div className="modal-overlay" onClick={() => { if (!uploading) setShowLectureForm(false); }}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                      <div className="modal-header">
                        <h2>Upload Video Lecture (HLS Secure)</h2>
                        <button className="modal-close" onClick={() => { if (!uploading) setShowLectureForm(false); }} disabled={uploading}>
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleUploadLecture} className="upload-form">
                        <div className="form-group">
                          <label className="form-label">Lecture Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={lectureTitle}
                            onChange={(e) => setLectureTitle(e.target.value)}
                            placeholder="e.g. Chapter 1 Intro"
                            required
                            disabled={uploading}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Lecture Description</label>
                          <textarea
                            className="form-input"
                            rows="3"
                            value={lectureDesc}
                            onChange={(e) => setLectureDesc(e.target.value)}
                            placeholder="Provide details about the lecture topics"
                            disabled={uploading}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                          <div className="form-group">
                            <label className="form-label">Sequence No. / Order</label>
                            <input
                              type="number"
                              className="form-input"
                              value={lectureOrder}
                              onChange={(e) => setLectureOrder(Number(e.target.value))}
                              min="0"
                              required
                              disabled={uploading}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Select Video File (.mp4)</label>
                            <input
                              type="file"
                              accept="video/mp4"
                              className="form-input"
                              style={{ padding: '8px' }}
                              onChange={(e) => setLectureVideo(e.target.files[0])}
                              required
                              disabled={uploading}
                            />
                          </div>
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                          <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-bright)' }}>
                              <span>Uploading Video to Server...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar-wrapper">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${uploadProgress}%`, background: 'var(--accent-indigo-light)' }}
                              />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                              Please keep this page open. Processing will start automatically after upload.
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setShowLectureForm(false)}
                            disabled={uploading}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={uploading}
                          >
                            {uploading ? 'Uploading...' : 'Start Upload'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
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

                <div className="upload-file-box" style={{ marginBottom: '16px' }}>
                  <Upload size={20} />
                  <span>Upload Video File</span>
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
