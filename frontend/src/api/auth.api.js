import axiosInstance from './axiosInstance'

export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  getMe: () => axiosInstance.get('/auth/me'),
  verifyEmail: (token) => axiosInstance.post('/auth/verify-email', { token }),
  resendVerification: (email) => axiosInstance.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => axiosInstance.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, resetToken, password) => axiosInstance.post('/auth/reset-password', { email, resetToken, password }),
}
