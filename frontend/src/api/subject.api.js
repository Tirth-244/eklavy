import axiosInstance from './axiosInstance';

export const subjectAPI = {
  getAll: () => axiosInstance.get('/subjects'),
  create: (data) => axiosInstance.post('/subjects', data),
  delete: (id) => axiosInstance.delete(`/subjects/${id}`),
};
