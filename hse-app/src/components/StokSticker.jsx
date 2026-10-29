import { useState, useEffect } from 'react';
import {
  getStickers,
  addSticker,
  updateSticker,
  deleteSticker,
  getStockIn,
  addStockIn,
  deleteStockIn,
} from '../utils/storage';
import { STICKER_CATEGORIES, UKURAN_OPTIONS, SATUAN_OPTIONS } from '../utils/constants';
import { getStokStatus } from '../utils/stokHelper';

const EMPTY_STICKER_FORM = {
  nama: '',
  ukuran: UKURAN_OPTIONS[0],
  kategori: STICKER_CATEGORIES[0],
  satuan: SATUAN_OPTIONS[0],
  stok: 0,
  deskripsi: '',
};

const EMPTY_STOCKIN_FORM = {
  stickerId: '',
  jumlah: 0,
  tanggal: new Date().toISOString().split('T')[0],
  catatan: '',
};

export default function StokSticker() {
  const [activeTab, setActiveTab] = useState('sticker');

  // --- Data state ---
  const [stickers, setStickers] = useState([]);
  const [stockIn, setStockIn] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Sticker form state ---
  const [showStickerForm, setShowStickerForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [stickerForm, setStickerForm] = useState(EMPTY_STICKER_FORM);
  const [search, setSearch] = useState('');
  const [savingSticker, setSavingSticker] = useState(false);

  // --- StockIn form state ---
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [stockInForm, setStockInForm] = useState(EMPTY_STOCKIN_FORM);
  const [savingStockIn, setSavingStockIn] = useState(false);
  const [searchStockIn, setSearchStockIn] = useState('');

  // --- Load data ---
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
      console.error('Refresh error:', err);
    }
  }

  // =====================
  // Sticker CRUD
  // =====================
  function handleOpenAddSticker() {
    setStickerForm(EMPTY_STICKER_FORM);
    setEditingId(null);
    setShowStickerForm(true);
  }

  function handleOpenEditSticker(sticker) {
    setStickerForm({
      nama: sticker.nama,
      ukuran: sticker.ukuran,
      kategori: sticker.kategori,
      satuan: sticker.satuan,
      stok: sticker.stok || 0,
      deskripsi: sticker.deskripsi || '',
    });
    setEditingId(sticker.id);
    setShowStickerForm(true);
  }

  async function handleSubmitSticker(e) {
    e.preventDefault();
    if (!stickerForm.nama.trim()) {
      alert('Nama sticker wajib diisi');
      return;
    }
    setSavingSticker(true);
    try {
      if (editingId) {
        await updateSticker(editingId, {
          nama: stickerForm.nama,
          ukuran: stickerForm.ukuran,
          kategori: stickerForm.kategori,
          satuan: stickerForm.satuan,
          deskripsi: stickerForm.deskripsi,
          stok: stickerForm.stok,
        });
      } else {
        await addSticker(stickerForm);
      }
      await refresh();
      setShowStickerForm(false);
      setStickerForm(EMPTY_STICKER_FORM);
      setEditingId(null);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingSticker(false);
    }
  }

  async function handleDeleteSticker(id) {
    if (confirm('Hapus sticker ini? Semua riwayat stok masuk dan pengeluaran terkait juga akan dihapus.')) {
      try {
        await deleteSticker(id);
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  // =====================
  // Stock In CRUD
  // =====================
  function handleOpenStockIn() {
    setStockInForm({ ...EMPTY_STOCKIN_FORM, stickerId: stickers[0]?.id || '' });
    setShowStockInForm(true);
  }

  async function handleSubmitStockIn(e) {
    e.preventDefault();
    if (!stockInForm.stickerId) {
      alert('Pilih jenis sticker terlebih dahulu');
      return;
    }
    if (stockInForm.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    setSavingStockIn(true);
    try {
      await addStockIn(stockInForm);
      await refresh();
      setShowStockInForm(false);
      setStockInForm(EMPTY_STOCKIN_FORM);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingStockIn(false);
    }
  }

  async function handleDeleteStockIn(id) {
    if (confirm('Hapus riwayat stok masuk ini? Stok sticker akan dikurangi kembali.')) {
      try {
        await deleteStockIn(id);
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  // =====================
  // Filter
  // =====================
  const filteredStickers = stickers.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const sortedStockIn = [...stockIn]
    .filter((s) => {
      if (!searchStockIn) return true;
      const sticker = stickers.find((stk) => stk.id === s.sticker_id);
      return sticker?.nama?.toLowerCase().includes(searchStockIn.toLowerCase());
    })
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stok Sticker</h1>
        <p>Kelola jenis sticker dan riwayat stok masuk</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'sticker' ? 'active' : ''}`}
          onClick={() => setActiveTab('sticker')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5" />
            <path d="M15 22l7-7-4-4-7 7v4z" />
          </svg>
          Daftar Sticker
        </button>
        <button
          className={`tab-btn ${activeTab === 'stockin' ? 'active' : ''}`}
          onClick={() => setActiveTab('stockin')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Riwayat Stok Masuk
        </button>
      </div>

      {/* ======================== TAB: DAFTAR STICKER ======================== */}
      {activeTab === 'sticker' && (
        <>
          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleOpenAddSticker}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tambah Sticker
            </button>
          </div>

          {/* Modal Form Sticker */}
          {showStickerForm && (
            <div className="modal-overlay" onClick={() => setShowStickerForm(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingId ? 'Edit Sticker' : 'Tambah Sticker'}</h2>
                  <button className="btn-close" onClick={() => setShowStickerForm(false)}>×</button>
                </div>
                <form onSubmit={handleSubmitSticker} className="form-grid">
                  <div className="form-group">
                    <label>Nama Sticker *</label>
                    <input
                      type="text"
                      value={stickerForm.nama}
                      onChange={(e) => setStickerForm({ ...stickerForm, nama: e.target.value })}
                      placeholder="cth: Sticker Helm Safety"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ukuran</label>
                    <select
                      value={UKURAN_OPTIONS.includes(stickerForm.ukuran) ? stickerForm.ukuran : 'Custom'}
                      onChange={(e) => setStickerForm({ ...stickerForm, ukuran: e.target.value === 'Custom' ? '' : e.target.value })}
                    >
                      {UKURAN_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    {(!UKURAN_OPTIONS.includes(stickerForm.ukuran) || stickerForm.ukuran === '') && (
                      <input
                        type="text"
                        value={stickerForm.ukuran}
                        onChange={(e) => setStickerForm({ ...stickerForm, ukuran: e.target.value })}
                        placeholder="cth: 25x25 cm"
                        style={{ marginTop: '6px' }}
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Satuan</label>
                    <select
                      value={stickerForm.satuan}
                      onChange={(e) => setStickerForm({ ...stickerForm, satuan: e.target.value })}
                    >
                      {SATUAN_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={stickerForm.stok === 0 ? '' : stickerForm.stok}
                      onChange={(e) => setStickerForm({ ...stickerForm, stok: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi</label>
                    <textarea
                      rows="2"
                      value={stickerForm.deskripsi}
                      onChange={(e) => setStickerForm({ ...stickerForm, deskripsi: e.target.value })}
                      placeholder="Keterangan tambahan (opsional)"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowStickerForm(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingSticker}>
                      {savingSticker ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {filteredStickers.length === 0 ? (
            <div className="empty-state big">
              <p>Belum ada data sticker. Klik "Tambah Sticker" untuk mulai.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Sticker</th>
                  <th>Ukuran</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStickers.map((s) => {
                  const status = getStokStatus(s.stok);
                  return (
                  <tr key={s.id}>
                    <td><strong>{s.nama}</strong></td>
                    <td>{s.ukuran}</td>
                    <td>
                      <span className={`badge ${status.badgeClass}`}>
                        {s.stok || 0}
                      </span>
                    </td>
                    <td><span className={`badge ${status.badgeClass}`}>{status.label}</span></td>
                    <td className="td-desc">{s.deskripsi || '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon-action" title="Edit" onClick={() => handleOpenEditSticker(s)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="btn-icon-action danger" title="Hapus" onClick={() => handleDeleteSticker(s.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
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
        </>
      )}

      {/* ======================== TAB: RIWAYAT STOK MASUK ======================== */}
      {activeTab === 'stockin' && (
        <>
          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama sticker..."
              value={searchStockIn}
              onChange={(e) => setSearchStockIn(e.target.value)}
            />
            <span className="badge badge-ok">{stockIn.length} transaksi</span>
            <button
              className="btn btn-primary"
              onClick={handleOpenStockIn}
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
              <p>Belum ada sticker. Tambah sticker dulu di tab "Daftar Sticker".</p>
            </div>
          )}

          {/* Modal Form Stok Masuk */}
          {showStockInForm && (
            <div className="modal-overlay" onClick={() => setShowStockInForm(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Tambah Stok Masuk</h2>
                  <button className="btn-close" onClick={() => setShowStockInForm(false)}>×</button>
                </div>
                <form onSubmit={handleSubmitStockIn} className="form-grid">
                  <div className="form-group full-width">
                    <label>Jenis Sticker *</label>
                    <select
                      value={stockInForm.stickerId}
                      onChange={(e) => setStockInForm({ ...stockInForm, stickerId: e.target.value })}
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
                    <label>Jumlah *</label>                    <input
                      type="number"
                      min="1"
                      value={stockInForm.jumlah || ''}
                      onChange={(e) => setStockInForm({ ...stockInForm, jumlah: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tanggal *</label>
                    <input
                      type="date"
                      value={stockInForm.tanggal}
                      onChange={(e) => setStockInForm({ ...stockInForm, tanggal: e.target.value })}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Catatan</label>
                    <textarea
                      rows="2"
                      value={stockInForm.catatan}
                      onChange={(e) => setStockInForm({ ...stockInForm, catatan: e.target.value })}
                      placeholder="Keterangan tambahan (opsional)"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowStockInForm(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingStockIn}>
                      {savingStockIn ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {sortedStockIn.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis Sticker</th>
                  <th>Ukuran</th>
                  <th>Jumlah</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedStockIn.map((s) => {
                  const sticker = stickers.find((stk) => stk.id === s.sticker_id);
                  return (
                    <tr key={s.id}>
                      <td>{s.tanggal}</td>
                      <td><strong>{sticker?.nama || 'Sticker dihapus'}</strong></td>
                      <td>{sticker?.ukuran || '-'}</td>
                      <td><span className="badge badge-in">+{s.jumlah}</span></td>
                      <td className="td-desc">{s.catatan || '-'}</td>
                      <td>
                        <button className="btn-icon-action danger" title="Hapus" onClick={() => handleDeleteStockIn(s.id)}>
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
          ) : (
            stickers.length > 0 && (
              <div className="empty-state big">
                <p>Belum ada riwayat stok masuk. Klik "Tambah Stok Masuk" untuk mulai.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
