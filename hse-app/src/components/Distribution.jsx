import { useState, useEffect } from 'react';
import {
  getStickers,
  getDistributions,
  addDistributionBatch,
  deleteDistributionBatch,
  deleteDistribution,
} from '../utils/storage';
import { RIG_LIST } from '../utils/constants';

// Satu baris item sticker dalam form
function emptyItem() {
  return { stickerId: '', jumlah: 1 };
}

function emptyForm() {
  return {
    rig: RIG_LIST[0],
    tanggal: new Date().toISOString().split('T')[0],
    pic: '',
    catatan: '',
    items: [emptyItem()],
  };
}

export default function Distribution() {
  const [distributions, setDistributions] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filterRig, setFilterRig] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stk, dist] = await Promise.all([getStickers(), getDistributions()]);
        setStickers(stk);
        setDistributions(dist);
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
      const [stk, dist] = await Promise.all([getStickers(), getDistributions()]);
      setStickers(stk);
      setDistributions(dist);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }

  // --- Form items helpers ---
  function setItem(index, field, value) {
    const items = form.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setForm({ ...form, items });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, emptyItem()] });
  }

  function removeItem(index) {
    if (form.items.length === 1) return; // minimal 1 baris
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  }

  // --- Validasi & Submit ---
  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi items
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.stickerId) {
        alert(`Baris ke-${i + 1}: Pilih jenis sticker terlebih dahulu`);
        return;
      }
      if (item.jumlah <= 0) {
        alert(`Baris ke-${i + 1}: Jumlah harus lebih dari 0`);
        return;
      }
      const sticker = stickers.find((s) => s.id === item.stickerId);
      if (sticker && item.jumlah > (sticker.stok || 0)) {
        alert(
          `Baris ke-${i + 1} (${sticker.nama}): Stok tidak mencukupi. Tersedia: ${sticker.stok || 0}`
        );
        return;
      }
    }

    // Cek duplikat sticker dalam satu batch
    const ids = form.items.map((it) => it.stickerId);
    if (new Set(ids).size !== ids.length) {
      alert('Ada jenis sticker yang dipilih lebih dari satu kali. Gabungkan jumlahnya.');
      return;
    }

    setSaving(true);
    try {
      await addDistributionBatch(form);
      await refresh();
      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // --- Hapus satu batch ---
  async function handleDeleteBatch(batchId) {
    if (confirm('Hapus semua sticker dalam pengeluaran ini? Stok akan dikembalikan.')) {
      try {
        if (batchId) {
          await deleteDistributionBatch(batchId);
        }
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  // --- Hapus satu item dari batch ---
  async function handleDeleteItem(id) {
    if (confirm('Hapus item ini? Stok akan dikembalikan.')) {
      try {
        await deleteDistribution(id);
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  // --- Grouping berdasarkan batch_id & tanggal ---
  const filtered = filterRig
    ? distributions.filter((d) => d.rig === filterRig)
    : distributions;

  // Kelompokkan per batch_id (fallback ke id jika tidak ada batch_id)
  const batchMap = {};
  filtered.forEach((d) => {
    const key = d.batch_id || d.id;
    if (!batchMap[key]) {
      batchMap[key] = {
        batchId: key,
        rig: d.rig,
        tanggal: d.tanggal,
        pic: d.pic,
        catatan: d.catatan,
        items: [],
        totalJumlah: 0,
      };
    }
    batchMap[key].items.push(d);
    batchMap[key].totalJumlah += d.jumlah;
  });

  const batches = Object.values(batchMap).sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
  );

  const totalByFilter = filtered.reduce((sum, d) => sum + d.jumlah, 0);

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stok Keluar</h1>
        <p>Pengeluaran sticker ke masing-masing rig</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select
          className="filter-select"
          value={filterRig}
          onChange={(e) => setFilterRig(e.target.value)}
        >
          <option value="">Semua Rig</option>
          {RIG_LIST.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <div className="toolbar-info">
          <span className="badge badge-out">Total: {totalByFilter} unit</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyForm()); setShowForm(true); }}
          disabled={stickers.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Stok Keluar
        </button>
      </div>

      {stickers.length === 0 && (
        <div className="empty-state big">
          <p>Belum ada jenis sticker. Tambahkan jenis sticker terlebih dahulu.</p>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Stok Keluar</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-body">

              {/* Info umum */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Rig Tujuan *</label>
                  <select
                    value={form.rig}
                    onChange={(e) => setForm({ ...form, rig: e.target.value })}
                  >
                    {RIG_LIST.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
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
                  <label>PIC</label>
                  <input
                    type="text"
                    value={form.pic}
                    onChange={(e) => setForm({ ...form, pic: e.target.value })}
                    placeholder="cth: Andi (HSE Officer)"
                  />
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <input
                    type="text"
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Keterangan tambahan (opsional)"
                  />
                </div>
              </div>

              {/* Daftar sticker */}
              <div className="items-section">
                <div className="items-header">
                  <span className="items-title">Daftar Sticker</span>
                  <span className="items-count">{form.items.length} item</span>
                </div>

                <div className="items-list">
                  {/* Header kolom */}
                  <div className="item-row item-row-head">
                    <span>Jenis Sticker</span>
                    <span>Stok Tersedia</span>
                    <span>Jumlah Keluar</span>
                    <span></span>
                  </div>

                  {form.items.map((item, index) => {
                    const selectedSticker = stickers.find((s) => s.id === item.stickerId);
                    return (
                      <div key={index} className="item-row">
                        <select
                          value={item.stickerId}
                          onChange={(e) => setItem(index, 'stickerId', e.target.value)}
                        >
                          <option value="">-- Pilih Sticker --</option>
                          {stickers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nama} ({s.ukuran})
                            </option>
                          ))}
                        </select>

                        <span className={`stok-info ${selectedSticker && (selectedSticker.stok || 0) <= 20 ? 'stok-low' : (selectedSticker && (selectedSticker.stok || 0) <= 50 ? 'stok-warning' : '')}`}>
                          {selectedSticker ? `${selectedSticker.stok || 0} ${selectedSticker.satuan}` : '-'}
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={item.jumlah || ''}
                          onChange={(e) => setItem(index, 'jumlah', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="jumlah-input"
                        />

                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          title="Hapus baris"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="btn-add-item" onClick={addItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Tambah Jenis Sticker
                </button>
              </div>

              {/* Summary */}
              <div className="batch-summary">
                <span>Total item: <strong>{form.items.length} jenis</strong></span>
                <span>Total unit: <strong>{form.items.reduce((s, it) => s + (it.jumlah || 0), 0)}</strong></span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel per Batch */}
      {batches.length === 0 && stickers.length > 0 && (
        <div className="empty-state big">
          <p>Belum ada data stok keluar. Klik "Tambah Stok Keluar" untuk mulai.</p>
        </div>
      )}

      {batches.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Rig</th>
              <th>Sticker (Jenis)</th>
              <th>Total Unit</th>
              <th>PIC</th>
              <th>Catatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const isExpanded = expandedBatch === batch.batchId;
              return (
                <>
                  {/* Baris ringkasan batch */}
                  <tr
                    key={`batch-${batch.batchId}`}
                    className={`batch-row ${isExpanded ? 'batch-expanded' : ''}`}
                    onClick={() => setExpandedBatch(isExpanded ? null : batch.batchId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{batch.tanggal}</td>
                    <td><span className="badge badge-rig">{batch.rig}</span></td>
                    <td>
                      <span className="badge badge-cat">{batch.items.length} jenis</span>
                      <span className="expand-hint">
                        {isExpanded ? ' ▲ tutup' : ' ▼ lihat detail'}
                      </span>
                    </td>
                    <td><span className="badge badge-out">{batch.totalJumlah}</span></td>
                    <td>{batch.pic || '-'}</td>
                    <td className="td-desc">{batch.catatan || '-'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon-action danger"
                        title="Hapus semua"
                        onClick={() => handleDeleteBatch(batch.batchId)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Baris detail per item sticker (muncul saat di-expand) */}
                  {isExpanded && batch.items.map((item) => {
                    const sticker = stickers.find((s) => s.id === item.sticker_id);
                    return (
                      <tr key={item.id} className="batch-item-row">
                        <td></td>
                        <td></td>
                        <td>
                          <span className="item-indent">↳ </span>
                          <strong>{sticker?.nama || 'Sticker dihapus'}</strong>
                          {sticker?.ukuran && <span className="ls-size"> {sticker.ukuran}</span>}
                        </td>
                        <td><span className="badge badge-out">{item.jumlah}</span></td>
                        <td colSpan="2"></td>
                        <td>
                          <button
                            className="btn-icon-action danger"
                            title="Hapus item ini"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
