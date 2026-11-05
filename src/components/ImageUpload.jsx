import { useState, useRef } from 'react';
import { uploadImage } from '../utils/storage';

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

const ACCEPTED_ATTR = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

function isPDF(file) {
  return file?.type === 'application/pdf';
}

export default function ImageUpload({ currentUrl, onUploaded, folder = 'sticker' }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isPreviewPDF, setIsPreviewPDF] = useState(
    currentUrl?.toLowerCase().includes('.pdf') || false
  );
  const inputRef = useRef(null);

  async function processFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran maksimal 10MB');
      return;
    }
    setError('');

    // Preview lokal untuk gambar
    if (!isPDF(file)) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview('pdf'); // placeholder
    }

    setIsPreviewPDF(isPDF(file));
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setError('Gagal upload: ' + err.message);
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e) { processFile(e.target.files[0]); }

  function handleRemove() {
    setPreview(null);
    setIsPreviewPDF(false);
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDragOver(e) { e.preventDefault(); setDragging(true); }
  function handleDragLeave(e) { e.preventDefault(); setDragging(false); }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  // Render preview
  function renderPreview() {
    if (isPreviewPDF || (typeof preview === 'string' && preview.includes('.pdf'))) {
      return (
        <div className="pdf-preview-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" color="#dc2626">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <text x="6" y="18" fontSize="5" fill="#dc2626" stroke="none" fontWeight="bold">PDF</text>
          </svg>
          <span className="pdf-filename">File PDF ter-upload</span>
          <a href={preview === 'pdf' ? '#' : preview} target="_blank" rel="noreferrer" className="pdf-link">
            {preview !== 'pdf' ? 'Buka PDF ↗' : 'Mengupload...'}
          </a>
        </div>
      );
    }
    return <img src={preview} alt="Preview" className="img-preview" />;
  }

  return (
    <div className="img-upload-wrap">
      {preview ? (
        <div className="img-preview-box">
          {renderPreview()}
          <div className="img-preview-actions">
            <button type="button" className="btn-img-change" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Mengupload...' : 'Ganti File'}
            </button>
            <button type="button" className="btn-img-remove" onClick={handleRemove} disabled={uploading}>
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`img-upload-btn ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <span className="login-spinner" style={{ width: 24, height: 24, borderColor: 'rgba(37,99,235,0.2)', borderTopColor: '#2563eb' }} />
              <span>Mengupload...</span>
            </>
          ) : dragging ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>Lepas untuk upload</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Klik atau seret file ke sini</span>
              <small>JPG, PNG, WEBP, PDF · maks 10MB</small>
            </>
          )}
        </div>
      )}

      {error && <p className="img-upload-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
}
