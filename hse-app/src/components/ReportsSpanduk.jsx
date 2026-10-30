import { useState, useEffect, useMemo } from 'react';
import { getSpanduk, getSpandukStockIn, getSpandukDistributions } from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { RIG_LIST } from '../utils/constants';

export default function ReportsSpanduk() {
  const [spanduk, setSpanduk] = useState([]);
  const [stockIn, setStockIn] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sp, si, dist] = await Promise.all([getSpanduk(), getSpandukStockIn(), getSpandukDistributions()]);
        setSpanduk(sp); setStockIn(si); setDistributions(dist);
      } catch (err) { alert('Gagal memuat: ' + err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filteredDist = useMemo(() => {
    if (period === 'all') return distributions;
    const cutoff = new Date();
    if (period === '7') cutoff.setDate(cutoff.getDate() - 7);
    if (period === '30') cutoff.setDate(cutoff.getDate() - 30);
    if (period === '90') cutoff.setDate(cutoff.getDate() - 90);
    return distributions.filter(d => new Date(d.tanggal) >= cutoff);
  }, [distributions, period]);

  const perSpanduk = useMemo(() => spanduk.map(s => ({
    ...s,
    totalMasuk: stockIn.filter(si => si.spanduk_id === s.id).reduce((sum, si) => sum + si.jumlah, 0),
    totalKeluar: distributions.filter(d => d.spanduk_id === s.id).reduce((sum, d) => sum + d.jumlah, 0),
    stokSaatIni: s.stok || 0,
  })), [spanduk, stockIn, distributions]);

  const perRig = useMemo(() => RIG_LIST.map(rig => {
    const dists = filteredDist.filter(d => d.rig === rig);
    const total = dists.reduce((sum, d) => sum + d.jumlah, 0);
    const bySpanduk = {};
    dists.forEach(d => {
      const sp = spanduk.find(s => s.id === d.spanduk_id);
      const name = sp ? sp.nama : 'Unknown';
      bySpanduk[name] = (bySpanduk[name] || 0) + d.jumlah;
    });
    return { rig, total, bySpanduk, count: dists.length };
  }).filter(r => r.count > 0), [filteredDist, spanduk]);

  const totalKeluar = filteredDist.reduce((sum, d) => sum + d.jumlah, 0);

  function exportCSV() {
    let csv = 'Rig,Nama Spanduk,Ukuran,Jumlah,Tanggal,PIC\n';
    filteredDist.forEach(d => {
      const sp = spanduk.find(s => s.id === d.spanduk_id);
      csv += [d.rig, sp?.nama || '-', sp?.ukuran || '-', d.jumlah, d.tanggal, d.pic || '-'].map(c => `"${c}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `laporan-spanduk-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Laporan Spanduk</h1>
        <p>Rekap inventaris dan pengeluaran spanduk HSE</p>
      </div>

      <div className="toolbar">
        <div className="period-filter">
          <label>Periode:</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="all">Semua Waktu</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
          </select>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-header"><h3>Rekap per Jenis Spanduk</h3></div>
        {perSpanduk.length === 0 ? <div className="empty-state"><p>Belum ada data</p></div> : (
          <table className="data-table">
            <thead><tr><th>Nama Spanduk</th><th>Ukuran</th><th>Total Masuk</th><th>Total Keluar</th><th>Stok Saat Ini</th><th>Status</th></tr></thead>
            <tbody>
              {perSpanduk.map(s => {
                const status = getStokStatus(s.stokSaatIni);
                return (
                  <tr key={s.id}>
                    <td><strong>{s.nama}</strong></td>
                    <td>{s.ukuran}</td>
                    <td><span className="badge badge-in">+{s.totalMasuk}</span></td>
                    <td><span className="badge badge-out">{s.totalKeluar}</span></td>
                    <td>{s.stokSaatIni}</td>
                    <td><span className={`badge ${status.badgeClass}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header"><h3>Rekap Pengeluaran per Rig</h3><span className="card-sub">Total: {totalKeluar} unit</span></div>
        {perRig.length === 0 ? <div className="empty-state"><p>Belum ada pengeluaran pada periode ini</p></div> : (
          <table className="data-table">
            <thead><tr><th>Rig</th><th>Jumlah Transaksi</th><th>Total Unit</th><th>Detail per Spanduk</th></tr></thead>
            <tbody>
              {perRig.map(r => (
                <tr key={r.rig}>
                  <td><span className="badge badge-rig">{r.rig}</span></td>
                  <td>{r.count}</td>
                  <td><span className="badge badge-out">{r.total}</span></td>
                  <td><div className="detail-list">{Object.entries(r.bySpanduk).map(([name, qty]) => <span key={name} className="detail-chip">{name}: {qty}</span>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
