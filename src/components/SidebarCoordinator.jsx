const MENU = [
  {
    id: 'catalog',
    label: 'Katalog & Pesan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    id: 'my-orders',
    label: 'Pesanan Saya',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default function SidebarCoordinator({ activeMenu, setActiveMenu, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo" style={{ background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, overflow: 'hidden', padding: 4 }}>
          <img src="/basemindo-logo.png" alt="Basemindo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>
        <div>
          <h2>HSE Departemen</h2>
          <p>HSE Coordinator</p>
        </div>      </div>

      <nav className="sidebar-nav">
        {MENU.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user?.charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user}</span>
            <span className="sidebar-user-role">HSE Coordinator</span>
          </div>
          <button className="sidebar-logout" onClick={onLogout} title="Keluar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
