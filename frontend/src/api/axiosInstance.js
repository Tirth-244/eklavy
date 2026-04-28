import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL: `${API}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor — attach JWT
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('eklavya_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, Promise.reject)

// Response interceptor — handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eklavya_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
