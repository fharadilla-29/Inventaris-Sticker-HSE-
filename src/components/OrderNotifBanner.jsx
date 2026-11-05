export default function OrderNotifBanner({ alerts = [], onDismiss, onNavigate }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="order-notif-stack">
      {alerts.map((alert, i) => (
        <div
          key={alert.id}
          className="order-notif-banner"
          style={{ animationDelay: `${i * 0.08}s` }}
          role="alert"
        >
          <div className="onb-icon">📦</div>
          <div className="onb-body">
            <span className="onb-title">Pesanan Baru!</span>
            <span className="onb-detail">
              <strong>{alert.nama}</strong>
              <span className="onb-sep"> · </span>
              {alert.jumlah} unit
              <span className="onb-sep"> · </span>
              {alert.rig}
            </span>
            <span className="onb-number">{alert.number}</span>
          </div>
          <div className="onb-actions">
            <button
              className="onb-btn-view"
              onClick={() => { onNavigate('orders'); onDismiss(alert.id); }}
            >
              Lihat
            </button>
            <button className="onb-btn-close" onClick={() => onDismiss(alert.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}
