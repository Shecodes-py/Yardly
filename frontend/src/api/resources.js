import client, { tokenStore } from './client'

// Auth & User
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

// Household Audit
export const getHouseholdAudit = () => client.get('/household-audit/').then((r) => r.data)
export const saveHouseholdAudit = (payload) => client.post('/household-audit/', payload).then((r) => r.data)

// Tasks / Jobs
export const getCategories = () => client.get('/categories/').then((r) => r.data.results ?? r.data)
export const getJobs = (params = {}) => client.get('/jobs/', { params }).then((r) => r.data.results ?? r.data)
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

// Gate & Access Control
export const getVisitorPasses = () => client.get('/gate/passes/').then((r) => r.data.results ?? r.data)
export const createVisitorPass = (payload) => client.post('/gate/passes/', payload).then((r) => r.data)
export const cancelVisitorPass = (id) => client.post(`/gate/passes/${id}/cancel/`).then((r) => r.data)
export const checkInVisitorPass = (passCode) =>
  client.post(`/gate/passes/checkin/${passCode}/`).then((r) => r.data)

// Guard / Security Gateman APIs
export const getGuardPasses = (search = '') =>
  client.get('/gate/guard/passes/', { params: search ? { search } : {} }).then((r) => r.data.results ?? r.data)
export const getGuardDeliveries = () => client.get('/gate/deliveries/').then((r) => r.data.results ?? r.data)
export const markDeliveryArrived = (id) => client.post(`/gate/deliveries/${id}/arrive/`).then((r) => r.data)
export const getSecurityAlerts = () => client.get('/gate/alerts/').then((r) => r.data.results ?? r.data)

export const getDeliveryPasses = () => client.get('/gate/deliveries/').then((r) => r.data.results ?? r.data)
export const createDeliveryPass = (payload) => client.post('/gate/deliveries/', payload).then((r) => r.data)
export const createSecurityAlert = (payload) => client.post('/gate/alerts/', payload).then((r) => r.data)

// Community Feed & Classifieds
export const getCommunityFeed = (params = {}) =>
  client.get('/community/feed/', { params }).then((r) => r.data.results ?? r.data)
export const createFeedPost = (payload) => client.post('/community/feed/', payload).then((r) => r.data)

export const getClassifieds = (params = {}) =>
  client.get('/community/classifieds/', { params }).then((r) => r.data.results ?? r.data)
export const createClassifiedItem = (payload) => client.post('/community/classifieds/', payload).then((r) => r.data)

// Business Directory & Ads
export const getBusinessCategories = () =>
  client.get('/business-categories/').then((r) => r.data.results ?? r.data)
export const getBusinesses = (params = {}) =>
  client.get('/businesses/', { params }).then((r) => r.data.results ?? r.data)
export const getBusinessDetail = (id) => client.get(`/businesses/${id}/`).then((r) => r.data)
export const createBusinessProfile = (payload) => client.post('/businesses/', payload).then((r) => r.data)
export const createBusinessReview = (id, payload) =>
  client.post(`/businesses/${id}/reviews/`, payload).then((r) => r.data)

// Estate Hub & Daily Gate Code
export const getDailyGateCode = () => client.get('/estates/gate-code/').then((r) => r.data)
export const getEmergencyContacts = () =>
  client.get('/estates/emergency-contacts/').then((r) => r.data.results ?? r.data)
export const getMaintenanceTickets = () =>
  client.get('/estates/maintenance/').then((r) => r.data.results ?? r.data)
export const createMaintenanceTicket = (payload) =>
  client.post('/estates/maintenance/', payload).then((r) => r.data)

// Estate Levies & Stamped Digital Receipts
export const getEstateLevies = () => client.get('/estates/levies/').then((r) => r.data.results ?? r.data)
export const createEstateLevy = (payload) => client.post('/estates/levies/', payload).then((r) => r.data)
export const getMyReceipts = () => client.get('/estates/receipts/').then((r) => r.data.results ?? r.data)
export const getAdminHouseTracker = () => client.get('/estates/admin/payment-tracker/').then((r) => r.data)

// Estate Admin APIs
export const getPendingMemberships = () =>
  client.get('/estates/admin/memberships/pending/').then((r) => r.data.results ?? r.data)
export const verifyMembership = (id) =>
  client.post(`/estates/admin/memberships/${id}/verify/`).then((r) => r.data)

export const getPendingGuards = () => client.get('/admin/guards/pending/').then((r) => r.data.results ?? r.data)
export const approveGuard = (id) => client.post(`/admin/guards/${id}/approve/`).then((r) => r.data)

export const rotateGateCode = () =>
  client.post('/estates/admin/gate-code/rotate/').then((r) => r.data)

export const getAdminMaintenanceTickets = () =>
  client.get('/estates/admin/maintenance/').then((r) => r.data.results ?? r.data)
export const updateMaintenanceStatus = (id, status) =>
  client.post(`/estates/admin/maintenance/${id}/status/`, { status }).then((r) => r.data)

export const joinEstate = (inviteCode, unitAddress) =>
  client.post('/estates/join/', { invite_code: inviteCode, unit_address: unitAddress }).then((r) => r.data)

export const getNotifications = () => client.get('/notifications/').then((r) => r.data.results ?? r.data)
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read/`).then((r) => r.data)
export const createReport = (payload) => client.post('/reports/', payload).then((r) => r.data)

export const requestPasswordReset = (email) => client.post('/auth/password-reset/', { email }).then(r => r.data)
export const confirmPasswordReset = (payload) => client.post('/auth/password-reset/confirm/', payload).then(r => r.data)
export const updateEstateInviteCode = (invite_code) => client.post('/estates/admin/invite-code/', { invite_code }).then(r => r.data)
