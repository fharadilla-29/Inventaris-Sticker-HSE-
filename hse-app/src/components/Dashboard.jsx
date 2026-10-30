import { useState, useEffect, useMemo } from 'react';
import { getStickers, getDistributions } from '../utils/storage';
import { getSpanduk, getSpandukDistributions } from '../utils/storage';
import { getStokStatus } from '../utils/stokHelper';
import { RIG_LIST } from '../utils/constants';

export default function Dashboard() {
  const [stickers, setStickers] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [spanduk, setSpanduk] = useState([]);
  const [spandukDist, setSpandukDist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stk, dist, sp, spdist] = await Promise.all([
          getStickers(), getDistributions(),
          getSpanduk(), getSpandukDistributions(),
        ]);
        setStickers(stk); setDistributions(dist);
        setSpanduk(sp); setSpandukDist(spdist);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Sticker stats ---
  const totalStok = useMemo(() => stickers.reduce((s, x) => s + (x.stok || 0), 0), [stickers]);
  const totalKeluar = useMemo(() => distributions.reduce((s, x) => s + x.jumlah, 0), [distributions]);
  const stokKritis = useMemo(() => stickers.filter(s => (s.stok || 0) <= 20), [stickers]);

  // --- Spanduk stats ---
  const totalStokSp = useMemo(() => spanduk.reduce((s, x) => s + (x.stok || 0), 0), [spanduk]);
  const totalKeluarSp = useMemo(() => spandukDist.reduce((s, x) => s + x.jumlah, 0), [spandukDist]);
  const spKritis = useMemo(() => spanduk.filter(s => (s.stok || 0) <= 20), [spanduk]);

  // --- Chart: stok keluar per rig (sticker) ---
  const perRigSticker = useMemo(() => {
    const active = RIG_LIST.filter(rig => distributions.some(d => d.rig === rig));
    return active.map(rig => ({
      rig, val: distributions.filter(d => d.rig === rig).reduce((s, d) => s + d.jumlah, 0)
    }));
  }, [distributions]);

  // --- Chart: stok keluar per rig (spanduk) ---
  const perRigSpanduk = useMemo(() => {
    const active = RIG_LIST.filter(rig => spandukDist.some(d => d.rig === rig));
    return active.map(rig => ({
      rig, val: spandukDist.filter(d => d.rig === rig).reduce((s, d) => s + d.jumlah, 0)
    }));
  }, [spandukDist]);

  const maxSticker = Math.max(...perRigSticker.map(r => r.val), 1);
  const maxSpanduk = Math.max(...perRigSpanduk.map(r => r.val), 1);

  if (loading) return <div className="page"><div className="loading-state">Memuat data...</div></div>;

  return (
    <div className="page dash-page">
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1>Dashboard</h1>
        <p>Ringkasan inventaris sticker &amp; spanduk HSE</p>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="dash-stat-row">
        {/* Sticker */}
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"/><path d="M15 22l7-7-4-4-7 7v4z"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{stickers.length}</span>
            <span className="stat-label">Jenis Sticker</span>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalStok}</span>
            <span className="stat-label">Stok Sticker</span>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalKeluar}</span>
            <span className="stat-label">Keluar Sticker</span>
          </div>
        </div>
        {/* Spanduk */}
        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6V4M18 6V4"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{spanduk.length}</span>
            <span className="stat-label">Jenis Spanduk</span>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalStokSp}</span>
            <span className="stat-label">Stok Spanduk</span>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          </div>
          <div className="stat-body">
            <span className="stat-value">{totalKeluarSp}</span>
            <span className="stat-label">Keluar Spanduk</span>
          </div>
        </div>
      </div>

      {/* ===== ROW 2: Grafik ===== */}
      <div className="dash-row" style={{ marginBottom: '16px' }}>
        {/* Chart Sticker */}
        <div className="card flex-1">
          <div className="card-header">
            <h3>Stok Keluar Sticker per Rig</h3>
            <span className="card-sub">Total: {totalKeluar} unit</span>
          </div>
          <div className="rig-chart-wrap">
            {perRigSticker.length === 0 ? (
              <div className="empty-state"><p>Belum ada data</p></div>
            ) : (
              <div className="rig-chart">
                {perRigSticker.map(({ rig, val }) => (
                  <div key={rig} className="rig-col">
                    <span className="rig-col-val">{val}</span>
                    <div className="rig-col-track">
                      <div className="rig-col-fill" style={{ height: `${Math.max((val / maxSticker) * 100, 4)}%` }} title={`${rig}: ${val}`} />
                    </div>
                    <span className="rig-col-label">{rig}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart Spanduk */}
        <div className="card flex-1">
          <div className="card-header">
            <h3>Stok Keluar Spanduk per Rig</h3>
            <span className="card-sub">Total: {totalKeluarSp} unit</span>
          </div>
          <div className="rig-chart-wrap">
            {perRigSpanduk.length === 0 ? (
              <div className="empty-state"><p>Belum ada data</p></div>
            ) : (
              <div className="rig-chart">
                {perRigSpanduk.map(({ rig, val }) => (
                  <div key={rig} className="rig-col">
                    <span className="rig-col-val">{val}</span>
                    <div className="rig-col-track">
                      <div className="rig-col-fill spanduk-fill" style={{ height: `${Math.max((val / maxSpanduk) * 100, 4)}%` }} title={`${rig}: ${val}`} />
                    </div>
                    <span className="rig-col-label">{rig}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ROW 3: Stok Kritis ===== */}
      <div className="dash-row">
        {/* Stiker Kritis */}
        <div className="card flex-1">
          <div className="card-header">
            <h3>Sticker Kritis</h3>
            <span className="card-sub">{stokKritis.length} item · ≤ 20 unit</span>
          </div>
          {stokKritis.length === 0 ? (
            <div className="empty-state"><p>Semua stok aman 👍</p></div>
          ) : (
            <div className="stok-menipis-grid">
              {stokKritis.sort((a, b) => (a.stok || 0) - (b.stok || 0)).map(s => {
                const status = getStokStatus(s.stok);
                const pct = Math.min(Math.round(((s.stok || 0) / 100) * 100), 100);
                return (
                  <div key={s.id} className="sm-item">
                    <div className="sm-top">
                      <span className="sm-name" title={s.nama}>{s.nama}</span>
                      <span className={`badge ${status.badgeClass} sm-badge`}>{s.stok || 0}</span>
                    </div>
                    <div className="sm-bar-track">
                      <div className={`sm-bar-fill sm-fill-${status.badgeClass}`} style={{ width: `${Math.max(pct, 2)}%` }} />
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

        {/* Spanduk Kritis */}
        <div className="card flex-1">
          <div className="card-header">
            <h3>Spanduk Kritis</h3>
            <span className="card-sub">{spKritis.length} item · ≤ 20 unit</span>
          </div>
          {spKritis.length === 0 ? (
            <div className="empty-state"><p>Semua stok aman 👍</p></div>
          ) : (
            <div className="stok-menipis-grid">
              {spKritis.sort((a, b) => (a.stok || 0) - (b.stok || 0)).map(s => {
                const status = getStokStatus(s.stok);
                const pct = Math.min(Math.round(((s.stok || 0) / 100) * 100), 100);
                return (
                  <div key={s.id} className="sm-item">
                    <div className="sm-top">
                      <span className="sm-name" title={s.nama}>{s.nama}</span>
                      <span className={`badge ${status.badgeClass} sm-badge`}>{s.stok || 0}</span>
                    </div>
                    <div className="sm-bar-track">
                      <div className={`sm-bar-fill sm-fill-${status.badgeClass}`} style={{ width: `${Math.max(pct, 2)}%` }} />
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
    </div>
  );
}
