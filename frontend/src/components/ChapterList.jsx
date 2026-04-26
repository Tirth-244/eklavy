import { BookOpen, Play } from 'lucide-react'
import './ChapterList.css'

const ChapterList = ({ chapters, subject }) => {
  // Group by class
  const class11 = chapters.filter((c) => c.class === 11)
  const class12 = chapters.filter((c) => c.class === 12)

  const renderGroup = (groupChapters, classLabel) => (
    <div className="chapter-group">
      <div className="chapter-group-label">
        <span className="chapter-class-badge">ધોરણ {classLabel}</span>
        <span className="chapter-class-en">Class {classLabel}</span>
      </div>
      <div className="chapter-grid">
        {groupChapters.map((ch) => (
          <div key={ch.chapter} className="chapter-card" id={`chapter-${subject}-${ch.chapter}`}>
            <div className="chapter-card-num">
              {String(ch.chapter).padStart(2, '0')}
            </div>
            <div className="chapter-card-content">
              <h4 className="chapter-title-gu">{ch.title}</h4>
              <p className="chapter-title-en">{ch.titleEn}</p>
            </div>
            <button className="btn btn-ghost btn-sm chapter-start-btn" disabled>
              <Play size={13} />
              <span>Coming Soon</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="chapter-list-section animate-fade-in">
      <div className="chapter-list-header">
        <BookOpen size={20} style={{ color: 'var(--accent-gold)' }} />
        <h2>સંપૂર્ણ અભ્યાસક્રમ — Full {subject} Syllabus</h2>
        <span className="badge badge-gold">{chapters.length} chapters</span>
      </div>

      {class11.length > 0 && renderGroup(class11, 11)}
      {class12.length > 0 && renderGroup(class12, 12)}
    </div>
  )
}

export default ChapterList
