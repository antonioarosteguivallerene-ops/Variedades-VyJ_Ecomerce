/* Componentes de interfaz compartidos: avisos, ventanas, panel lateral, paginador */
(function () {
  const VJ = window.VJ = window.VJ || {};
  const U = VJ.u, S = () => VJ.store;
  const ui = VJ.ui = {};

  ui.toast = function (msg, type, ms) {
    type = type || 'ok';
    const host = document.getElementById('toasts'); if (!host) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.setAttribute('role', 'status');
    t.innerHTML = `<span class="toast-ico">${VJ.icon(type === 'err' ? 'alert' : type === 'info' ? 'info' : 'check', 16)}</span><span>${U.esc(msg)}</span>`;
    host.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms || 3400);
  };

  function layer(kind, o) {
    const root = document.getElementById('overlay-root');
    const prev = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'backdrop ' + kind + '-wrap';
    wrap.innerHTML =
      `<div class="${kind} ${o.size || ''}" role="dialog" aria-modal="true" aria-label="${U.esc(o.title)}">` +
      `<div class="${kind}-head"><div class="head-txt">${o.headHtml || `<h2 class="serif-i">${U.esc(o.title)}</h2>${o.subtitle ? `<p>${o.subtitle}</p>` : ''}`}</div>` +
      `<button class="icon-btn" data-close aria-label="Cerrar">${VJ.icon('x', 18)}</button></div>` +
      `<div class="${kind}-body">${o.body || ''}</div>${o.foot ? `<div class="${kind}-foot">${o.foot}</div>` : ''}</div>`;
    root.appendChild(wrap);
    const box = wrap.firstElementChild;
    const openSet = ui._open = ui._open || new Set();
    function close() {
      if (!openSet.has(close)) return;
      openSet.delete(close);
      document.removeEventListener('keydown', onKey);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 180);
      if (prev && prev.focus) { try { prev.focus(); } catch (e) { /* noop */ } }
      if (o.onClose) o.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    openSet.add(close);
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    const first = box.querySelector('[autofocus],input,select,textarea,.btn-primary');
    if (first) setTimeout(() => first.focus(), 30);
    const api = { close, el: box, body: box.querySelector('.' + kind + '-body') };
    if (o.onMount) o.onMount(api);
    return api;
  }
  ui.closeAll = () => { if (ui._open) Array.from(ui._open).forEach(f => f()); };
  ui.modal = o => layer('modal', o);
  ui.drawer = o => layer('drawer', o);

  /* miniatura de producto: imagen subida o ícono */
  ui.thumb = function (p, cls) {
    return p && p.image
      ? `<span class="thumb ${cls || ''}"><img src="${p.image}" alt=""></span>`
      : `<span class="thumb ${cls || ''}">${VJ.icon('bag', 18)}</span>`;
  };

  ui.avatar = function (name, cls) {
    return `<span class="av av-${U.tone(name)} ${cls || ''}" aria-hidden="true">${U.esc(U.initials(name))}</span>`;
  };

  ui.statusBadge = function (p) {
    const st = S().status(p), m = { disponible: ['ok', 'Disponible'], bajo: ['warn', 'Stock bajo'], agotado: ['bad', 'Agotado'] }[st];
    return `<span class="badge dot ${m[0]}">${m[1]}</span>`;
  };

  ui.methodBadge = function (m, bank) {
    return m === 'efectivo'
      ? `<span class="badge ok">${VJ.icon('banknote', 13)} Efectivo</span>`
      : `<span class="badge info" title="${U.esc(bank || '')}">${VJ.icon('card', 13)} Transferencia${bank ? ' · ' + U.esc(bank) : ''}</span>`;
  };

  ui.empty = (icon, title, sub) =>
    `<div class="empty"><span class="empty-ico">${VJ.icon(icon, 26)}</span><strong>${U.esc(title)}</strong><small>${U.esc(sub || '')}</small></div>`;

  ui.pager = function (total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return '';
    let h = `<button class="pg" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Anterior">${VJ.icon('chevL', 14)}</button>`;
    for (let i = 1; i <= pages; i++) h += `<button class="pg ${i === page ? 'on' : ''}" data-page="${i}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`;
    h += `<button class="pg" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Siguiente">${VJ.icon('chevR', 14)}</button>`;
    return `<div class="pager">${h}</div>`;
  };

  /* tarjeta de indicador */
  ui.kpi = function (o) {
    return `<div class="card kpi ${o.cls || ''}"${o.attrs || ''}><span class="kpi-ico ${o.tone || ''}">${VJ.icon(o.icon, 20)}</span>` +
      `<div class="kpi-txt"><div class="kpi-val">${o.value}</div><div class="kpi-label">${o.label}</div><div class="kpi-sub">${o.sub || ''}</div></div>${o.extra || ''}</div>`;
  };

  ui.delta = function (cur, prev, suffix) {
    const p = U.pct(cur, prev);
    if (p === null) return `<span class="delta flat">—</span>`;
    return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${VJ.icon(p >= 0 ? 'arrowUp' : 'arrowDown', 11)} ${p >= 0 ? '+' : ''}${p}%${suffix ? ' ' + suffix : ''}</span>`;
  };
})();
