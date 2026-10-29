import { useState, useEffect } from 'react';
import {
  getStickers,
  getStockIn,
  addStockIn,
  deleteStockIn,
} from '../utils/storage';

const EMPTY_FORM = {
  stickerId: '',
  jumlah: 0,
  tanggal: new Date().toISOString().split('T')[0],
  supplier: '',
  catatan: '',
};

export default function StockIn() {
  const [stockIn, setStockIn] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stk, si] = await Promise.all([getStickers(), getStockIn()]);
        setStickers(stk);
        setStockIn(si);
      } catch (err) {
        console.error('Load error:', err);
        alert('Gagal memuat data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refresh() {
    try {
      const [stk, si] = await Promise.all([getStickers(), getStockIn()]);
      setStickers(stk);
      setStockIn(si);
    } catch (err) {
      console.error('Load error:', err);
      alert('Gagal memuat data: ' + err.message);
    }
  }

  function handleOpenForm() {
    setForm({ ...EMPTY_FORM, stickerId: stickers[0]?.id || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.stickerId) {
      alert('Pilih jenis sticker terlebih dahulu');
      return;
    }
    if (form.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    setSaving(true);
    try {
      await addStockIn(form);
      await refresh();
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Hapus record stok masuk ini? Stok sticker akan dikurangi kembali.')) {
      try {
        await deleteStockIn(id);
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  const sorted = [...stockIn].sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
  );

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stok Masuk</h1>
        <p>Pencatatan pemasukan sticker ke inventaris</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-info">
          <span className="badge badge-ok">{stockIn.length} transaksi</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenForm}
          disabled={stickers.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Stok Masuk
        </button>
      </div>

      {stickers.length === 0 && (
        <div className="empty-state big">
          <p>Belum ada jenis sticker. Tambahkan jenis sticker terlebih dahulu di menu "Jenis Sticker".</p>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Stok Masuk</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group full-width">
                <label>Jenis Sticker *</label>
                <select
                  value={form.stickerId}
                  onChange={(e) => setForm({ ...form, stickerId: e.target.value })}
                >
                  <option value="">-- Pilih Sticker --</option>
                  {stickers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.ukuran}) — Stok: {s.stok || 0}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Jumlah *</label>
                <input
                  type="number"
                  min="1"
                  value={form.jumlah || ''}
                  onChange={(e) => setForm({ ...form, jumlah: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Tanggal *</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="cth: PT. Safety First"
                />
              </div>
              <div className="form-group full-width">
                <label>Catatan</label>
                <textarea
                  rows="2"
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Keterangan tambahan (opsional)"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis Sticker</th>
              <th>Ukuran</th>
              <th>Jumlah</th>
              <th>Supplier</th>
              <th>Catatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const sticker = stickers.find((stk) => stk.id === s.sticker_id);
              return (
                <tr key={s.id}>
                  <td>{s.tanggal}</td>
                  <td><strong>{sticker?.nama || 'Sticker dihapus'}</strong></td>
                  <td>{sticker?.ukuran || '-'}</td>
                  <td><span className="badge badge-in">+{s.jumlah}</span></td>
                  <td>{s.supplier || '-'}</td>
                  <td className="td-desc">{s.catatan || '-'}</td>
                  <td>
                    <button className="btn-icon-action danger" title="Hapus" onClick={() => handleDelete(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {sorted.length === 0 && stickers.length > 0 && (
        <div className="empty-state big">
          <p>Belum ada transaksi stok masuk. Klik "Tambah Stok Masuk" untuk mulai.</p>
        </div>
      )}
    </div>
  );
}
