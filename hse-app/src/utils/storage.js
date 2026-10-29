// Data layer untuk Supabase - semua fungsi async
import { supabase } from './supabase';

// --- Sticker Types (Jenis Sticker) ---

export async function getStickers() {
  const { data, error } = await supabase
    .from('stickers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addSticker(sticker) {
  const newSticker = {
    ...sticker,
    id: `STK-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('stickers')
    .insert(newSticker)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSticker(id, updates) {
  const { data, error } = await supabase
    .from('stickers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSticker(id) {
  // Hapus child records dulu, lalu sticker
  await supabase.from('stock_in').delete().eq('sticker_id', id);
  await supabase.from('distributions').delete().eq('sticker_id', id);
  const { error } = await supabase.from('stickers').delete().eq('id', id);
  if (error) throw error;
}

// --- Stock In (Pemasukan) ---
// Stok auto-update via database trigger

export async function getStockIn() {
  const { data, error } = await supabase
    .from('stock_in')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addStockIn(record) {
  const newRecord = {
    sticker_id: record.stickerId,
    jumlah: record.jumlah,
    tanggal: record.tanggal,
    supplier: record.supplier || '',
    catatan: record.catatan || '',
    id: `IN-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('stock_in')
    .insert(newRecord)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStockIn(id) {
  const { error } = await supabase.from('stock_in').delete().eq('id', id);
  if (error) throw error;
}

// --- Distributions (Stok Keluar per Rig) ---
// Stok auto-update via database trigger (dengan cek stok)

export async function getDistributions() {
  const { data, error } = await supabase
    .from('distributions')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

// record = { rig, tanggal, pic, catatan, items: [{ stickerId, jumlah }, ...] }
export async function addDistributionBatch(record) {
  const batchId = `BATCH-${Date.now()}`;
  const rows = record.items.map((item, i) => ({
    id: `OUT-${Date.now()}-${i}`,
    batch_id: batchId,
    sticker_id: item.stickerId,
    rig: record.rig,
    jumlah: item.jumlah,
    tanggal: record.tanggal,
    pic: record.pic || '',
    catatan: record.catatan || '',
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('distributions')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

// Hapus semua row dalam satu batch
export async function deleteDistributionBatch(batchId) {
  const { error } = await supabase
    .from('distributions')
    .delete()
    .eq('batch_id', batchId);
  if (error) throw error;
}

// Hapus satu row saja (untuk undo per item)
export async function deleteDistribution(id) {
  const { error } = await supabase.from('distributions').delete().eq('id', id);
  if (error) throw error;
}
