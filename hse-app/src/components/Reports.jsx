import { useState, useEffect, useMemo } from 'react';
import { getStickers, getStockIn, getDistributions } from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { RIG_LIST } from '../utils/constants';

export default function Reports() {
  const [stickers, setStickers] = useState([]);
  const [stockIn, setStockIn] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stk, si, dist] = await Promise.all([
          getStickers(),
          getStockIn(),
          getDistributions(),
        ]);
        setStickers(stk);
        setStockIn(si);
        setDistributions(dist);
      } catch (err) {
        console.error('Reports load error:', err);
        alert('Gagal memuat data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDistributions = useMemo(() => {
    if (period === 'all') return distributions;
    const cutoff = new Date();
    if (period === '7') cutoff.setDate(cutoff.getDate() - 7);
    if (period === '30') cutoff.setDate(cutoff.getDate() - 30);
    if (period === '90') cutoff.setDate(cutoff.getDate() - 90);
    return distributions.filter((d) => new Date(d.tanggal) >= cutoff);
  }, [distributions, period]);

  // Rekap per sticker
  const perSticker = useMemo(() => {
    return stickers.map((s) => {
      const masuk = stockIn
        .filter((si) => si.sticker_id === s.id)
        .reduce((sum, si) => sum + si.jumlah, 0);
      const keluar = distributions
        .filter((d) => d.sticker_id === s.id)
        .reduce((sum, d) => sum + d.jumlah, 0);
      return {
        ...s,
        totalMasuk: masuk,
        totalKeluar: keluar,
        stokSaatIni: s.stok || 0,
      };
    });
  }, [stickers, stockIn, distributions]);

  // Rekap per rig
  const perRig = useMemo(() => {
    return RIG_LIST.map((rig) => {
      const dists = filteredDistributions.filter((d) => d.rig === rig);
      const total = dists.reduce((sum, d) => sum + d.jumlah, 0);
      const bySticker = {};
      dists.forEach((d) => {
        const sticker = stickers.find((s) => s.id === d.sticker_id);
        const name = sticker ? sticker.nama : 'Unknown';
        bySticker[name] = (bySticker[name] || 0) + d.jumlah;
      });
      return { rig, total, bySticker, count: dists.length };
    }).filter((r) => r.count > 0);
  }, [filteredDistributions, stickers]);

  const totalKeluarFiltered = filteredDistributions.reduce(
    (sum, d) => sum + d.jumlah, 0
  );

  function exportCSV() {
    let csv = 'Rig,Jenis Sticker,Ukuran,Jumlah,Tanggal,PIC\n';
    filteredDistributions.forEach((d) => {
      const sticker = stickers.find((s) => s.id === d.sticker_id);
      const row = [
        d.rig,
        sticker?.nama || '-',
        sticker?.ukuran || '-',
        d.jumlah,
        d.tanggal,
        d.pic || '-',
      ];
      csv += row.map((c) => `"${c}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pengeluaran-sticker-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Laporan</h1>
        <p>Rekap inventaris dan pengeluaran sticker HSE</p>
      </div>

      <div className="toolbar">
        <div className="period-filter">
          <label>Periode:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Semua Waktu</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
          </select>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Rekap per Jenis Sticker</h3>
        </div>
        {perSticker.length === 0 ? (
          <div className="empty-state"><p>Belum ada data</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Sticker</th>
                <th>Ukuran</th>
                <th>Kategori</th>
                <th>Total Masuk</th>
                <th>Total Keluar</th>
                <th>Stok Saat Ini</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {perSticker.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.nama}</strong></td>
                  <td>{s.ukuran}</td>
                  <td><span className="badge badge-cat">{s.kategori}</span></td>
                  <td><span className="badge badge-in">+{s.totalMasuk}</span></td>
                  <td><span className="badge badge-out">{s.totalKeluar}</span></td>
                  <td>{s.stokSaatIni}</td>
                  <td>
                    {(() => {
                      const status = getStokStatus(s.stokSaatIni);
                      return <span className={`badge ${status.badgeClass}`}>{status.label}</span>;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Rekap Pengeluaran per Rig</h3>
          <span className="card-sub">Total: {totalKeluarFiltered} unit</span>
        </div>
        {perRig.length === 0 ? (
          <div className="empty-state"><p>Belum ada pengeluaran pada periode ini</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Rig</th>
                <th>Jumlah Transaksi</th>
                <th>Total Unit Keluar</th>
                <th>Detail per Sticker</th>
              </tr>
            </thead>
            <tbody>
              {perRig.map((r) => (
                <tr key={r.rig}>
                  <td><span className="badge badge-rig">{r.rig}</span></td>
                  <td>{r.count}</td>
                  <td><span className="badge badge-out">{r.total}</span></td>
                  <td>
                    <div className="detail-list">
                      {Object.entries(r.bySticker).map(([name, qty]) => (
                        <span key={name} className="detail-chip">
                          {name}: {qty}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
