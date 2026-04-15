import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Request failed'
    return Promise.reject(new Error(message))
  }
)

export const api = {
  // Projects
  createProject: (data) => client.post('/api/projects', data),
  getProject: (id) => client.get(`/api/projects/${id}`),

  // Context pipeline
  computeContext: (projectId, geometry, layers) =>
    client.post(`/api/projects/${projectId}/context/compute`, { geometry, layers }),

  retrieveE4C: (projectId, technologyType, sector) =>
    client.post(`/api/projects/${projectId}/e4c/retrieve`, {
      technology_type: technologyType,
      sector,
    }),

  prepareReport: (projectId) =>
    client.post(`/api/projects/${projectId}/report/prepare`, {}),

  generateReport: (projectId, payload) =>
    client.post(`/api/projects/${projectId}/report/generate`, payload),

  // Reports
  getReport: (reportId) => client.get(`/api/reports/${reportId}`),
  getReportVersions: (reportId) => client.get(`/api/reports/${reportId}/versions`),
  validateReport: (reportId) => client.post(`/api/reports/${reportId}/validate`, {}),

  // Sections
  regenerateSection: (reportId, sectionName, params) =>
    client.post(`/api/reports/${reportId}/sections/${sectionName}/regenerate`, params || {}),

  // Layers
  getLayers: () => client.get('/api/layers'),

  // Health
  health: () => client.get('/api/health'),
}

export default api
