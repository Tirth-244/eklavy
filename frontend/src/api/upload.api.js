import axiosInstance from './axiosInstance'

export const uploadAPI = {
  video: (formData, onProgress) =>
    axiosInstance.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    }),
  pdf: (formData) =>
    axiosInstance.post('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
