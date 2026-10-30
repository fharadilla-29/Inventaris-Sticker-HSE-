import { useState, useEffect } from 'react';
import {
  getSpanduk, getSpandukDistributions,
  addSpandukDistributionBatch, deleteSpandukDistributionBatch, deleteSpandukDistribution,
} from '../utils/storage';
import { RIG_LIST } from '../utils/constants';

function emptyItem() { return { spandukId: '', jumlah: 1 }; }
function emptyForm() {
  return { rig: RIG_LIST[0], tanggal: new Date().toISOString().split('T')[0], pic: '', catatan: '', items: [emptyItem()] };
}

export default function DistributionSpanduk() {
  const [distributions, setDistributions] = useState([]);
  const [spanduk, setSpanduk] = useState([]);
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
        const [sp, dist] = await Promise.all([getSpanduk(), getSpandukDistributions()]);
        setSpanduk(sp); setDistributions(dist);
      } catch (err) { alert('Gagal memuat: ' + err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function refresh() {
    const [sp, dist] = await Promise.all([getSpanduk(), getSpandukDistributions()]);
    setSpanduk(sp); setDistributions(dist);
  }

  function setItem(index, field, value) {
    const items = form.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setForm({ ...form, items });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.spandukId) { alert(`Baris ke-${i + 1}: Pilih spanduk`); return; }
      if (item.jumlah <= 0) { alert(`Baris ke-${i + 1}: Jumlah harus > 0`); return; }
      const sp = spanduk.find(s => s.id === item.spandukId);
      if (sp && item.jumlah > (sp.stok || 0)) { alert(`Baris ke-${i + 1} (${sp.nama}): Stok tidak mencukupi. Tersedia: ${sp.stok || 0}`); return; }
    }
    const ids = form.items.map(it => it.spandukId);
    if (new Set(ids).size !== ids.length) { alert('Ada spanduk yang dipilih lebih dari satu kali.'); return; }
    setSaving(true);
    try {
      await addSpandukDistributionBatch(form);
      await refresh(); setShowForm(false); setForm(emptyForm());
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteBatch(batchId) {
    if (confirm('Hapus semua spanduk dalam pengeluaran ini?')) {
      try { await deleteSpandukDistributionBatch(batchId); await refresh(); }
      catch (err) { alert('Gagal: ' + err.message); }
    }
  }

  async function handleDeleteItem(id) {
    if (confirm('Hapus item ini?')) {
      try { await deleteSpandukDistribution(id); await refresh(); }
      catch (err) { alert('Gagal: ' + err.message); }
    }
  }

  const filtered = filterRig ? distributions.filter(d => d.rig === filterRig) : distributions;
  const batchMap = {};
  filtered.forEach(d => {
    const key = d.batch_id || d.id;
    if (!batchMap[key]) batchMap[key] = { batchId: key, rig: d.rig, tanggal: d.tanggal, pic: d.pic, catatan: d.catatan, items: [], totalJumlah: 0 };
    batchMap[key].items.push(d);
    batchMap[key].totalJumlah += d.jumlah;
  });
  const batches = Object.values(batchMap).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  const totalByFilter = filtered.reduce((sum, d) => sum + d.jumlah, 0);

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stok Keluar Spanduk</h1>
        <p>Pengeluaran spanduk ke masing-masing rig</p>
      </div>

      <div className="toolbar">
        <select className="filter-select" value={filterRig} onChange={e => setFilterRig(e.target.value)}>
          <option value="">Semua Rig</option>
          {RIG_LIST.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="badge badge-out">Total: {totalByFilter} unit</span>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setShowForm(true); }} disabled={spanduk.length === 0}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>
          Tambah Stok Keluar
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Stok Keluar Spanduk</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Rig Tujuan *</label>
                  <select value={form.rig} onChange={e => setForm({ ...form, rig: e.target.value })}>
                    {RIG_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tanggal *</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>PIC</label>
                  <input type="text" value={form.pic} onChange={e => setForm({ ...form, pic: e.target.value })} placeholder="cth: Andi (HSE Officer)" />
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <input type="text" value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} placeholder="Opsional" />
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <span className="items-title">Daftar Spanduk</span>
                  <span className="items-count">{form.items.length} item</span>
                </div>
                <div className="items-list">
                  <div className="item-row item-row-head">
                    <span>Jenis Spanduk</span><span>Stok Tersedia</span><span>Jumlah Keluar</span><span></span>
                  </div>
                  {form.items.map((item, index) => {
                    const sel = spanduk.find(s => s.id === item.spandukId);
                    return (
                      <div key={index} className="item-row">
                        <select value={item.spandukId} onChange={e => setItem(index, 'spandukId', e.target.value)}>
                          <option value="">-- Pilih Spanduk --</option>
                          {spanduk.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.ukuran})</option>)}
                        </select>
                        <span className={`stok-info ${sel && sel.stok <= 20 ? 'stok-low' : sel && sel.stok <= 50 ? 'stok-warning' : ''}`}>
                          {sel ? `${sel.stok || 0}` : '-'}
                        </span>
                        <input type="number" min="1" value={item.jumlah || ''} onChange={e => setItem(index, 'jumlah', parseInt(e.target.value) || 0)} placeholder="0" className="jumlah-input" />
                        <button type="button" className="btn-remove-item" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })} disabled={form.items.length === 1}>×</button>
                      </div>
                    );
                  })}
                </div>
                <button type="button" className="btn-add-item" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
                  Tambah Jenis Spanduk
                </button>
              </div>

              <div className="batch-summary">
                <span>Total item: <strong>{form.items.length} jenis</strong></span>
                <span>Total unit: <strong>{form.items.reduce((s, it) => s + (it.jumlah || 0), 0)}</strong></span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pengeluaran'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {batches.length === 0 && spanduk.length > 0 && <div className="empty-state big"><p>Belum ada data stok keluar spanduk.</p></div>}
      {spanduk.length === 0 && <div className="empty-state big"><p>Belum ada spanduk. Tambah spanduk di menu "Stok Spanduk".</p></div>}

      {batches.length > 0 && (
        <table className="data-table">
          <thead><tr><th>Tanggal</th><th>Rig</th><th>Spanduk (Jenis)</th><th>Total Unit</th><th>PIC</th><th>Catatan</th><th>Aksi</th></tr></thead>
          <tbody>
            {batches.map(batch => {
              const isExpanded = expandedBatch === batch.batchId;
              return (
                <>
                  <tr key={`b-${batch.batchId}`} className={`batch-row ${isExpanded ? 'batch-expanded' : ''}`} onClick={() => setExpandedBatch(isExpanded ? null : batch.batchId)} style={{ cursor: 'pointer' }}>
                    <td>{batch.tanggal}</td>
                    <td><span className="badge badge-rig">{batch.rig}</span></td>
                    <td>
                      <span className="badge badge-cat">{batch.items.length} jenis</span>
                      <span className="expand-hint">{isExpanded ? ' ▲ tutup' : ' ▼ lihat detail'}</span>
                    </td>
                    <td><span className="badge badge-out">{batch.totalJumlah}</span></td>
                    <td>{batch.pic || '-'}</td>
                    <td className="td-desc">{batch.catatan || '-'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-icon-action danger" onClick={() => handleDeleteBatch(batch.batchId)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && batch.items.map(item => {
                    const sp = spanduk.find(s => s.id === item.spanduk_id);
                    return (
                      <tr key={item.id} className="batch-item-row">
                        <td></td><td></td>
                        <td><span className="item-indent">↳ </span><strong>{sp?.nama || 'Spanduk dihapus'}</strong>{sp?.ukuran && <span className="ls-size"> {sp.ukuran}</span>}</td>
                        <td><span className="badge badge-out">{item.jumlah}</span></td>
                        <td colSpan="2"></td>
                        <td><button className="btn-icon-action danger" onClick={() => handleDeleteItem(item.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg></button></td>
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
