import { useState, useEffect } from 'react';
import { getStickers, getSpanduk, addOrder } from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { RIG_LIST } from '../utils/constants';

const EMPTY_FORM = {
  item_type: 'sticker',
  item_id: '',
  item_nama: '',
  item_ukuran: '',
  jumlah: 1,
  rig: RIG_LIST[0],
  pic: '',
  catatan: '',
};

export default function CoordinatorView({ user }) {
  const [stickers, setStickers] = useState([]);
  const [spanduk, setSpanduk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sticker');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, pic: user || '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stk, sp] = await Promise.all([getStickers(), getSpanduk()]);
        setStickers(stk);
        setSpanduk(sp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = activeTab === 'sticker'
    ? stickers.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.nama.localeCompare(b.nama))
    : spanduk.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.nama.localeCompare(b.nama));

  function handleOrder(item) {
    setForm({
      item_type: activeTab,
      item_id: item.id,
      item_nama: item.nama,
      item_ukuran: item.ukuran || '',
      jumlah: 1,
      rig: RIG_LIST[0],
      pic: user || '',
      catatan: '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pic.trim()) { alert('Nama PIC wajib diisi'); return; }
    if (form.jumlah <= 0) { alert('Jumlah harus lebih dari 0'); return; }
    setSaving(true);
    try {
      await addOrder(form);
      setShowForm(false);
      setSuccessMsg(`Pesanan ${form.item_nama} berhasil dikirim! Admin HSE akan memproses pesanan Anda.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Gagal mengirim pesanan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Katalog Inventaris HSE</h1>
        <p>Lihat stok dan pesan sticker / spanduk yang dibutuhkan</p>
      </div>

      {successMsg && (
        <div className="order-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Tab */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'sticker' ? 'active' : ''}`} onClick={() => { setActiveTab('sticker'); setSearch(''); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"/><path d="M15 22l7-7-4-4-7 7v4z"/>
          </svg>
          Sticker ({stickers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'spanduk' ? 'active' : ''}`} onClick={() => { setActiveTab('spanduk'); setSearch(''); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6V4M18 6V4"/>
          </svg>
          Spanduk ({spanduk.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder={`Cari ${activeTab}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="badge badge-ok">{items.length} item</span>
      </div>

      {/* Grid katalog */}
      {items.length === 0 ? (
        <div className="empty-state big"><p>Tidak ada data ditemukan.</p></div>
      ) : (
        <div className="catalog-grid">
          {items.map(item => {
            const status = getStokStatus(item.stok);
            return (
              <div key={item.id} className="catalog-card">
                {item.image_url ? (
                  <div className="catalog-img">
                    <img src={item.image_url} alt={item.nama} />
                  </div>
                ) : (
                  <div className="catalog-img catalog-no-img">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="40" height="40">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <div className="catalog-body">
                  <h4 className="catalog-name" title={item.nama}>{item.nama}</h4>
                  <span className="catalog-size">{item.ukuran}</span>
                  <div className="catalog-footer">
                    <div className="catalog-stok">
                      <span className="catalog-stok-label">Stok:</span>
                      <span className={`badge ${status.badgeClass}`}>{item.stok || 0}</span>
                    </div>
                    <button
                      className="btn-order"
                      onClick={() => handleOrder(item)}
                      disabled={(item.stok || 0) === 0}
                    >
                      {(item.stok || 0) === 0 ? 'Habis' : 'Pesan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Pesan */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Form Pemesanan</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group full-width">
                <label>Item yang Dipesan</label>
                <div className="order-item-info">
                  <strong>{form.item_nama}</strong>
                  <span>{form.item_ukuran}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Jumlah *</label>
                <input
                  type="number"
                  min="1"
                  value={form.jumlah || ''}
                  onChange={e => setForm({ ...form, jumlah: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Rig *</label>
                <select value={form.rig} onChange={e => setForm({ ...form, rig: e.target.value })}>
                  {RIG_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Nama PIC *</label>
                <input
                  type="text"
                  value={form.pic}
                  onChange={e => setForm({ ...form, pic: e.target.value })}
                  placeholder="Nama Anda"
                />
              </div>
              <div className="form-group full-width">
                <label>Catatan</label>
                <textarea
                  rows="2"
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Keterangan tambahan (opsional)"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Mengirim...' : 'Kirim Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
