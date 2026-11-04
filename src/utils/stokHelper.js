// Helper untuk menentukan status dan badge class berdasarkan jumlah stok

export function getStokStatus(stok) {
  const n = stok || 0;
  if (n <= 20) return { label: 'Stok Kritis', badgeClass: 'badge-low' };
  if (n <= 50) return { label: 'Hampir Habis', badgeClass: 'badge-warning' };
  return { label: 'Aman', badgeClass: 'badge-ok' };
}
