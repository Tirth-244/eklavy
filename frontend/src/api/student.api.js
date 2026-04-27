import axiosInstance from './axiosInstance'

export const studentAPI = {
  getAll: () => axiosInstance.get('/api/students'),
  getById: (id) => axiosInstance.get(`/api/students/${id}`),
}
