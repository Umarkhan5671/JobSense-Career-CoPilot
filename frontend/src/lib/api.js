import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 300000, // 300 seconds / 5 minutes (analysis runs 5 tailoring passes + Groq retries)
});

// Interceptor to inject Supabase JWT token automatically
api.interceptors.request.use(async (config) => {
  try {
    let { data: { session } } = await supabase.auth.getSession();
    
    // Check if session token is expired or close to expiry (less than 60s)
    if (session) {
      const expiresAt = session.expires_at; // unix timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt - now < 60) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession) {
          session = refreshedSession;
        }
      }
    }
    
    if (session && session.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error("Axios interceptor failed to fetch/refresh session:", err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const uploadDefaultResume = async (cvFile) => {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  const response = await api.post('/profile/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar_file', avatarFile);
  const response = await api.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAvatarBlob = async () => {
  const response = await api.get('/profile/avatar', {
    responseType: 'blob',
  });
  return response.data;
};

export const getResumeBlob = async () => {
  const response = await api.get('/profile/resume', {
    responseType: 'blob',
  });
  return response.data;
};

// Analyze CV vs JD (cvFile is optional now)
export const analyzeCV = async (cvFile, jobDescription) => {
  const formData = new FormData();
  if (cvFile) {
    formData.append('cv_file', cvFile);
  }
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

export const generateTailoredResume = async (reportData, editedStructuredResume) => {
  const response = await api.post('/generate-resume', {
    report: reportData,
    resume: editedStructuredResume,
  }, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export const compareResumes = async (comparisonFile) => {
  const formData = new FormData();
  formData.append('comparison_file', comparisonFile);
  const response = await api.post('/compare-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const exportComparison = async (comparisonData) => {
  const response = await api.post('/export-comparison', comparisonData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const generateCoverLetter = async (jobDescription) => {
  const response = await api.post('/generate-cover-letter', {
    job_description: jobDescription,
  }, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export default api;
