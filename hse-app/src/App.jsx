import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StokSticker from './components/StokSticker';
import Distribution from './components/Distribution';
import Reports from './components/Reports';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  function renderPage() {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'stok-sticker':
        return <StokSticker />;
      case 'distribution':
        return <Distribution />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
