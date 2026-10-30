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

// =====================================================
// SPANDUK
// =====================================================

export async function getSpanduk() {
  const { data, error } = await supabase
    .from('spanduk')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addSpanduk(item) {
  const newItem = {
    ...item,
    id: `SPD-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('spanduk')
    .insert(newItem)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpanduk(id, updates) {
  const { data, error } = await supabase
    .from('spanduk')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpanduk(id) {
  await supabase.from('spanduk_stock_in').delete().eq('spanduk_id', id);
  await supabase.from('spanduk_distributions').delete().eq('spanduk_id', id);
  const { error } = await supabase.from('spanduk').delete().eq('id', id);
  if (error) throw error;
}

// --- Spanduk Stock In ---

export async function getSpandukStockIn() {
  const { data, error } = await supabase
    .from('spanduk_stock_in')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSpandukStockIn(record) {
  const newRecord = {
    id: `SPIN-${Date.now()}`,
    spanduk_id: record.spandukId,
    jumlah: record.jumlah,
    tanggal: record.tanggal,
    catatan: record.catatan || '',
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('spanduk_stock_in')
    .insert(newRecord)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpandukStockIn(id) {
  const { error } = await supabase.from('spanduk_stock_in').delete().eq('id', id);
  if (error) throw error;
}

// --- Spanduk Distributions (Stok Keluar) ---

export async function getSpandukDistributions() {
  const { data, error } = await supabase
    .from('spanduk_distributions')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSpandukDistributionBatch(record) {
  const batchId = `SPBATCH-${Date.now()}`;
  const rows = record.items.map((item, i) => ({
    id: `SPOUT-${Date.now()}-${i}`,
    batch_id: batchId,
    spanduk_id: item.spandukId,
    rig: record.rig,
    jumlah: item.jumlah,
    tanggal: record.tanggal,
    pic: record.pic || '',
    catatan: record.catatan || '',
    created_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from('spanduk_distributions')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteSpandukDistributionBatch(batchId) {
  const { error } = await supabase
    .from('spanduk_distributions')
    .delete()
    .eq('batch_id', batchId);
  if (error) throw error;
}

export async function deleteSpandukDistribution(id) {
  const { error } = await supabase.from('spanduk_distributions').delete().eq('id', id);
  if (error) throw error;
}
