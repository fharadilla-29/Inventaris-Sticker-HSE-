import { useState, useEffect } from 'react';
import { getOrders } from '../utils/storage';

const STATUS_LABEL = {
  pending:   { label: 'Menunggu Konfirmasi', badge: 'badge-warning-order', icon: '⏳' },
  approved:  { label: 'Disetujui',           badge: 'badge-ok',            icon: '✅' },
  rejected:  { label: 'Ditolak',             badge: 'badge-low',           icon: '❌' },
  delivered: { label: 'Terkirim',            badge: 'badge-delivered',     icon: '📦' },
};

export default function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Coordinator hanya lihat pesanan yang dia buat
  const myOrders = orders.filter(o =>
    o.pic?.toLowerCase() === user?.toLowerCase() ||
    o.pic?.toLowerCase().includes(user?.toLowerCase())
  );

  const filtered = filterType === 'all' ? myOrders : myOrders.filter(o => o.item_type === filterType);

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pesanan Saya</h1>
        <p>Riwayat pesanan sticker &amp; spanduk yang Anda ajukan</p>
      </div>

      {/* Summary */}
      <div className="order-summary">
        {[
          { key: 'pending',   label: 'Menunggu',  color: '#f59e0b', bg: '#fef3c7' },
          { key: 'approved',  label: 'Disetujui', color: '#16a34a', bg: '#dcfce7' },
          { key: 'delivered', label: 'Terkirim',  color: '#2563eb', bg: '#dbeafe' },
          { key: 'rejected',  label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.key} className="order-stat" style={{ '--sc': s.color, '--sb': s.bg }}>
            <span className="order-stat-num">{myOrders.filter(o => o.status === s.key).length}</span>
            <span className="order-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Semua Jenis</option>
          <option value="sticker">Sticker</option>
          <option value="spanduk">Spanduk</option>
        </select>
        <span className="badge badge-ok">{filtered.length} pesanan</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state big">
          <p>Belum ada pesanan. Pesan sticker atau spanduk di menu "Katalog &amp; Pesan".</p>
        </div>
      ) : (
        <div className="my-orders-list">
          {filtered.map(o => {
            const st = STATUS_LABEL[o.status] || STATUS_LABEL.pending;
            return (
              <div key={o.id} className={`my-order-card status-${o.status}`}>
                <div className="moc-header">
                  <span className="moc-number">{o.order_number}</span>
                  <span className={`badge ${st.badge}`}>{st.icon} {st.label}</span>
                </div>
                <div className="moc-body">
                  <div className="moc-main">
                    <h4>{o.item_nama}</h4>
                    <span className="moc-detail">{o.item_ukuran} · {o.item_type === 'sticker' ? 'Sticker' : 'Spanduk'}</span>
                  </div>
                  <div className="moc-meta">
                    <div className="moc-meta-item">
                      <span className="moc-meta-label">Jumlah</span>
                      <span className="moc-meta-val">{o.jumlah}</span>
                    </div>
                    <div className="moc-meta-item">
                      <span className="moc-meta-label">Rig</span>
                      <span className="moc-meta-val">{o.rig}</span>
                    </div>
                    <div className="moc-meta-item">
                      <span className="moc-meta-label">Tanggal</span>
                      <span className="moc-meta-val">{new Date(o.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  {o.catatan && <p className="moc-catatan">📝 {o.catatan}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
