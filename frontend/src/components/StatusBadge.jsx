const VARIANT = {
  OPEN: 'badge',
  ASSIGNED: 'badge badge-warning',
  IN_PROGRESS: 'badge badge-warning',
  COMPLETED: 'badge',
  CLOSED: 'badge-muted',
  CANCELLED: 'badge badge-danger',
  DISPUTED: 'badge badge-danger',
  PENDING: 'badge badge-warning',
  ACCEPTED: 'badge',
  REJECTED: 'badge badge-danger',
  WITHDRAWN: 'badge-muted',
}

export default function StatusBadge({ status }) {
  return <span className={VARIANT[status] || 'badge'}>{status.replaceAll('_', ' ')}</span>
}
