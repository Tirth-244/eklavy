import { useNavigate } from 'react-router-dom'
import { BookOpen, Play, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import './ChapterList.css'

/**
 * ChapterList
 * -----------
 * Renders the full Gujarat-board syllabus for a given subject.
 *
 * Props:
 *   chapters    — array from gujaratSyllabus.js
 *   subject     — e.g. "Physics"
 *   isPurchased — boolean: true → show play icons; false → show lock icons
 *   courseId    — MongoDB _id of the course (used for payment redirect)
 */
const ChapterList = ({ chapters = [], subject, isPurchased = false, courseId, onChapterClick }) => {
  const navigate = useNavigate()

  const class11 = chapters.filter((c) => c.classLevel === 11)
  const class12 = chapters.filter((c) => c.classLevel === 12)

  const handleChapterClick = (ch) => {
    if (!isPurchased && !ch.isFree) {
      toast('Please purchase the course to access full content', { icon: '🔒' })
      navigate(`/course/${subject}`)
    } else {
      if (onChapterClick) onChapterClick(ch)
      else navigate(`/course/${subject}`)
    }
  }

  const renderChapter = (ch) => {
    const isAccessible = isPurchased || ch.isFree;
    return (
    <div
      key={ch._id}
      className={`chapter-card ${isAccessible ? 'chapter-unlocked' : 'chapter-locked'}`}
      id={`chapter-${subject}-${ch.chapterNumber}`}
      onClick={() => handleChapterClick(ch)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleChapterClick(ch)}
      title={isAccessible ? `Play Chapter ${ch.chapterNumber}` : 'Purchase to unlock'}
    >
      {/* Chapter number badge */}
      <div className="chapter-card-num">
        {String(ch.chapterNumber).padStart(2, '0')}
      </div>

      {/* Chapter titles */}
      <div className="chapter-card-content">
        <h4 className="chapter-title-gu">{ch.titleGu}</h4>
        <p className="chapter-title-en">{ch.titleEn}</p>
      </div>

      {/* Lock / Play icon */}
      <div className={`chapter-state-icon ${isAccessible ? 'state-play' : 'state-lock'}`}>
        {isAccessible ? (
          <>
            <Play size={14} fill="currentColor" />
            <span>Watch</span>
          </>
        ) : (
          <>
            <Lock size={14} />
            <span>Locked</span>
          </>
        )}
      </div>
    </div>
  )}

  const renderGroup = (groupChapters, classLabel) => (
    <div className="chapter-group" key={classLabel}>
      <div className="chapter-group-label">
        <span className="chapter-class-badge">ધોરણ {classLabel}</span>
        <span className="chapter-class-en">Class {classLabel}</span>
        <span className="chapter-count-pill">{groupChapters.length} chapters</span>
      </div>
      <div className="chapter-grid">
        {groupChapters.map(renderChapter)}
      </div>
    </div>
  )

  return (
    <div className="chapter-list-section animate-fade-in">
      <div className="chapter-list-header">
        <BookOpen size={20} style={{ color: 'var(--accent-gold)' }} />
        <h2>સંપૂર્ણ અભ્યાસક્રમ — Full {subject} Syllabus</h2>
        <span className="badge badge-gold">{chapters.length} chapters</span>
        {isPurchased && (
          <span className="badge badge-emerald" style={{ marginLeft: 'auto' }}>
            ✓ Unlocked
          </span>
        )}
      </div>

      {/* Purchase nudge banner when locked */}
      {!isPurchased && (
        <div className="chapter-locked-banner">
          <Lock size={16} />
          <span>Purchase the course to unlock all {chapters.length} chapters with full video lectures</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/course/${subject}`)}
            id={`chapter-list-buy-btn-${subject?.toLowerCase()}`}
          >
            Unlock Now
          </button>
        </div>
      )}

      {class11.length > 0 && renderGroup(class11, 11)}
      {class12.length > 0 && renderGroup(class12, 12)}
    </div>
  )
}

export default ChapterList
