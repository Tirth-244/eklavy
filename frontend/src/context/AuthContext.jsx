import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/auth.api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('eklavya_token'))
  const [loading, setLoading] = useState(true)

  // Define logout first so useEffect can safely reference it
  const logout = useCallback(() => {
    localStorage.removeItem('eklavya_token')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback((userData, jwtToken) => {
    localStorage.setItem('eklavya_token', jwtToken)
    setToken(jwtToken)
    setUser(userData)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }, [])

  // Fetch current user on mount / token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) { setLoading(false); return }
      try {
        const { data } = await authAPI.getMe()
        setUser(data.user)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [token, logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
