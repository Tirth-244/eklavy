import { LogOut, X } from 'lucide-react'
import './LogoutModal.css'

const LogoutModal = ({ show, onCancel, onConfirm }) => {
  if (!show) return null

  return (
    <div className="logout-overlay" onClick={onCancel}>
      <div
        className="logout-modal animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="logout-modal-close" onClick={onCancel} id="logout-modal-close">
          <X size={18} />
        </button>

        <div className="logout-modal-icon">
          <LogOut size={28} />
        </div>

        <h3 className="logout-modal-title">Logout</h3>
        <p className="logout-modal-text">
          Are you sure you want to logout? You'll need to sign in again to access your dashboard.
        </p>

        <div className="logout-modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} id="logout-cancel-btn">
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} id="logout-confirm-btn">
            <LogOut size={15} />
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutModal
