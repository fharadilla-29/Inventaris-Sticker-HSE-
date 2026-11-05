import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../utils/storage';

const STATUS_LABEL = {
  pending:   { label: 'Menunggu',   badge: 'badge-warning-order' },
  approved:  { label: 'Disetujui',  badge: 'badge-ok' },
  rejected:  { label: 'Ditolak',    badge: 'badge-low' },
  delivered: { label: 'Terkirim',   badge: 'badge-delivered' },
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      alert('Gagal memuat: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id, status) {
    setActionLoading(id + status);
    try {
      await updateOrderStatus(id, status);
      await load();
    } catch (err) {
      alert('Gagal update: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    if (confirm('Hapus pesanan ini?')) {
      try {
        await deleteOrder(id);
        await load();
      } catch (err) {
        alert('Gagal hapus: ' + err.message);
      }
    }
  }

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterType !== 'all' && o.item_type !== filterType) return false;
    return true;
  });

  const counts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    approved:  orders.filter(o => o.status === 'approved').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    rejected:  orders.filter(o => o.status === 'rejected').length,
  };

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manajemen Pesanan</h1>
        <p>Kelola permintaan sticker &amp; spanduk dari HSE Coordinator</p>
      </div>

      {/* Summary cards */}
      <div className="order-summary">
        {[
          { key: 'pending',   label: 'Menunggu',  color: '#f59e0b', bg: '#fef3c7' },
          { key: 'approved',  label: 'Disetujui', color: '#16a34a', bg: '#dcfce7' },
          { key: 'delivered', label: 'Terkirim',  color: '#2563eb', bg: '#dbeafe' },
          { key: 'rejected',  label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2' },
        ].map(s => (
          <button
            key={s.key}
            className={`order-stat ${filterStatus === s.key ? 'active' : ''}`}
            style={{ '--sc': s.color, '--sb': s.bg }}
            onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}
          >
            <span className="order-stat-num">{counts[s.key]}</span>
            <span className="order-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Semua Jenis</option>
          <option value="sticker">Sticker</option>
          <option value="spanduk">Spanduk</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="delivered">Terkirim</option>
          <option value="rejected">Ditolak</option>
        </select>
        <span className="badge badge-ok">{filtered.length} pesanan</span>
        <button className="btn btn-outline" onClick={load}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state big"><p>Tidak ada pesanan ditemukan.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Pesanan</th>
              <th>Jenis</th>
              <th>Nama Item</th>
              <th>Ukuran</th>
              <th>Jumlah</th>
              <th>Rig</th>
              <th>PIC</th>
              <th>Catatan</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const st = STATUS_LABEL[o.status] || STATUS_LABEL.pending;
              const date = new Date(o.created_at).toLocaleDateString('id-ID');
              return (
                <tr key={o.id}>
                  <td><span className="order-number">{o.order_number}</span></td>
                  <td>
                    <span className={`badge ${o.item_type === 'sticker' ? 'badge-cat' : 'badge-rig'}`}>
                      {o.item_type === 'sticker' ? 'Sticker' : 'Spanduk'}
                    </span>
                  </td>
                  <td><strong>{o.item_nama}</strong></td>
                  <td>{o.item_ukuran || '-'}</td>
                  <td><span className="badge badge-out">{o.jumlah}</span></td>
                  <td><span className="badge badge-rig">{o.rig}</span></td>
                  <td>{o.pic}</td>
                  <td className="td-desc">{o.catatan || '-'}</td>
                  <td>{date}</td>
                  <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                  <td>
                    <div className="action-btns">
                      {o.status === 'pending' && (
                        <>
                          <button
                            className="btn-order-action approve"
                            title="Setujui"
                            disabled={actionLoading === o.id + 'approved'}
                            onClick={() => handleStatus(o.id, 'approved')}
                          >✓</button>
                          <button
                            className="btn-order-action reject"
                            title="Tolak"
                            disabled={actionLoading === o.id + 'rejected'}
                            onClick={() => handleStatus(o.id, 'rejected')}
                          >✗</button>
                        </>
                      )}
                      {o.status === 'approved' && (
                        <button
                          className="btn-order-action deliver"
                          title="Tandai Terkirim"
                          disabled={actionLoading === o.id + 'delivered'}
                          onClick={() => handleStatus(o.id, 'delivered')}
                        >📦</button>
                      )}
                      <button
                        className="btn-icon-action danger"
                        title="Hapus"
                        onClick={() => handleDelete(o.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
