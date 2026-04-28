import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading Eklavya…</p>
      </div>
    )
  }

  // If user is already logged in, redirect them to the protected home page
  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children ? children : <Outlet />
}

export default PublicRoute
