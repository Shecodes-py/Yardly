import { useState } from 'react'
import { saveHouseholdAudit } from '../api/resources'
import { useAuth } from '../context/AuthContext'

export default function HouseholdAuditModal({ onCompleted }) {
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({
    unit_address: '',
    occupant_type: 'TENANT',
    occupant_count: 2,
    next_of_kin_name: '',
    next_of_kin_relationship: '',
    next_of_kin_phone: '',
    vehicle_plates: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await saveHouseholdAudit(form)
      await refreshUser()
      if (onCompleted) onCompleted()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save household audit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 460 }}>
        <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 14 }}>
          <span className="badge" style={{ background: '#166534', color: '#fff' }}>📋 MANDATORY RESIDENT AUDIT</span>
          <h3 style={{ margin: '6px 0 2px', color: '#14532d' }}>Miracle Zone Onboarding Audit</h3>
          <p className="text-small" style={{ margin: 0, color: '#166534' }}>
            Please complete your household information to submit your verification request and unlock estate gate codes.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>House / Unit Address</label>
            <input required placeholder="e.g. Block 4, House 12" value={form.unit_address} onChange={(e) => setForm({ ...form, unit_address: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Occupant Type</label>
              <select value={form.occupant_type} onChange={(e) => setForm({ ...form, occupant_type: e.target.value })}>
                <option value="TENANT">Tenant / Renter</option>
                <option value="OWNER">Home Owner</option>
              </select>
            </div>
            <div className="field">
              <label>Number of Residents</label>
              <input required type="number" min="1" value={form.occupant_count} onChange={(e) => setForm({ ...form, occupant_count: Number(e.target.value) })} />
            </div>
          </div>

          <h4 style={{ margin: '12px 0 6px', fontSize: 13, color: '#334155' }}>🚨 Emergency Contact & Next of Kin</h4>
          <div className="field">
            <label>Next of Kin Full Name</label>
            <input required placeholder="e.g. Mrs. Blessing Okafor" value={form.next_of_kin_name} onChange={(e) => setForm({ ...form, next_of_kin_name: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Relationship</label>
              <input required placeholder="e.g. Spouse / Sister" value={form.next_of_kin_relationship} onChange={(e) => setForm({ ...form, next_of_kin_relationship: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input required type="tel" placeholder="08012345678" value={form.next_of_kin_phone} onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label>Registered Car Plate Numbers (Optional)</label>
            <input placeholder="e.g. KJA-482AA, APP-912BB" value={form.vehicle_plates} onChange={(e) => setForm({ ...form, vehicle_plates: e.target.value })} />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Submitting Audit...' : 'Complete Household Audit'}
          </button>
        </form>
      </div>
    </div>
  )
}
