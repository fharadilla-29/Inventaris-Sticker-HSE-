import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ===================== TEMA WARNA =====================
const C = {
  navyDark:  '1E3A5F',
  navyLight: '2563EB',
  white:     'FFFFFFFF',
  rowAlt:    'FFDBEAFE',
  rowWhite:  'FFFFFFFF',
  danger:    'FFDC2626',
  warning:   'FF92400E',
  success:   'FF16A34A',
  border:    'FFCBD5E1',
  textDark:  'FF1F2937',
  textMuted: 'FF6B7280',
  titleBg:   'FF0F172A',
  titleText: 'FFFFFFFF',
  titleSub:  'FFA5B4FC',
  headerBg:  'FF1E3A5F',
  totalBg:   'FF2563EB',
};

function argb(hex) {
  return hex.startsWith('FF') ? hex : 'FF' + hex;
}

function border() {
  const s = { style: 'thin', color: { argb: C.border } };
  return { top: s, bottom: s, left: s, right: s };
}

function applyHeader(row, colCount) {
  row.height = 24;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > colCount) return;
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(C.navyDark) } };
    cell.font   = { name: 'Calibri', bold: true, size: 11, color: { argb: C.white } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = border();
  });
}

function applyDataRow(row, colCount, isAlt) {
  row.height = 18;
  const bg = isAlt ? C.rowAlt : C.rowWhite;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > colCount) return;
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font   = { name: 'Calibri', size: 10, color: { argb: C.textDark } };
    cell.alignment = { vertical: 'middle', wrapText: false };
    cell.border = border();
  });
}

function applyTotalRow(row, colCount) {
  row.height = 20;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > colCount) return;
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(C.navyLight) } };
    cell.font   = { name: 'Calibri', bold: true, size: 11, color: { argb: C.white } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = border();
  });
}

function addTitleBlock(ws, title, subtitle, period, colCount) {
  // Baris 1 — Logo text + nama perusahaan
  const r1 = ws.addRow(['PT. BESMINDO MATERI SEWATAMA — DEPARTEMEN HSE']);
  r1.height = 30;
  const c1 = r1.getCell(1);
  c1.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(C.titleBg) } };
  c1.font   = { name: 'Calibri', bold: true, size: 16, color: { argb: C.titleText } };
  c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(r1.number, 1, r1.number, colCount);

  // Baris 2 — Judul laporan
  const r2 = ws.addRow([title]);
  r2.height = 22;
  const c2 = r2.getCell(1);
  c2.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(C.titleBg) } };
  c2.font   = { name: 'Calibri', bold: true, size: 12, color: { argb: C.titleSub } };
  c2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(r2.number, 1, r2.number, colCount);

  // Baris 3 — Periode & tanggal cetak
  const label = period === 'all' ? 'Semua Waktu' : `${period} Hari Terakhir`;
  const r3 = ws.addRow([`Periode: ${label}     |     Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`]);
  r3.height = 16;
  const c3 = r3.getCell(1);
  c3.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(C.titleBg) } };
  c3.font   = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
  c3.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(r3.number, 1, r3.number, colCount);

  // Baris 4 — kosong
  const r4 = ws.addRow([]);
  r4.height = 6;
}

// ===================== EXPORT STICKER =====================
export async function exportLaporanSticker({ perSticker, filteredDistributions, stickers, period }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HSE Departemen - PT. Basemindo';
  wb.created = new Date();

  // ---- Sheet 1: Rekap per Sticker ----
  const ws1 = wb.addWorksheet('Rekap Sticker', { views: [{ state: 'frozen', ySplit: 5 }] });
  ws1.columns = [
    { key: 'no',     width: 6 },
    { key: 'nama',   width: 42 },
    { key: 'ukuran', width: 14 },
    { key: 'masuk',  width: 14 },
    { key: 'keluar', width: 14 },
    { key: 'stok',   width: 14 },
    { key: 'status', width: 16 },
  ];

  addTitleBlock(ws1, 'REKAP INVENTARIS STICKER HSE', '', period, 7);

  const hRow1 = ws1.addRow(['No', 'Nama Sticker', 'Ukuran', 'Total Masuk', 'Total Keluar', 'Stok Saat Ini', 'Status']);
  applyHeader(hRow1, 7);

  const sorted1 = [...perSticker].sort((a, b) => a.nama.localeCompare(b.nama));
  sorted1.forEach((s, i) => {
    const status = s.stokSaatIni <= 20 ? 'Stok Kritis' : s.stokSaatIni <= 50 ? 'Hampir Habis' : 'Aman';
    const statusColor = s.stokSaatIni <= 20 ? C.danger : s.stokSaatIni <= 50 ? C.warning : C.success;
    const row = ws1.addRow([i + 1, s.nama, s.ukuran, s.totalMasuk, s.totalKeluar, s.stokSaatIni, status]);
    applyDataRow(row, 7, i % 2 === 1);
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.textDark } };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).font = { name: 'Calibri', bold: true, size: 10, color: { argb: statusColor } };
  });

  // Total row
  const totRow1 = ws1.addRow(['', 'TOTAL', '', sorted1.reduce((s, x) => s + x.totalMasuk, 0), sorted1.reduce((s, x) => s + x.totalKeluar, 0), sorted1.reduce((s, x) => s + x.stokSaatIni, 0), '']);
  applyTotalRow(totRow1, 7);
  totRow1.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

  // ---- Sheet 2: Detail Pengeluaran ----
  const ws2 = wb.addWorksheet('Detail Pengeluaran', { views: [{ state: 'frozen', ySplit: 5 }] });
  ws2.columns = [
    { key: 'no',      width: 6 },
    { key: 'tgl',     width: 14 },
    { key: 'rig',     width: 10 },
    { key: 'nama',    width: 42 },
    { key: 'ukuran',  width: 14 },
    { key: 'jumlah',  width: 10 },
    { key: 'pic',     width: 18 },
    { key: 'catatan', width: 22 },
  ];

  addTitleBlock(ws2, 'DETAIL PENGELUARAN STICKER PER RIG', '', period, 8);

  const hRow2 = ws2.addRow(['No', 'Tanggal', 'Rig', 'Nama Sticker', 'Ukuran', 'Jumlah', 'PIC', 'Catatan']);
  applyHeader(hRow2, 8);

  const sortedDist = [...filteredDistributions].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  sortedDist.forEach((d, i) => {
    const sticker = stickers.find(s => s.id === d.sticker_id);
    const row = ws2.addRow([i + 1, d.tanggal, d.rig, sticker?.nama || '-', sticker?.ukuran || '-', d.jumlah, d.pic || '-', d.catatan || '-']);
    applyDataRow(row, 8, i % 2 === 1);
    [1, 2, 3, 5, 6, 7].forEach(c => { row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }; });
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(3).font = { name: 'Calibri', bold: true, size: 10, color: { argb: argb(C.navyLight) } };
  });

  const totRow2 = ws2.addRow(['', '', '', 'TOTAL', '', sortedDist.reduce((s, d) => s + d.jumlah, 0), '', '']);
  applyTotalRow(totRow2, 8);
  totRow2.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  totRow2.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

  // Download
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Laporan-Sticker-HSE-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ===================== EXPORT SPANDUK =====================
export async function exportLaporanSpanduk({ perSpanduk, filteredDist, spanduk, period }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HSE Departemen - PT. Basemindo';
  wb.created = new Date();

  // Sheet 1: Rekap
  const ws1 = wb.addWorksheet('Rekap Spanduk', { views: [{ state: 'frozen', ySplit: 5 }] });
  ws1.columns = [
    { key: 'no', width: 6 }, { key: 'nama', width: 42 }, { key: 'ukuran', width: 14 },
    { key: 'masuk', width: 14 }, { key: 'keluar', width: 14 }, { key: 'stok', width: 14 }, { key: 'status', width: 16 },
  ];

  addTitleBlock(ws1, 'REKAP INVENTARIS SPANDUK HSE', '', period, 7);
  const hRow1 = ws1.addRow(['No', 'Nama Spanduk', 'Ukuran', 'Total Masuk', 'Total Keluar', 'Stok Saat Ini', 'Status']);
  applyHeader(hRow1, 7);

  const sorted1 = [...perSpanduk].sort((a, b) => a.nama.localeCompare(b.nama));
  sorted1.forEach((s, i) => {
    const status = s.stokSaatIni <= 20 ? 'Stok Kritis' : s.stokSaatIni <= 50 ? 'Hampir Habis' : 'Aman';
    const statusColor = s.stokSaatIni <= 20 ? C.danger : s.stokSaatIni <= 50 ? C.warning : C.success;
    const row = ws1.addRow([i + 1, s.nama, s.ukuran, s.totalMasuk, s.totalKeluar, s.stokSaatIni, status]);
    applyDataRow(row, 7, i % 2 === 1);
    [1, 3, 4, 5, 6, 7].forEach(c => { row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }; });
    row.getCell(6).font = { name: 'Calibri', bold: true, size: 10 };
    row.getCell(7).font = { name: 'Calibri', bold: true, size: 10, color: { argb: statusColor } };
  });

  const totRow1 = ws1.addRow(['', 'TOTAL', '', sorted1.reduce((s, x) => s + x.totalMasuk, 0), sorted1.reduce((s, x) => s + x.totalKeluar, 0), sorted1.reduce((s, x) => s + x.stokSaatIni, 0), '']);
  applyTotalRow(totRow1, 7);
  totRow1.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

  // Sheet 2: Detail
  const ws2 = wb.addWorksheet('Detail Pengeluaran', { views: [{ state: 'frozen', ySplit: 5 }] });
  ws2.columns = [
    { key: 'no', width: 6 }, { key: 'tgl', width: 14 }, { key: 'rig', width: 10 },
    { key: 'nama', width: 42 }, { key: 'ukuran', width: 14 }, { key: 'jumlah', width: 10 },
    { key: 'pic', width: 18 }, { key: 'catatan', width: 22 },
  ];

  addTitleBlock(ws2, 'DETAIL PENGELUARAN SPANDUK PER RIG', '', period, 8);
  const hRow2 = ws2.addRow(['No', 'Tanggal', 'Rig', 'Nama Spanduk', 'Ukuran', 'Jumlah', 'PIC', 'Catatan']);
  applyHeader(hRow2, 8);

  const sortedDist = [...filteredDist].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  sortedDist.forEach((d, i) => {
    const sp = spanduk.find(s => s.id === d.spanduk_id);
    const row = ws2.addRow([i + 1, d.tanggal, d.rig, sp?.nama || '-', sp?.ukuran || '-', d.jumlah, d.pic || '-', d.catatan || '-']);
    applyDataRow(row, 8, i % 2 === 1);
    [1, 2, 3, 5, 6, 7].forEach(c => { row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }; });
    row.getCell(3).font = { name: 'Calibri', bold: true, size: 10, color: { argb: argb(C.navyLight) } };
  });

  const totRow2 = ws2.addRow(['', '', '', 'TOTAL', '', sortedDist.reduce((s, d) => s + d.jumlah, 0), '', '']);
  applyTotalRow(totRow2, 8);
  totRow2.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  totRow2.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Laporan-Spanduk-HSE-${new Date().toISOString().split('T')[0]}.xlsx`);
}
