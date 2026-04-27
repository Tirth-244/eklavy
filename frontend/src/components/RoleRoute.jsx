import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RoleRoute = ({ role, fallback = '/home' }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={fallback} replace />

  return <Outlet />
}

export default RoleRoute
