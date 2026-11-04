import { useState, useRef } from 'react';
import { uploadImage } from '../utils/storage';

/**
 * Props:
 *   currentUrl: string — URL gambar saat ini (dari database)
 *   onUploaded: (url) => void — callback setelah upload sukses
 *   folder: 'sticker' | 'spanduk'
 */
export default function ImageUpload({ currentUrl, onUploaded, folder = 'sticker' }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe & ukuran
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Ukuran maksimal 3MB');
      return;
    }

    setError('');
    // Preview lokal dulu
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

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

  function handleRemove() {
    setPreview(null);
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="img-upload-wrap">
      {preview ? (
        <div className="img-preview-box">
          <img src={preview} alt="Preview" className="img-preview" />
          <div className="img-preview-actions">
            <button
              type="button"
              className="btn-img-change"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Mengupload...' : 'Ganti Gambar'}
            </button>
            <button
              type="button"
              className="btn-img-remove"
              onClick={handleRemove}
              disabled={uploading}
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`img-upload-btn ${uploading ? 'uploading' : ''}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="login-spinner" style={{ width: 20, height: 20, borderColor: 'rgba(37,99,235,0.3)', borderTopColor: '#2563eb' }} />
              <span>Mengupload...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Klik untuk upload gambar</span>
              <small>JPG, PNG, WEBP · maks 3MB</small>
            </>
          )}
        </button>
      )}
      {error && <p className="img-upload-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
