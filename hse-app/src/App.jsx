import { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StokSticker from './components/StokSticker';
import Distribution from './components/Distribution';
import Reports from './components/Reports';
import './App.css';

function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem('hse_user') || null);
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard />;
      case 'stok-sticker': return <StokSticker />;
      case 'distribution': return <Distribution />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
