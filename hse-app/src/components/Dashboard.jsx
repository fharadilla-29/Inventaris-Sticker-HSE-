import { useState, useEffect, useMemo } from 'react';
import { getStickers, getStockIn, getDistributions } from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { RIG_LIST } from '../utils/constants';

export default function Dashboard() {
  const [stickers, setStickers] = useState([]);
  const [stockIn, setStockIn] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStok = useMemo(
    () => stickers.reduce((sum, s) => sum + (s.stok || 0), 0),
    [stickers]
  );
  const totalMasuk = useMemo(
    () => stockIn.reduce((sum, s) => sum + s.jumlah, 0),
    [stockIn]
  );
  const totalKeluar = useMemo(
    () => distributions.reduce((sum, d) => sum + d.jumlah, 0),
    [distributions]
  );
  const stokMenipis = useMemo(
    () => stickers.filter((s) => (s.stok || 0) <= 50),
    [stickers]
  );

  const perRig = useMemo(() => {
    const map = {};
    RIG_LIST.forEach((rig) => {
      map[rig] = distributions
        .filter((d) => d.rig === rig)
        .reduce((sum, d) => sum + d.jumlah, 0);
    });
    return map;
  }, [distributions]);

  const maxRigValue = Math.max(...Object.values(perRig), 1);

  if (loading) {
    return <div className="page"><div className="loading-state">Memuat data...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Ringkasan inventaris sticker HSE</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5" />
              <path d="M15 22l7-7-4-4-7 7v4z" />
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{stickers.length}</span>
            <span className="stat-label">Jenis Sticker</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalStok}</span>
            <span className="stat-label">Total Stok Saat Ini</span>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalMasuk}</span>
            <span className="stat-label">Total Stok Masuk</span>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalKeluar}</span>
            <span className="stat-label">Total Pengeluaran</span>
          </div>
        </div>
      </div>

      <div className="dash-row">
        {/* Pengeluaran per Rig — Vertical Bar Chart */}
        <div className="card flex-2">
          <div className="card-header">
            <h3>Stok Keluar per Rig</h3>
            <span className="card-sub">Total: {totalKeluar} unit</span>
          </div>
          <div className="rig-chart-wrap">
            {totalKeluar === 0 ? (
              <div className="empty-state"><p>Belum ada data pengeluaran</p></div>
            ) : (
              <div className="rig-chart">
                {RIG_LIST.filter((rig) => (perRig[rig] || 0) > 0).map((rig) => {
                  const val = perRig[rig] || 0;
                  const pct = Math.round((val / maxRigValue) * 100);
                  return (
                    <div key={rig} className="rig-col">
                      <span className="rig-col-val">{val}</span>
                      <div className="rig-col-track">
                        <div
                          className="rig-col-fill"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                          title={`${rig}: ${val} unit`}
                        />
                      </div>
                      <span className="rig-col-label">{rig}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="card flex-1">
          <div className="card-header">
            <h3>Stok Menipis</h3>
            <span className="card-sub">{stokMenipis.length} item · ≤ 50 unit</span>
          </div>
          {stokMenipis.length === 0 ? (
            <div className="empty-state">
              <p>Semua stok aman 👍</p>
            </div>
          ) : (
            <div className="stok-menipis-grid">
              {stokMenipis
                .sort((a, b) => (a.stok || 0) - (b.stok || 0))
                .map((s) => {
                  const status = getStokStatus(s.stok);
                  const stok = s.stok || 0;
                  // Referensi maks 100 unit untuk bar
                  const pct = Math.min(Math.round((stok / 100) * 100), 100);
                  return (
                    <div key={s.id} className="sm-item">
                      <div className="sm-top">
                        <span className="sm-name" title={s.nama}>{s.nama}</span>
                        <span className={`badge ${status.badgeClass} sm-badge`}>{stok}</span>
                      </div>
                      <div className="sm-bar-track">
                        <div
                          className={`sm-bar-fill sm-fill-${status.badgeClass}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <div className="sm-bottom">
                        <span className="sm-ukuran">{s.ukuran}</span>
                        <span className={`sm-status ${status.badgeClass}`}>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Aktivitas Terbaru */}
      <div className="card">
        <div className="card-header">
          <h3>Pengeluaran Terbaru</h3>
        </div>
        {distributions.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada data pengeluaran</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis Sticker</th>
                <th>Ukuran</th>
                <th>Rig</th>
                <th>Jumlah</th>
                <th>PIC</th>
              </tr>
            </thead>
            <tbody>
              {[...distributions]
                .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                .slice(0, 5)
                .map((d) => {
                  const sticker = stickers.find((s) => s.id === d.sticker_id);
                  return (
                    <tr key={d.id}>
                      <td>{d.tanggal}</td>
                      <td>{sticker?.nama || '-'}</td>
                      <td>{sticker?.ukuran || '-'}</td>
                      <td>{d.rig}</td>
                      <td><span className="badge badge-out">{d.jumlah}</span></td>
                      <td>{d.pic || '-'}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
