import axiosInstance from './axiosInstance'

export const paymentAPI = {
  createOrder: (courseId) => axiosInstance.post('/payment/create-order', { courseId }),
  verify: (data) => axiosInstance.post('/payment/verify', data),
}

export const purchaseAPI = {
  getMy: () => axiosInstance.get('/purchase/my'),
  check: (courseId) => axiosInstance.get(`/purchase/check/${courseId}`),
}
