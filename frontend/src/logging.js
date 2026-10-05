const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
export function logClientError(kind, details = {}) {
  const area = window.location.pathname.split('/')[1] || 'landing'
  const record = { area, kind, status: details.status || 0, request_id: details.request_id || '', name: details.name || 'Error', time: new Date().toISOString() }
  // Never include form payloads, query strings, auth tokens or reset URLs.
  console.error('[Yardly]', record, details.stack ? details.stack.split('\n').slice(1).join('\n').replace(/https?:\/\/[^\s)]+/g, '[source]').slice(0, 4000) : '')
  const token = localStorage.getItem('yardly_access')
  if (token) fetch(`${api}/client-errors/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(record) }).catch(() => {})
}
export function installErrorLogging() {
  window.addEventListener('error', event => logClientError('runtime', { name: event.error?.name, stack: event.error?.stack }))
  window.addEventListener('unhandledrejection', event => logClientError('promise', { name: event.reason?.name, stack: event.reason?.stack }))
}
