import { useState } from 'react';

// Credentials — bisa dipindah ke env variable
const VALID_USERNAME = (import.meta.env.VITE_APP_USERNAME || 'Anisya').trim();
const VALID_PASSWORD = (import.meta.env.VITE_APP_PASSWORD || '091102').trim();

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (username.trim() === VALID_USERNAME && password.trim() === VALID_PASSWORD) {
        onLogin(username);
      } else {
        setError('Username atau password salah. Silakan coba lagi.');
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="login-page">
      {/* Floating animated bubbles */}
      <div className="login-bubbles">
        <span className="bubble bubble-1" />
        <span className="bubble bubble-2" />
        <span className="bubble bubble-3" />
        <span className="bubble bubble-4" />
        <span className="bubble bubble-5" />
        <span className="bubble bubble-6" />
        <span className="bubble bubble-7" />
        <span className="bubble bubble-8" />
      </div>

      {/* Floating HSE icons */}
      <div className="login-floaters">
        <div className="floater floater-1">🛡️</div>
        <div className="floater floater-2">⚠️</div>
        <div className="floater floater-3">🏗️</div>
        <div className="floater floater-4">📋</div>
        <div className="floater floater-5">🦺</div>
      </div>

      {/* Center card */}
      <div className="login-center">
        {/* Brand header */}
        <div className="login-brand-top">
          <img src="/basemindo-logo.png" alt="Basemindo Logo" className="login-logo-top" />
          <div>
            <h1 className="login-company-name">PT. BESMINDO MATERI SEWATAMA</h1>
            <p className="login-dept-name">Departemen Health, Safety &amp; Environment</p>
          </div>
        </div>

        {/* Form card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2>Selamat Datang</h2>
            <p>Masuk ke sistem inventaris HSE</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="login-footer-text">
          &copy; {new Date().getFullYear()} PT. BESMINDO MATERI SEWATAMA
        </p>
      </div>
    </div>
  );
}
