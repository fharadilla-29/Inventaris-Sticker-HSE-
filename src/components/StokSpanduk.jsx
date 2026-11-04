import { useState, useEffect } from 'react';
import {
  getSpanduk, addSpanduk, updateSpanduk, deleteSpanduk,
  getSpandukStockIn, addSpandukStockInBatch, deleteSpandukStockIn,
} from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { UKURAN_OPTIONS } from '../utils/constants';
import SearchableSelect from './SearchableSelect';
import ImageUpload from './ImageUpload';

const EMPTY_FORM = { nama: '', ukuran: UKURAN_OPTIONS[0], stok: 0, deskripsi: '', image_url: '' };

function emptyItem() { return { spandukId: '', jumlah: 1 }; }
function emptyStockInForm() {
  return {
    tanggal: new Date().toISOString().split('T')[0],
    catatan: '',
    items: [emptyItem()],
  };
}

export default function StokSpanduk() {
  const [activeTab, setActiveTab] = useState('daftar');
  const [spanduk, setSpanduk] = useState([]);
  const [stockIn, setStockIn] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daftar form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [savingSpanduk, setSavingSpanduk] = useState(false);

  // StockIn form
  const [showSIForm, setShowSIForm] = useState(false);
  const [siForm, setSIForm] = useState(emptyStockInForm());
  const [savingSI, setSavingSI] = useState(false);
  const [searchSI, setSearchSI] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sp, si] = await Promise.all([getSpanduk(), getSpandukStockIn()]);
        setSpanduk(sp); setStockIn(si);
      } catch (err) { alert('Gagal memuat: ' + err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function refresh() {
    const [sp, si] = await Promise.all([getSpanduk(), getSpandukStockIn()]);
    setSpanduk(sp); setStockIn(si);
  }

  // =====================
  // Spanduk CRUD
  // =====================
  async function handleSubmitSpanduk(e) {
    e.preventDefault();
    if (!form.nama.trim()) { alert('Nama wajib diisi'); return; }
    setSavingSpanduk(true);
    try {
      if (editingId) {
        await updateSpanduk(editingId, { nama: form.nama, ukuran: form.ukuran, deskripsi: form.deskripsi, stok: form.stok, image_url: form.image_url });
      } else {
        await addSpanduk(form);      }
      await refresh(); setShowForm(false); setForm(EMPTY_FORM); setEditingId(null);
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSavingSpanduk(false); }
  }

  async function handleDelete(id) {
    if (confirm('Hapus spanduk ini beserta semua riwayatnya?')) {
      try { await deleteSpanduk(id); await refresh(); }
      catch (err) { alert('Gagal: ' + err.message); }
    }
  }

  // =====================
  // Stock In multi-item
  // =====================
  function setSIItem(index, field, value) {
    const items = siForm.items.map((it, i) => i === index ? { ...it, [field]: value } : it);
    setSIForm({ ...siForm, items });
  }

  function addSIItem() {
    setSIForm({ ...siForm, items: [...siForm.items, emptyItem()] });
  }

  function removeSIItem(index) {
    if (siForm.items.length === 1) return;
    setSIForm({ ...siForm, items: siForm.items.filter((_, i) => i !== index) });
  }

  async function handleSubmitSI(e) {
    e.preventDefault();
    for (let i = 0; i < siForm.items.length; i++) {
      const item = siForm.items[i];
      if (!item.spandukId) { alert(`Baris ke-${i + 1}: Pilih jenis spanduk`); return; }
      if (item.jumlah <= 0) { alert(`Baris ke-${i + 1}: Jumlah harus > 0`); return; }
    }
    const ids = siForm.items.map(it => it.spandukId);
    if (new Set(ids).size !== ids.length) { alert('Ada spanduk yang dipilih lebih dari satu kali.'); return; }
    setSavingSI(true);
    try {
      const records = siForm.items.map(it => ({
        spandukId: it.spandukId,
        jumlah: it.jumlah,
        tanggal: siForm.tanggal,
        catatan: siForm.catatan,
      }));
      await addSpandukStockInBatch(records);
      await refresh(); setShowSIForm(false); setSIForm(emptyStockInForm());
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSavingSI(false); }
  }

  async function handleDeleteSI(id) {
    if (confirm('Hapus riwayat stok masuk ini?')) {
      try { await deleteSpandukStockIn(id); await refresh(); }
      catch (err) { alert('Gagal: ' + err.message); }
    }
  }

  const filteredSpanduk = spanduk
    .filter(s => s.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const filteredSI = [...stockIn]
    .filter(s => {
      if (!searchSI) return true;
      const sp = spanduk.find(x => x.id === s.spanduk_id);
      return sp?.nama?.toLowerCase().includes(searchSI.toLowerCase());
    })
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stok Spanduk</h1>
        <p>Kelola jenis spanduk dan riwayat stok masuk</p>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'daftar' ? 'active' : ''}`} onClick={() => setActiveTab('daftar')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          Daftar Spanduk
        </button>
        <button className={`tab-btn ${activeTab === 'stockin' ? 'active' : ''}`} onClick={() => setActiveTab('stockin')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Riwayat Stok Masuk
        </button>
      </div>

      {/* ===== TAB DAFTAR ===== */}
      {activeTab === 'daftar' && (
        <>
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Cari nama spanduk..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>
              Tambah Spanduk
            </button>
          </div>

          {showForm && (
            <div className="modal-overlay" onClick={() => setShowForm(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingId ? 'Edit Spanduk' : 'Tambah Spanduk'}</h2>
                  <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
                </div>
                <form onSubmit={handleSubmitSpanduk} className="form-grid">
                  <div className="form-group">
                    <label>Nama Spanduk *</label>
                    <input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="cth: Spanduk K3" />
                  </div>
                  <div className="form-group">
                    <label>Ukuran</label>
                    <select value={UKURAN_OPTIONS.includes(form.ukuran) ? form.ukuran : 'Custom'} onChange={e => setForm({ ...form, ukuran: e.target.value === 'Custom' ? '' : e.target.value })}>
                      {UKURAN_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {(!UKURAN_OPTIONS.includes(form.ukuran) || form.ukuran === '') && (
                      <input type="text" value={form.ukuran} onChange={e => setForm({ ...form, ukuran: e.target.value })} placeholder="cth: 100x50 cm" style={{ marginTop: '6px' }} />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Stok</label>
                    <input type="number" min="0" value={form.stok === 0 ? '' : form.stok} onChange={e => setForm({ ...form, stok: parseInt(e.target.value) || 0 })} placeholder="0" />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi</label>
                    <textarea rows="2" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Keterangan tambahan (opsional)" />
                  </div>
                  <div className="form-group full-width">
                    <label>Gambar Spanduk</label>
                    <ImageUpload
                      currentUrl={form.image_url}
                      onUploaded={(url) => setForm({ ...form, image_url: url })}
                      folder="spanduk"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                    <button type="submit" className="btn btn-primary" disabled={savingSpanduk}>{savingSpanduk ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {filteredSpanduk.length === 0 ? (
            <div className="empty-state big"><p>Belum ada data spanduk. Klik "Tambah Spanduk" untuk mulai.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Gambar</th><th>Nama Spanduk</th><th>Ukuran</th><th>Stok</th><th>Status</th><th>Deskripsi</th><th>Aksi</th></tr></thead>
              <tbody>
                {filteredSpanduk.map(s => {
                  const status = getStokStatus(s.stok);
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.nama} className="tbl-img" onClick={() => window.open(s.image_url, '_blank')} />
                        ) : (
                          <div className="tbl-img-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                        )}
                      </td>
                      <td><strong>{s.nama}</strong></td>
                      <td>{s.ukuran}</td>
                      <td><span className={`badge ${status.badgeClass}`}>{s.stok || 0}</span></td>
                      <td><span className={`badge ${status.badgeClass}`}>{status.label}</span></td>
                      <td className="td-desc">{s.deskripsi || '-'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon-action" onClick={() => { setForm({ nama: s.nama, ukuran: s.ukuran, stok: s.stok || 0, deskripsi: s.deskripsi || '' }); setEditingId(s.id); setShowForm(true); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon-action danger" onClick={() => handleDelete(s.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ===== TAB STOK MASUK ===== */}
      {activeTab === 'stockin' && (
        <>
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Cari nama spanduk..." value={searchSI} onChange={e => setSearchSI(e.target.value)} />
            <span className="badge badge-ok">{stockIn.length} transaksi</span>
            <button className="btn btn-primary" disabled={spanduk.length === 0} onClick={() => { setSIForm(emptyStockInForm()); setShowSIForm(true); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>
              Tambah Stok Masuk
            </button>
          </div>

          {spanduk.length === 0 && (
            <div className="empty-state big"><p>Belum ada spanduk. Tambah spanduk dulu di tab "Daftar Spanduk".</p></div>
          )}

          {/* Modal Form Stok Masuk Multi-item */}
          {showSIForm && (
            <div className="modal-overlay" onClick={() => setShowSIForm(false)}>
              <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Tambah Stok Masuk Spanduk</h2>
                  <button className="btn-close" onClick={() => setShowSIForm(false)}>×</button>
                </div>
                <form onSubmit={handleSubmitSI} className="form-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tanggal *</label>
                      <input type="date" value={siForm.tanggal} onChange={e => setSIForm({ ...siForm, tanggal: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Catatan</label>
                      <input type="text" value={siForm.catatan} onChange={e => setSIForm({ ...siForm, catatan: e.target.value })} placeholder="Keterangan tambahan (opsional)" />
                    </div>
                  </div>

                  <div className="items-section">
                    <div className="items-header">
                      <span className="items-title">Daftar Spanduk</span>
                      <span className="items-count">{siForm.items.length} item</span>
                    </div>
                    <div className="items-list">
                      <div className="item-row item-row-head">
                        <span>Jenis Spanduk</span>
                        <span>Stok Saat Ini</span>
                        <span>Jumlah Masuk</span>
                        <span></span>
                      </div>
                      {siForm.items.map((item, index) => {
                        const sel = spanduk.find(s => s.id === item.spandukId);
                        const sortedOptions = [...spanduk]
                          .sort((a, b) => a.nama.localeCompare(b.nama))
                          .map(s => ({ value: s.id, label: s.nama, sub: `${s.ukuran} · Stok: ${s.stok || 0}` }));
                        return (
                          <div key={index} className="item-row">
                            <SearchableSelect
                              options={sortedOptions}
                              value={item.spandukId}
                              onChange={(val) => setSIItem(index, 'spandukId', val)}
                              placeholder="-- Pilih Spanduk --"
                            />
                            <span className={`stok-info ${sel && (sel.stok || 0) <= 20 ? 'stok-low' : sel && (sel.stok || 0) <= 50 ? 'stok-warning' : ''}`}>
                              {sel ? `${sel.stok || 0}` : '-'}
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah || ''}
                              onChange={e => setSIItem(index, 'jumlah', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="jumlah-input"
                            />
                            <button type="button" className="btn-remove-item" onClick={() => removeSIItem(index)} disabled={siForm.items.length === 1}>×</button>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" className="btn-add-item" onClick={addSIItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
                      Tambah Jenis Spanduk
                    </button>
                  </div>

                  <div className="batch-summary">
                    <span>Total item: <strong>{siForm.items.length} jenis</strong></span>
                    <span>Total unit: <strong>{siForm.items.reduce((s, it) => s + (it.jumlah || 0), 0)}</strong></span>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowSIForm(false)}>Batal</button>
                    <button type="submit" className="btn btn-primary" disabled={savingSI}>{savingSI ? 'Menyimpan...' : 'Simpan Stok Masuk'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {filteredSI.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Tanggal</th><th>Nama Spanduk</th><th>Ukuran</th><th>Jumlah</th><th>Catatan</th><th>Aksi</th></tr></thead>
              <tbody>
                {filteredSI.map(s => {
                  const sp = spanduk.find(x => x.id === s.spanduk_id);
                  return (
                    <tr key={s.id}>
                      <td>{s.tanggal}</td>
                      <td><strong>{sp?.nama || 'Spanduk dihapus'}</strong></td>
                      <td>{sp?.ukuran || '-'}</td>
                      <td><span className="badge badge-in">+{s.jumlah}</span></td>
                      <td className="td-desc">{s.catatan || '-'}</td>
                      <td>
                        <button className="btn-icon-action danger" onClick={() => handleDeleteSI(s.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            spanduk.length > 0 && <div className="empty-state big"><p>Belum ada riwayat stok masuk spanduk.</p></div>
          )}
        </>
      )}
    </div>
  );
}
