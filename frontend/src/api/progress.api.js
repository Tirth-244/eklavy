import axiosInstance from './axiosInstance'

export const progressAPI = {
  markComplete: (contentId) => axiosInstance.post('/progress/complete', { contentId }),
  getMy: () => axiosInstance.get('/progress/my'),
  getCourse: (courseId) => axiosInstance.get(`/progress/course/${courseId}`),
}
