import axiosInstance from './axiosInstance'

export const studentAPI = {
  getAll: () => axiosInstance.get('/students'),
  getById: (id) => axiosInstance.get(`/students/${id}`),
}
