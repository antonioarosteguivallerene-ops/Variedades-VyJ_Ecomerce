/* ==========================================================
   STORE — "base de datos" en localStorage
   Todas las pantallas leen y escriben aquí, por eso una venta
   descuenta stock, aparece en el historial y suma en reportes.
   Si localStorage no está disponible, funciona solo en memoria.
   ========================================================== */
(function () {
  const VJ = window.VJ = window.VJ || {};
  const cfg = VJ.config, KEY = cfg.storageKey;
  let db = null;
  const subs = [];

  function read() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento: queda en memoria */ } }
  function emit() { persist(); subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  const num = s => { let m = 0; s.forEach(x => { const n = parseInt(String(x.id).replace(/\D/g, ''), 10); if (n > m) m = n; }); return m; };

  const S = VJ.store = {
    init() {
      db = read();
      if (!db || !Array.isArray(db.products) || !Array.isArray(db.sales) || !Array.isArray(db.orders)) { db = VJ.seed(new Date()); persist(); }
    },
    reset() { db = VJ.seed(new Date()); emit(); },
    on(fn) { subs.push(fn); },

    products: () => db.products,
    sales: () => db.sales,
    orders: () => db.orders,
    product: id => db.products.find(p => p.id === id),
    byCode: c => db.products.find(p => p.code.toLowerCase() === String(c).trim().toLowerCase()),
    status: p => p.stock <= 0 ? 'agotado' : p.stock <= p.min ? 'bajo' : 'disponible',

    /* ----- productos ----- */
    addProduct(d) {
      if (S.byCode(d.code)) return { error: 'Ya existe un producto con ese código.' };
      const p = Object.assign({}, d, { id: d.code, createdAt: new Date().toISOString() });
      db.products.push(p); emit(); return { ok: p };
    },
    updateProduct(id, d) {
      const p = S.product(id);
      if (!p) return { error: 'No se encontró el producto.' };
      if (d.code && d.code.toLowerCase() !== p.code.toLowerCase() && S.byCode(d.code)) return { error: 'Ya existe un producto con ese código.' };
      Object.assign(p, d); emit(); return { ok: p };
    },
    removeProduct(id) { db.products = db.products.filter(p => p.id !== id); emit(); },
    /* mode: 'in' (entrada), 'out' (salida) o 'set' (ajustar a) */
    adjustStock(id, o) {
      const p = S.product(id);
      if (!p) return { error: 'No se encontró el producto.' };
      let next = p.stock;
      if (o.mode === 'in') next = p.stock + o.qty;
      else if (o.mode === 'out') next = p.stock - o.qty;
      else next = o.qty;
      if (next < 0) return { error: 'La salida es mayor que el stock disponible (' + p.stock + ').' };
      p.stock = next;
      if (o.min != null && !isNaN(o.min)) p.min = o.min;
      emit(); return { ok: p };
    },

    /* ----- ventas ----- */
    createSale(o) {
      const items = []; let subtotal = 0;
      if (!o.lines.length) return { error: 'Agrega al menos un producto.' };
      for (const l of o.lines) {
        const p = S.byCode(l.code);
        if (!p) return { error: 'El producto ' + l.code + ' ya no existe.' };
        if (l.qty > p.stock) return { error: 'Stock insuficiente de ' + p.name + ' (disponible: ' + p.stock + ').' };
        items.push({ code: p.code, name: p.name, cat: p.category, price: p.price, qty: l.qty });
        subtotal += p.price * l.qty;
      }
      const discount = Math.round(subtotal * (o.discountPct || 0) / 100);
      const total = subtotal - discount;
      items.forEach(i => { S.byCode(i.code).stock -= i.qty; });
      const received = o.method === 'efectivo' ? (o.received > 0 ? o.received : total) : 0;
      const sale = {
        id: 'VJ-' + (num(db.sales) + 1), at: new Date().toISOString(), empName: o.user.name,
        method: o.method, bank: o.method === 'transferencia' ? o.bank : '', ref: o.method === 'transferencia' ? (o.ref || '') : '',
        lines: items, subtotal, discount, total, received, change: o.method === 'efectivo' ? received - total : 0, note: o.note || ''
      };
      db.sales.push(sale); emit(); return { ok: sale };
    },

    /* ----- pedidos ----- */
    createOrder(o) {
      const lines = [];
      for (const l of o.lines) {
        const p = S.byCode(l.code);
        if (!p) return { error: 'Producto no encontrado.' };
        lines.push({ code: p.code, name: p.name, price: p.price, qty: l.qty, size: l.size, color: p.color });
      }
      const ord = {
        id: 'PED-' + String(num(db.orders) + 1).padStart(4, '0'), name: o.name, phone: o.phone, origin: o.origin,
        address: o.origin === 'online' ? o.address : '', priority: !!o.priority, status: 'pendiente',
        at: new Date().toISOString(), lines, stockDeducted: false
      };
      db.orders.push(ord); emit(); return { ok: ord };
    },
    /* avanza al siguiente estado; al confirmar descuenta stock */
    advanceOrder(id) {
      const o = db.orders.find(x => x.id === id);
      if (!o) return { error: 'Pedido no encontrado.' };
      const flow = cfg.orderFlow.map(s => s.id), i = flow.indexOf(o.status);
      if (i >= flow.length - 1) return { error: 'El pedido ya fue entregado.' };
      if (o.status === 'pendiente' && !o.stockDeducted) {
        for (const l of o.lines) {
          const p = S.byCode(l.code);
          if (!p) return { error: 'El producto ' + l.name + ' ya no existe.' };
          if (p.stock < l.qty) return { error: 'Stock insuficiente de ' + p.name + ' (disponible: ' + p.stock + ').' };
        }
        o.lines.forEach(l => { S.byCode(l.code).stock -= l.qty; });
        o.stockDeducted = true;
      }
      o.status = flow[i + 1]; emit(); return { ok: o };
    },
    orderTotal: o => o.lines.reduce((a, l) => a + l.price * l.qty, 0),
    orderUnits: o => o.lines.reduce((a, l) => a + l.qty, 0)
  };
})();
