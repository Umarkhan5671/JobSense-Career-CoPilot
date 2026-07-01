import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 60000, // 60 seconds (generous timeout for Groq API + PDF parse)
});

export const analyzeCV = async (cvFile, jobDescription) => {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  formData.append('job_description', jobDescription);

  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const exportReport = async (reportData) => {
  const response = await api.post('/export-report', reportData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export default api;
