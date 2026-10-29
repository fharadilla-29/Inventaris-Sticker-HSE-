-- =====================================================
-- HSE Sticker Inventory - Supabase Schema
-- Jalankan SQL ini di Supabase SQL Editor
-- =====================================================

-- Table: stickers (Jenis Sticker)
CREATE TABLE IF NOT EXISTS stickers (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  ukuran TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  satuan TEXT NOT NULL DEFAULT 'lembar',
  stok INTEGER NOT NULL DEFAULT 0,
  deskripsi TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: stock_in (Pemasukan Sticker)
CREATE TABLE IF NOT EXISTS stock_in (
  id TEXT PRIMARY KEY,
  sticker_id TEXT NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal DATE NOT NULL,
  supplier TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- --- ALTER distributions: tambah kolom batch_id ---
-- Jalankan ini jika tabel distributions sudah ada:
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS batch_id TEXT DEFAULT '';

-- Jika belum ada tabel, jalankan CREATE TABLE lengkap di bawah:
-- Table: distributions (Pengeluaran per Rig)
CREATE TABLE IF NOT EXISTS distributions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL DEFAULT '',
  sticker_id TEXT NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  rig TEXT NOT NULL,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal DATE NOT NULL,
  pic TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk query yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_stock_in_sticker ON stock_in(sticker_id);
CREATE INDEX IF NOT EXISTS idx_distributions_sticker ON distributions(sticker_id);
CREATE INDEX IF NOT EXISTS idx_distributions_rig ON distributions(rig);

-- =====================================================
-- Trigger: auto-update stok pada stickers
-- =====================================================

-- Function: tambah stok saat stock_in INSERT
CREATE OR REPLACE FUNCTION add_stok_on_stock_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stickers SET stok = stok + NEW.jumlah
  WHERE id = NEW.sticker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_add_stok_on_stock_in
  AFTER INSERT ON stock_in
  FOR EACH ROW EXECUTE FUNCTION add_stok_on_stock_in();

-- Function: kurangi stok saat distribution INSERT (dengan cek stok)
CREATE OR REPLACE FUNCTION sub_stok_on_distribution()
RETURNS TRIGGER AS $$
DECLARE
  current_stok INTEGER;
BEGIN
  SELECT stok INTO current_stok FROM stickers WHERE id = NEW.sticker_id;
  IF current_stok IS NULL THEN
    RAISE EXCEPTION 'Sticker tidak ditemukan';
  END IF;
  IF current_stok < NEW.jumlah THEN
    RAISE EXCEPTION 'Stok tidak mencukupi. Tersedia: %, Diminta: %', current_stok, NEW.jumlah;
  END IF;
  UPDATE stickers SET stok = stok - NEW.jumlah
  WHERE id = NEW.sticker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sub_stok_on_distribution
  AFTER INSERT ON distributions
  FOR EACH ROW EXECUTE FUNCTION sub_stok_on_distribution();

-- Function: kembalikan stok saat stock_in DELETE
CREATE OR REPLACE FUNCTION revert_stok_on_stock_in_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stickers SET stok = stok - OLD.jumlah
  WHERE id = OLD.sticker_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revert_stok_on_stock_in_delete
  AFTER DELETE ON stock_in
  FOR EACH ROW EXECUTE FUNCTION revert_stok_on_stock_in_delete();

-- Function: kembalikan stok saat distribution DELETE
CREATE OR REPLACE FUNCTION revert_stok_on_distribution_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stickers SET stok = stok + OLD.jumlah
  WHERE id = OLD.sticker_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revert_stok_on_distribution_delete
  AFTER DELETE ON distributions
  FOR EACH ROW EXECUTE FUNCTION revert_stok_on_distribution_delete();

-- =====================================================
-- RLS (Row Level Security) - disable untuk admin internal
-- Aktifkan jika perlu proteksi akses
-- =====================================================
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations dengan anon key (admin only)
CREATE POLICY "Allow all on stickers" ON stickers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_in" ON stock_in FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on distributions" ON distributions FOR ALL USING (true) WITH CHECK (true);
