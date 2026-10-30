import { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StokSticker from './components/StokSticker';
import Distribution from './components/Distribution';
import Reports from './components/Reports';
import StokSpanduk from './components/StokSpanduk';
import DistributionSpanduk from './components/DistributionSpanduk';
import ReportsSpanduk from './components/ReportsSpanduk';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  function handleLogin(username) {
    sessionStorage.setItem('hse_user', username);
    setUser(username);
  }

  function handleLogout() {
    sessionStorage.removeItem('hse_user');
    setUser(null);
    setActiveMenu('dashboard');
  }

  if (!user) return <Login onLogin={handleLogin} />;

  function renderPage() {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard />;
      case 'stok-sticker': return <StokSticker />;
      case 'distribution': return <Distribution />;
      case 'reports': return <Reports />;
      case 'stok-spanduk': return <StokSpanduk />;
      case 'distribution-spanduk': return <DistributionSpanduk />;
      case 'reports-spanduk': return <ReportsSpanduk />;
      default: return <Dashboard />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} user={user} onLogout={handleLogout} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
