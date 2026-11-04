import { useState, useRef, useEffect } from 'react';

/**
 * Searchable dropdown — search input selalu tampil, list muncul saat focus/klik
 * Props:
 *   options: [{ value, label, sub }]
 *   value: string
 *   onChange: (value) => void
 *   placeholder: string
 */
export default function SearchableSelect({ options, value, onChange, placeholder = '-- Pilih --' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery('');
  }

  function handleInputClick() {
    setOpen(true);
  }

  return (
    <div className="ss-wrap" ref={ref}>
      {/* Search Input always visible */}
      <div className={`ss-input-wrap ${open ? 'focused' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="ss-input-icon">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="ss-inline-input"
          placeholder={selected ? selected.label : placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onClick={handleInputClick}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {selected && !query && (
          <span className="ss-check">✓</span>
        )}
      </div>

      {/* Dropdown list */}
      {open && (
        <div className="ss-dropdown">
          <div className="ss-list">
            {filtered.length === 0 ? (
              <div className="ss-empty">Tidak ditemukan</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`ss-option ${o.value === value ? 'active' : ''}`}
                  onMouseDown={e => { e.preventDefault(); handleSelect(o.value); }}
                >
                  <span className="ss-opt-label">{o.label}</span>
                  {o.sub && <span className="ss-opt-sub">{o.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
