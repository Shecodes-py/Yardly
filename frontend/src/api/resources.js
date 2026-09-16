import client, { tokenStore } from './client'

export async function login(email, password) {
  const { data } = await client.post('/auth/login/', { email, password })
  tokenStore.set(data.access, data.refresh)
  return data
}

export async function register(payload) {
  const { data } = await client.post('/auth/register/', payload)
  tokenStore.set(data.access, data.refresh)
  return data.user
}

export function logout() {
  tokenStore.clear()
}

export const getMe = () => client.get('/me/').then((r) => r.data)
export const updateMe = (payload) => client.patch('/me/', payload).then((r) => r.data)
export const getUser = (id) => client.get(`/users/${id}/`).then((r) => r.data)

export const getCategories = () => client.get('/categories/').then((r) => r.data.results ?? r.data)

export const getJobs = (params = {}) => client.get('/jobs/', { params }).then((r) => r.data)
export const getJob = (id) => client.get(`/jobs/${id}/`).then((r) => r.data)
export const getMyJobs = () => client.get('/my-jobs/').then((r) => r.data.results ?? r.data)
export const getMyWork = () => client.get('/my-work/').then((r) => r.data.results ?? r.data)
export const getMyApplications = () => client.get('/my-applications/').then((r) => r.data.results ?? r.data)
export const createJob = (payload) => client.post('/jobs/', payload).then((r) => r.data)
export const updateJob = (id, payload) => client.patch(`/jobs/${id}/`, payload).then((r) => r.data)
export const cancelJob = (id) => client.post(`/jobs/${id}/cancel/`).then((r) => r.data)
export const startJob = (id) => client.post(`/jobs/${id}/start/`).then((r) => r.data)
export const completeJob = (id) => client.post(`/jobs/${id}/complete/`).then((r) => r.data)
export const confirmJob = (id) => client.post(`/jobs/${id}/confirm/`).then((r) => r.data)

export const getJobApplications = (jobId) =>
  client.get(`/jobs/${jobId}/applications/`).then((r) => r.data.results ?? r.data)
export const applyToJob = (jobId, payload) =>
  client.post(`/jobs/${jobId}/applications/`, payload).then((r) => r.data)
export const acceptApplication = (id) => client.post(`/applications/${id}/accept/`).then((r) => r.data)
export const withdrawApplication = (id) => client.post(`/applications/${id}/withdraw/`).then((r) => r.data)

export const getJobReviews = (jobId) =>
  client.get(`/jobs/${jobId}/reviews/`).then((r) => r.data.results ?? r.data)
export const createJobReview = (jobId, payload) =>
  client.post(`/jobs/${jobId}/reviews/`, payload).then((r) => r.data)

export const joinEstate = (inviteCode) =>
  client.post('/estates/join/', { invite_code: inviteCode }).then((r) => r.data)

export const getNotifications = () => client.get('/notifications/').then((r) => r.data.results ?? r.data)
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read/`).then((r) => r.data)

export const createReport = (payload) => client.post('/reports/', payload).then((r) => r.data)
export const blockUser = (blockedUserId) =>
  client.post('/blocks/', { blocked_user: blockedUserId }).then((r) => r.data)
