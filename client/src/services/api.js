import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

function getCSRFToken() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    return match ? match[1] : '';
  } catch (_) {
    return '';
  }
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const API_URL = process.env.REACT_APP_API_URL || '';

async function parseResponseBlob(response, fallbackFilename) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data.success === false) throw new Error(data.message || 'Operation failed');
    return data;
  }
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || fallbackFilename || 'downloaded-file');
  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('Server returned empty file');
  }
  const blobUrl = window.URL.createObjectURL(blob);
  return { success: true, filename, blobUrl };
}

export async function handleToolSubmit(url, formData, fallbackName) {
  const token = localStorage.getItem('token');
  const csrfToken = getCSRFToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(`${API_URL}/api${url}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const err = await response.json();
        message = err.message || err.error || message;
      } else {
        const text = await response.text();
        if (text) message = text.substring(0, 200);
      }
    } catch (_) {
      message = `Request failed (${response.status})`;
    }
    throw new Error(message);
  }

  return parseResponseBlob(response, fallbackName);
}

export function useDownloadHandler() {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const triggerDownload = useCallback((url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'downloaded-file';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const setDownload = useCallback((url, filename) => {
    setDownloadUrl(url);
    setDownloadName(filename);
    setIsReady(true);
    triggerDownload(url, filename);
  }, [triggerDownload]);

  const clearDownload = useCallback(() => {
    setDownloadUrl(prev => {
      if (prev) window.URL.revokeObjectURL(prev);
      return '';
    });
    setDownloadName('');
    setIsReady(false);
  }, []);

  const handleDownloadAgain = useCallback(() => {
    if (downloadUrl) triggerDownload(downloadUrl, downloadName);
  }, [downloadUrl, downloadName, triggerDownload]);

  const handleDownloadResponse = useCallback(async (response, fallbackFilename) => {
    if (!response.ok) {
      let message = 'Operation failed';
      try {
        const err = await response.json();
        message = err.message || message;
      } catch (_) {}
      throw new Error(message);
    }

    const result = await parseResponseBlob(response, fallbackFilename);
    if (result.blobUrl) {
      setDownload(result.blobUrl, result.filename || fallbackFilename);
    }
    return result;
  }, [setDownload]);

  return {
    downloadUrl, downloadName, isReady,
    setDownload, clearDownload, handleDownloadAgain,
    handleDownloadResponse
  };
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

const withProgress = (config, onProgress) => {
  if (onProgress) {
    config.onUploadProgress = (e) => {
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress(pct);
    };
  }
  return config;
};

const downloadAsBlob = async (filename) => {
  const response = await api.get(`/pdf/download/${filename}`, {
    responseType: 'blob',
    timeout: 300000,
  });
  if (response.data.type === 'application/json') {
    const text = await response.data.text();
    const error = JSON.parse(text);
    throw new Error(error.message || 'Download failed');
  }
  return response.data;
};

export const pdfAPI = {
  merge: (files, onProgress) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/pdf/merge', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  split: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/split', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  compress: (file, quality = 0.5, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);
    return api.post('/pdf/compress', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  rotate: (file, degrees = 90, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('degrees', degrees);
    return api.post('/pdf/rotate', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  protect: (file, password, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    return api.post('/pdf/protect', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  unlock: (file, password, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    return api.post('/pdf/unlock', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  addPageNumbers: (file, options = {}, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startNumber', options.startNumber || 1);
    formData.append('fontSize', options.fontSize || 12);
    formData.append('position', options.position || 'bottom');
    return api.post('/pdf/add-page-numbers', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  addWatermark: (file, text, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', text);
    return api.post('/pdf/add-watermark', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  extractText: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/extract-text', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  reorder: (file, pageOrder, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageOrder', JSON.stringify(pageOrder));
    return api.post('/pdf/reorder', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  deletePages: (file, pagesToDelete, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pagesToDelete', JSON.stringify(pagesToDelete));
    return api.post('/pdf/delete-pages', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToJpg: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/pdf-to-jpg', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  jpgToPdf: (files, onProgress) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/pdf/jpg-to-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToTxt: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/pdf-to-txt', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  getPageCount: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/page-count', formData, withProgress({
    }, onProgress));
  },

  getDownloadUrl: (filename) => `${API_BASE}/api/pdf/download/${filename}`,

  repair: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/repair', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToPdfa: (file, options = {}, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', options.title || '');
    formData.append('author', options.author || '');
    formData.append('subject', options.subject || '');
    formData.append('keywords', options.keywords || '');
    return api.post('/pdf/pdf-to-pdfa', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  readMetadata: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/read-metadata', formData, withProgress({
    }, onProgress));
  },

  writeMetadata: (file, metadata, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || '');
    formData.append('author', metadata.author || '');
    formData.append('subject', metadata.subject || '');
    formData.append('keywords', metadata.keywords || '');
    return api.post('/pdf/write-metadata', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  flatten: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/flatten', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  htmlToPdf: (content, options = {}, onProgress) => {
    return api.post('/pdf/html-to-pdf', {
      content,
      title: options.title || 'Document',
      fontSize: options.fontSize || 12,
    }, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  redact: (file, redactions, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('redactions', JSON.stringify(redactions));
    return api.post('/pdf/redact', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  removeAnnotations: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/remove-annotations', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  removeWatermark: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/remove-watermark', formData, withProgress({
      timeout: 300000,
      responseType: 'blob',
    }, onProgress));
  },

  compare: (file1, file2, onProgress) => {
    const formData = new FormData();
    formData.append('files', file1);
    formData.append('files', file2);
    return api.post('/pdf/compare', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToWord: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/pdf-to-word', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToExcel: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/pdf-to-excel', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  excelToPdf: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/excel-to-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pdfToPpt: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/pdf-to-ppt', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  pptToPdf: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/ppt-to-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  wordToPdf: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/word-to-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  editPdf: (file, edits, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('edits', JSON.stringify(edits));
    return api.post('/pdf/edit-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  signPdf: (file, signature, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', JSON.stringify(signature));
    return api.post('/pdf/sign-pdf', formData, withProgress({
      timeout: 300000,
    }, onProgress));
  },

  downloadAsBlob,
};

export const historyAPI = {
  getAll: (page = 1) => api.get(`/history?page=${page}&_=${Date.now()}`),
  getOne: (id) => api.get(`/history/${id}`),
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('History entry ID is required'));
    }
    return api.delete(`/history/${id}`).then(response => {
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to delete history entry');
      }
      return response;
    }).catch(error => {
      console.error('Delete history entry failed:', error);
      throw error;
    });
  },
  clearAll: () => {
    return api.delete('/history').then(response => {
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to clear history');
      }
      console.log('History cleared successfully:', response.data);
      return response;
    }).catch(error => {
      console.error('Clear history failed:', error);
      throw error;
    });
  },
  getStats: () => api.get('/history/stats/daily'),
};

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

export function gtagPageView(path) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      anonymize_ip: true,
    });
  } catch (_) {}
}

export function gtagEvent(action, params = {}) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', action, params);
  } catch (_) {}
}

// ✅ PHASE 1 FIX: GA4 Conversion Events for Tool Tracking & User Funnel
/**
 * Track tool completion events (PDF processing successful)
 * Used to measure conversion metrics for each tool
 */
export function gtagToolCompletion(toolName, fileSize = 0) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'tool_completion', {
      tool_name: toolName,
      file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
      engagement_time_msec: 100
    });
  } catch (_) {}
}

/**
 * Track tool error events for debugging and user experience
 */
export function gtagToolError(toolName, errorMessage) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'tool_error', {
      tool_name: toolName,
      error_message: errorMessage.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

/**
 * Track user registration (funnel event)
 */
export function gtagUserRegistration() {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'sign_up', {
      method: 'form',
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

/**
 * Track user login (funnel event)
 */
export function gtagUserLogin() {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'login', {
      method: 'form',
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

/**
 * Track first tool usage (funnel event for new users)
 */
export function gtagFirstToolUsage(toolName) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'first_tool_usage', {
      tool_name: toolName,
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

/**
 * Track file download completion
 */
export function gtagDownloadComplete(toolName, fileSize = 0) {
  try {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) return;
    window.gtag('event', 'download', {
      file_name: toolName,
      file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

export function gtagConsent(consent) {
  try {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', consent);
  } catch (_) {}
}

export default api;
