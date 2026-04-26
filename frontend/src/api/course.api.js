import axiosInstance from './axiosInstance'

export const courseAPI = {
  getAll: () => axiosInstance.get('/courses'),
  getBySubject: (subject) => axiosInstance.get(`/courses/${subject}`),
  create: (data) => axiosInstance.post('/courses', data),
  update: (id, data) => axiosInstance.put(`/courses/${id}`, data),
}
