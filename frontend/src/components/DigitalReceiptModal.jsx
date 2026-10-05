export default function DigitalReceiptModal({ receipt, onClose }) {
  if (!receipt) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content printable-receipt" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, border: '2px solid #158052' }}>
        {/* RECEIPT HEADER */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 14 }}>
          <span className="badge" style={{ background: '#158052', color: '#fff', fontSize: 13 }}>
            🏛️ MIRACLE ZONE ESTATE MANAGEMENT
          </span>
          <h2 style={{ margin: '8px 0 2px', color: '#0f6640' }}>Official Payment Receipt</h2>
          <p className="muted text-small" style={{ margin: 0 }}>Lekki, Lagos • Yardly Estate Financial OS</p>
        </div>

        {/* STAMP BADGE */}
        <div className="receipt-stamp-box">
          <div className="stamp-text">PAID</div>
          <div className="stamp-sub">{receipt.month_year || 'MONTHLY LEVY'}</div>
        </div>

        {/* DETAILS TABLE */}
        <div className="receipt-details">
          <div className="receipt-row">
            <span className="muted">Receipt Ref:</span>
            <strong style={{ fontFamily: 'monospace' }}>{receipt.reference}</strong>
          </div>
          <div className="receipt-row">
            <span className="muted">Levy Title:</span>
            <strong>{receipt.levy_title}</strong>
          </div>
          <div className="receipt-row">
            <span className="muted">Resident Name:</span>
            <strong>{receipt.resident_name}</strong>
          </div>
          <div className="receipt-row">
            <span className="muted">House / Unit:</span>
            <strong>{receipt.unit_address}</strong>
          </div>
          <div className="receipt-row">
            <span className="muted">Amount Paid:</span>
            <strong style={{ fontSize: '1.2rem', color: '#158052' }}>₦{Number(receipt.amount_paid).toLocaleString()}</strong>
          </div>
          <div className="receipt-row">
            <span className="muted">Payment Method:</span>
            <span>{receipt.payment_method === 'PAYSTACK' ? '💳 Paystack Online' : '⚡ Test Payment Simulation'}</span>
          </div>
          <div className="receipt-row">
            <span className="muted">Paid Date:</span>
            <span>{new Date(receipt.paid_at).toLocaleString()}</span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
