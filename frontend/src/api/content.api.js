import axiosInstance from './axiosInstance'

export const contentAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/content/${courseId}`),
  getById: (id) => axiosInstance.get(`/content/item/${id}`),
  upload: (data) => axiosInstance.post('/content', data),
  delete: (id) => axiosInstance.delete(`/content/${id}`),
  getMyUploads: () => axiosInstance.get('/content/teacher/my-uploads'),
}
