import { useState, useEffect } from 'react';
import {
  getStickers,
  addSticker,
  updateSticker,
  deleteSticker,
} from '../utils/storage';
import { STICKER_CATEGORIES, UKURAN_OPTIONS, SATUAN_OPTIONS } from '../utils/constants';

const EMPTY_FORM = {
  nama: '',
  ukuran: UKURAN_OPTIONS[0],
  kategori: STICKER_CATEGORIES[0],
  satuan: SATUAN_OPTIONS[0],
  stok: 0,
  deskripsi: '',
};

export default function StickerTypes() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getStickers();
        setStickers(data);
      } catch (err) {
        console.error('Load stickers error:', err);
        alert('Gagal memuat data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refresh() {
    try {
      const data = await getStickers();
      setStickers(data);
    } catch (err) {
      console.error('Load stickers error:', err);
      alert('Gagal memuat data: ' + err.message);
    }
  }

  function handleOpenAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function handleOpenEdit(sticker) {
    setForm({
      nama: sticker.nama,
      ukuran: sticker.ukuran,
      kategori: sticker.kategori,
      satuan: sticker.satuan,
      stok: sticker.stok || 0,
      deskripsi: sticker.deskripsi || '',
    });
    setEditingId(sticker.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nama.trim()) {
      alert('Nama sticker wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updates = {
          nama: form.nama,
          ukuran: form.ukuran,
          kategori: form.kategori,
          satuan: form.satuan,
          deskripsi: form.deskripsi,
        };
        await updateSticker(editingId, updates);
      } else {
        await addSticker(form);
      }
      await refresh();
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Hapus jenis sticker ini? Semua data stok masuk dan pengeluaran terkait juga akan dihapus.')) {
      try {
        await deleteSticker(id);
        await refresh();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  const filtered = stickers.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.kategori.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Jenis Sticker</h1>
        <p>Kelola jenis dan ukuran sticker HSE</p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Cari nama atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Sticker
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Sticker' : 'Tambah Sticker'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>Nama Sticker *</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth: Sticker Helm Safety"
                />
              </div>
              <div className="form-group">
                <label>Ukuran</label>
                <select
                  value={form.ukuran}
                  onChange={(e) => setForm({ ...form, ukuran: e.target.value })}
                >
                  {UKURAN_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                >
                  {STICKER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Satuan</label>
                <select
                  value={form.satuan}
                  onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                >
                  {SATUAN_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  value={form.stok}
                  onChange={(e) => setForm({ ...form, stok: parseInt(e.target.value) || 0 })}
                  disabled={!!editingId}
                />
                {editingId && (
                  <small className="form-hint">Stok diperbarui otomatis dari transaksi</small>
                )}
              </div>
              <div className="form-group full-width">
                <label>Deskripsi</label>
                <textarea
                  rows="2"
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Keterangan tambahan (opsional)"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state big">
          <p>Belum ada data sticker. Klik "Tambah Sticker" untuk mulai.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Sticker</th>
              <th>Ukuran</th>
              <th>Kategori</th>
              <th>Satuan</th>
              <th>Stok</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.nama}</strong></td>
                <td>{s.ukuran}</td>
                <td><span className="badge badge-cat">{s.kategori}</span></td>
                <td>{s.satuan}</td>
                <td>
                  <span className={`badge ${(s.stok || 0) <= 10 ? 'badge-low' : 'badge-ok'}`}>
                    {s.stok || 0}
                  </span>
                </td>
                <td className="td-desc">{s.deskripsi || '-'}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon-action" title="Edit" onClick={() => handleOpenEdit(s)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="btn-icon-action danger" title="Hapus" onClick={() => handleDelete(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
