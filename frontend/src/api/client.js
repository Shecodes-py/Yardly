import axios from 'axios'
import { logClientError } from '../logging'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const ACCESS_KEY = 'yardly_access'
const REFRESH_KEY = 'yardly_refresh'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

const client = axios.create({ baseURL: API_BASE_URL })

client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise = null

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    logClientError('api', { name: error.code || error.name, status: error.response?.status, request_id: error.response?.headers?.['x-request-id'] })
    const { config, response } = error
    if (response?.status === 401 && !config._retried && tokenStore.getRefresh()) {
      config._retried = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh/`, { refresh: tokenStore.getRefresh() })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        tokenStore.set(data.access)
        config.headers.Authorization = `Bearer ${data.access}`
        return client(config)
      } catch {
        tokenStore.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
