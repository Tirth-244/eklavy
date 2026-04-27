import axiosInstance from './axiosInstance';

export const chapterAPI = {
  getBySubject: (subject) => axiosInstance.get(`/chapters/${subject}`),
  create: (data) => axiosInstance.post('/chapters', data),
  update: (id, data) => axiosInstance.put(`/chapters/${id}`, data),
  delete: (id) => axiosInstance.delete(`/chapters/${id}`),
};
