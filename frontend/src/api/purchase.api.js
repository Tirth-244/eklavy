import axiosInstance from './axiosInstance'

export const purchaseAPI = {
  getStatus: (courseId) => axiosInstance.get(`/purchase/status/${courseId}`),
  getMy: () => axiosInstance.get('/purchase/my'),
  check: (courseId) => axiosInstance.get(`/purchase/check/${courseId}`)
}
