import axiosInstance from './axiosInstance';

export const lectureAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/lectures/course/${courseId}`),
  create: (formData, onUploadProgress) => {
    return axiosInstance.post('/lectures', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  delete: (id) => axiosInstance.delete(`/lectures/${id}`),
};

export default lectureAPI;
