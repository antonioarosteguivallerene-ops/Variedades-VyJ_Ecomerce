/* Utilidades: formato de dinero, fechas y helpers pequeños */
(function () {
  const VJ = window.VJ = window.VJ || {};
  VJ.pages = {};
  const U = VJ.u = {};

  const MON = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  const MON_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  U.DOW_SHORT = DOW_SHORT;

  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- dinero ---------- */
  U.num = function (n) {
    const c = VJ.config.currency;
    const f = Math.pow(10, c.decimals);
    const v = Math.round(Math.abs(n) * f) / f;
    let [i, d] = v.toFixed(c.decimals).split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousands);
    return (n < 0 ? '-' : '') + i + (d ? c.decimal + d : '');
  };
  U.money = n => VJ.config.currency.symbol + ' ' + U.num(n);
  U.moneyShort = function (n) {
    const c = VJ.config.currency, s = c.symbol;
    if (n >= 1e6) return s + (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace('.', c.decimal) + 'M';
    if (n >= 1e3) return s + Math.round(n / 1e3) + 'K';
    return s + Math.round(n);
  };

  /* ---------- fechas ---------- */
  const p2 = n => String(n).padStart(2, '0');
  U.startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  U.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  U.sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  U.isoDate = d => { d = new Date(d); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  U.parseIso = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  U.fmtDate = d => { d = new Date(d); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  U.fmtDay = d => { d = new Date(d); return d.getDate() + ' ' + MON[d.getMonth()]; };
  U.fmtTime = d => { d = new Date(d); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' h'; };
  U.fmtDateTime = d => U.fmtDate(d) + ' · ' + p2(new Date(d).getHours()) + ':' + p2(new Date(d).getMinutes());
  U.fmtLong = d => { d = new Date(d); return d.getDate() + ' de ' + MON_LONG[d.getMonth()] + ' de ' + d.getFullYear(); };
  U.fmtWeekday = d => { d = new Date(d); const w = DOW[d.getDay()]; return w[0].toUpperCase() + w.slice(1) + ', ' + d.getDate() + ' de ' + MON_LONG[d.getMonth()] + ' de ' + d.getFullYear(); };
  U.fmtClock = d => { d = new Date(d); const h = d.getHours(); return p2(h % 12 || 12) + ':' + p2(d.getMinutes()) + ' ' + (h >= 12 ? 'p. m.' : 'a. m.'); };

  /* ---------- texto ---------- */
  U.initials = name => String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  U.tone = name => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 5; return h; };
  U.plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  U.debounce = (fn, ms = 160) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.pct = (cur, prev) => prev > 0 ? Math.round((cur - prev) / prev * 100) : null;

  U.nextCode = function (products) {
    let max = 0;
    products.forEach(p => { const m = /^VJ-(\d+)$/.exec(p.code); if (m) max = Math.max(max, Number(m[1])); });
    return 'VJ-' + String(max + 1).padStart(3, '0');
  };

  /* tallas individuales de un producto: "S/M/L" -> [S,M,L]; "35-41" -> [35..41] */
  U.sizeList = function (size) {
    const r = /^(\d+)-(\d+)$/.exec(size || '');
    if (r) { const out = []; for (let i = +r[1]; i <= +r[2]; i++) out.push(String(i)); return out; }
    return String(size || 'Única').split('/');
  };
})();
