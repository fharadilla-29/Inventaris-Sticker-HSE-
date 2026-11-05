import { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import SidebarCoordinator from './components/SidebarCoordinator';
import Dashboard from './components/Dashboard';
import StokSticker from './components/StokSticker';
import Distribution from './components/Distribution';
import Reports from './components/Reports';
import StokSpanduk from './components/StokSpanduk';
import DistributionSpanduk from './components/DistributionSpanduk';
import ReportsSpanduk from './components/ReportsSpanduk';
import CoordinatorView from './components/CoordinatorView';
import MyOrders from './components/MyOrders';
import OrderNotifBanner from './components/OrderNotifBanner';
import { useOrderNotif } from './utils/useOrderNotif';
import './App.css';

function AppAdmin({ user, role, activeMenu, setActiveMenu, handleLogout }) {
  const { pendingCount, alerts, dismissAlert } = useOrderNotif(role === 'admin');

  function renderPage() {
    switch (activeMenu) {
      case 'dashboard':            return <Dashboard onNavigate={setActiveMenu} />;
      case 'stok-sticker':         return <StokSticker />;
      case 'distribution':         return <Distribution />;
      case 'reports':              return <Reports />;
      case 'stok-spanduk':         return <StokSpanduk />;
      case 'distribution-spanduk': return <DistributionSpanduk />;
      case 'reports-spanduk':      return <ReportsSpanduk />;
      default:                     return <Dashboard onNavigate={setActiveMenu} />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />
      <main className="main-content">
        <OrderNotifBanner
          alerts={alerts}
          onDismiss={dismissAlert}
          onNavigate={setActiveMenu}
        />
        {renderPage()}
      </main>
    </div>
  );
}

function AppCoordinator({ user, activeMenu, setActiveMenu, handleLogout }) {
  function renderPage() {
    switch (activeMenu) {
      case 'catalog':   return <CoordinatorView user={user} />;
      case 'my-orders': return <MyOrders user={user} />;
      default:          return <CoordinatorView user={user} />;
    }
  }
  return (
    <div className="app-layout">
      <SidebarCoordinator
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  function handleLogin(username, userRole) {
    sessionStorage.setItem('hse_user', username);
    sessionStorage.setItem('hse_role', userRole);
    setUser(username);
    setRole(userRole);
    setActiveMenu(userRole === 'coordinator' ? 'catalog' : 'dashboard');
  }

  function handleLogout() {
    sessionStorage.removeItem('hse_user');
    sessionStorage.removeItem('hse_role');
    setUser(null);
    setRole(null);
    setActiveMenu('dashboard');
  }

  if (!user) return <Login onLogin={handleLogin} />;

  if (role === 'coordinator') {
    return (
      <AppCoordinator
        user={user}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <AppAdmin
      user={user}
      role={role}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      handleLogout={handleLogout}
    />
  );
}
