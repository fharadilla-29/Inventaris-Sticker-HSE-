import { useState, useEffect, useRef, useCallback } from 'react';
import { getOrders } from './storage';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Nada pertama
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.2);

    // Nada kedua (lebih tinggi)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 1100;
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime + 0.22);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Browser tidak support AudioContext
  }
}

function sendBrowserNotif(order) {
  if (Notification.permission === 'granted') {
    try {
      new Notification('📦 Pesanan Baru Masuk!', {
        body: `${order.item_nama} · ${order.jumlah} unit · ${order.rig}`,
        icon: '/basemindo-logo.png',
        badge: '/basemindo-logo.png',
        tag: order.id, // Cegah duplikasi
        requireInteraction: false,
      });
    } catch {
      // silent
    }
  }
}

export function useOrderNotif(isAdmin) {
  const [pendingCount, setPendingCount] = useState(0);
  const [alerts, setAlerts] = useState([]); // array of alert objects
  const prevIdsRef = useRef(null); // null = belum init, Set = sudah
  const isInitRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const orders = await getOrders();
      const pending = orders.filter(o => o.status === 'pending');
      setPendingCount(pending.length);

      const currentIds = new Set(pending.map(o => o.id));

      if (!isInitRef.current) {
        // Pertama kali: simpan semua ID yang sudah ada, JANGAN trigger notif
        prevIdsRef.current = currentIds;
        isInitRef.current = true;
        return;
      }

      // Cari pesanan baru yang belum ada di snapshot sebelumnya
      const newOrders = pending.filter(o => !prevIdsRef.current.has(o.id));

      if (newOrders.length > 0) {
        playBeep();

        newOrders.forEach(order => {
          sendBrowserNotif(order);

          const alertObj = {
            id: order.id,
            nama: order.item_nama,
            rig: order.rig,
            jumlah: order.jumlah,
            type: order.item_type,
            number: order.order_number,
          };

          setAlerts(prev => [alertObj, ...prev].slice(0, 3)); // max 3 notif sekaligus

          // Auto dismiss setelah 8 detik
          setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== order.id));
          }, 8000);
        });
      }

      prevIdsRef.current = currentIds;
    } catch {
      // silent fail
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    // Minta izin notifikasi browser
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Fetch pertama setelah 500ms (beri waktu component mount)
    const init = setTimeout(() => fetchOrders(), 500);
    // Polling tiap 10 detik
    const interval = setInterval(() => fetchOrders(), 10000);

    return () => {
      clearTimeout(init);
      clearInterval(interval);
    };
  }, [isAdmin, fetchOrders]);

  function dismissAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function dismissAll() {
    setAlerts([]);
  }

  // Untuk backward compat — ambil alert pertama
  const newOrderAlert = alerts[0] || null;

  return { pendingCount, newOrderAlert, alerts, dismissAlert, dismissAll };
}
