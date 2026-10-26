/* PEDIDOS (pantalla 6): tarjetas por estado, panel de detalle y nuevo pedido */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, cfg = VJ.config;
  const F = { q: '', st: '', origin: '', view: 'grid' };
  const FLOW = cfg.orderFlow, label = id => FLOW.find(s => s.id === id).label;
  const TONE = { pendiente: 'warn', confirmado: 'info', preparando: 'rose', listo: 'ok', entregado: 'neutral' };
  const tag = o => o.origin === 'online' ? '<span class="badge info xs">Online</span>' : '<span class="badge rose xs">Tienda</span>';

  function filtered() {
    const q = F.q.trim().toLowerCase();
    return S.orders().filter(o => (!q || (o.id + ' ' + o.name).toLowerCase().includes(q)) && (!F.st || o.status === F.st) && (!F.origin || o.origin === F.origin))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function card(o) {
    const total = S.orderTotal(o), units = S.orderUnits(o), shown = o.lines.slice(0, 2), more = o.lines.length - shown.length;
    return `<article class="card order st-${o.status}">
      <header class="o-head">${ui.avatar(o.name)}
        <div class="o-who"><strong>${U.esc(o.name)}${o.priority && o.status !== 'entregado' ? `<span class="prio" title="Pedido prioritario">${VJ.icon('alert', 13)}</span>` : ''}</strong><span class="mono">${U.esc(o.id)}</span></div>
        <div class="o-tags">${tag(o)}<span class="badge dot ${TONE[o.status]}">${label(o.status)}</span></div></header>
      <div class="o-meta"><span>${U.fmtDateTime(o.at)}</span><span>${U.plural(o.lines.length, 'producto', 'productos')} · ${units} un.</span></div>
      <ul class="o-items">${shown.map(l => `<li><span>${U.esc(l.name)} · ${U.esc(l.size)} · x${l.qty}</span><strong>${U.money(l.price * l.qty)}</strong></li>`).join('')}
        ${more > 0 ? `<li class="more">+ ${U.plural(more, 'producto más', 'productos más')}</li>` : ''}</ul>
      <footer class="o-foot"><div><small class="muted">Total</small><strong class="serif-n">${U.money(total)}</strong></div>
        <div class="row-gap"><button class="btn btn-soft btn-sm" data-act="adv" data-id="${o.id}" ${o.status === 'entregado' ? 'disabled' : ''}>${VJ.icon('edit', 13)} Actualizar</button>
        <button class="btn btn-ghost btn-sm" data-act="det" data-id="${o.id}">${VJ.icon('eye', 13)} Ver detalle</button></div></footer></article>`;
  }

  VJ.pages.pedidos = {
    meta: () => ({ crumb: ['Sistema', 'Pedidos'], title: 'Pedidos' }),

    render() {
      const all = S.orders(), now = new Date();
      const today = all.filter(o => U.sameDay(o.at, now));
      const inProc = all.filter(o => ['confirmado', 'preparando', 'listo'].includes(o.status)).length;
      const stChips = [['', 'Todas']].concat(FLOW.map(s => [s.id, s.label]));
      return `
      <div class="kpi-row k4">
        ${ui.kpi({ icon: 'clock', tone: 'warn', value: all.filter(o => o.status === 'pendiente').length, label: 'Pendientes', sub: 'requieren atención' })}
        ${ui.kpi({ icon: 'refresh', tone: 'info', value: inProc, label: 'En proceso', sub: 'confirmado · preparando · listo' })}
        ${ui.kpi({ icon: 'calendar', tone: 'ok', value: today.length, label: 'Pedidos hoy', sub: U.fmtDate(now) })}
        ${ui.kpi({ icon: 'dollar', value: U.money(today.reduce((a, o) => a + S.orderTotal(o), 0)), label: 'Total del día', sub: 'en pedidos recibidos' })}
      </div>

      <div class="toolbar free">
        <label class="search"><span class="sr-only">Buscar pedido</span>${VJ.icon('search', 16)}<input class="input" id="oQ" placeholder="Buscar por folio o cliente…"></label>
        <div class="chips scroll-x" id="oSt">${stChips.map(c => `<button class="chip ${F.st === c[0] ? 'on' : ''}" data-st="${c[0]}">${c[1]}</button>`).join('')}</div>
        <div class="chips" id="oOr">${[['', 'Todas'], ['online', 'Online'], ['tienda', 'Tienda']].map(c => `<button class="chip ${F.origin === c[0] ? 'on' : ''}" data-or="${c[0]}">${c[1]}</button>`).join('')}</div>
        <div class="view-toggle" id="oView"><button class="${F.view === 'grid' ? 'on' : ''}" data-v="grid" aria-label="Vista de tarjetas">${VJ.icon('grid', 15)}</button><button class="${F.view === 'list' ? 'on' : ''}" data-v="list" aria-label="Vista de lista">${VJ.icon('list', 15)}</button></div>
        <span class="count muted sm" id="oCount"></span>
        <button class="btn btn-primary btn-sm" id="newOrder">${VJ.icon('plus', 15)} Nuevo pedido</button>
      </div>
      <div class="orders ${F.view}" id="oGrid"></div>`;
    },

    mount(el) {
      const $ = s => el.querySelector(s);
      function draw() {
        const l = filtered();
        $('#oCount').textContent = U.plural(l.length, 'pedido', 'pedidos');
        $('#oGrid').className = 'orders ' + F.view;
        $('#oGrid').innerHTML = l.length ? l.map(card).join('') : `<div class="card wide">${ui.empty('file', 'Sin pedidos', 'No hay pedidos con estos filtros.')}</div>`;
      }
      draw();
      $('#oQ').addEventListener('input', U.debounce(e => { F.q = e.target.value; draw(); }, 120));
      $('#oSt').addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (!b) return; F.st = b.dataset.st; el.querySelectorAll('#oSt .chip').forEach(c => c.classList.toggle('on', c === b)); draw(); });
      $('#oOr').addEventListener('click', e => { const b = e.target.closest('[data-or]'); if (!b) return; F.origin = b.dataset.or; el.querySelectorAll('#oOr .chip').forEach(c => c.classList.toggle('on', c === b)); draw(); });
      $('#oView').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; F.view = b.dataset.v; el.querySelectorAll('#oView button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      $('#newOrder').addEventListener('click', () => newOrder());
      $('#oGrid').addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'det') return drawer(b.dataset.id);
        advance(b.dataset.id);
      });
    }
  };

  function advance(id, after) {
    const r = S.advanceOrder(id);
    if (r.error) return ui.toast(r.error, 'err');
    ui.toast(`${r.ok.id} → ${label(r.ok.status)}`);
    if (after) after(r.ok); VJ.app.refresh();
  }

  /* ---- panel lateral de detalle ---- */
  function drawer(id) {
    const o = S.orders().find(x => x.id === id); if (!o) return;
    const idx = FLOW.findIndex(s => s.id === o.status), done = o.status === 'entregado';
    const steps = FLOW.map((s, i) => {
      const cls = done || i < idx ? 'done' : i === idx ? 'now' : '';
      return `<li class="step ${cls}"><span class="dot-s">${cls === 'done' ? VJ.icon('check', 12) : ''}</span><span class="st-lbl">${s.label}</span></li>`;
    }).join('');
    const d = ui.drawer({
      title: 'Pedido ' + o.id,
      headHtml: `<div class="d-id"><span class="mono">${U.esc(o.id)}</span> ${tag(o)}</div><h2 class="serif-i">${U.esc(o.name)}</h2><p>${U.fmtDateTime(o.at)}</p>`,
      body: `
        <div class="d-sec"><span class="eyebrow">Estado del pedido</span><ol class="stepper">${steps}</ol></div>
        <div class="d-sec cust">${ui.avatar(o.name, 'lg')}<div><strong>${U.esc(o.name)}</strong><small class="block muted">${U.esc(o.phone || '—')}</small></div></div>
        <div class="d-sec loc">${VJ.icon('pin', 15)} <span>${o.origin === 'online' ? U.esc(o.address || 'Envío a domicilio') : 'Recoge en tienda'}</span></div>
        <div class="d-sec"><span class="eyebrow">Productos</span>
          <ul class="d-items">${o.lines.map(l => `<li>${ui.thumb(S.byCode(l.code))}<div class="d-it"><strong>${U.esc(l.name)}</strong><small>Talla ${U.esc(l.size)} · ${U.esc(l.color)} · x${l.qty}</small></div><strong class="serif-n">${U.money(l.price * l.qty)}</strong></li>`).join('')}</ul></div>`,
      foot: `<div class="d-total"><span>Total del pedido</span><strong class="serif-n xl">${U.money(S.orderTotal(o))}</strong></div>
        <div class="row-gap grow-x"><button class="btn btn-primary grow" id="dAdv" ${done ? 'disabled' : ''}>${VJ.icon('edit', 15)} ${done ? 'Pedido entregado' : 'Pasar a “' + label(FLOW[idx + 1].id) + '”'}</button><button class="btn" data-close>Cerrar</button></div>`
    });
    d.el.querySelector('#dAdv').addEventListener('click', () => { d.close(); advance(o.id, () => setTimeout(() => drawer(o.id), 220)); });
  }

  /* ---- nuevo pedido ---- */
  function newOrder() {
    const prods = S.products().filter(p => p.stock > 0);
    const body = `
      <div class="form-grid g2">
        <div class="field"><label for="nName">Cliente</label><input class="input" id="nName" placeholder="Nombre y apellido" maxlength="50"></div>
        <div class="field"><label for="nPhone">Teléfono</label><input class="input" id="nPhone" inputmode="tel" placeholder="Ej. 8774 6601" maxlength="20"></div>
        <div class="field"><label for="nOrigin">Origen</label><select class="select" id="nOrigin"><option value="online">Online (envío)</option><option value="tienda">Tienda (recoge)</option></select></div>
        <div class="field"><label for="nProd">Producto</label><select class="select" id="nProd">${prods.map(p => `<option value="${U.esc(p.code)}">${U.esc(p.name)} · ${U.money(p.price)}</option>`).join('')}</select></div>
        <div class="field"><label for="nSize">Talla</label><select class="select" id="nSize"></select></div>
        <div class="field"><label for="nQty">Cantidad</label><input class="input" id="nQty" type="number" min="1" value="1"></div>
      </div>
      <div class="field" id="nAddrBox"><label for="nAddr">Dirección de entrega</label><input class="input" id="nAddr" placeholder="Ciudad, barrio y señas" maxlength="120"></div>
      <label class="check"><input type="checkbox" id="nPrio"> Marcar como prioritario</label>
      <small class="err-msg" id="nErr" hidden></small>`;
    const m = ui.modal({
      title: 'Nuevo pedido', subtitle: 'Registra un pedido recibido por teléfono, redes o la tienda en línea.', body, size: 'md',
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" id="nSave">${VJ.icon('save', 15)} Crear pedido</button>`
    });
    const $ = s => m.el.querySelector(s);
    function sizes() { $('#nSize').innerHTML = U.sizeList((S.byCode($('#nProd').value) || {}).size).map(s => `<option>${U.esc(s)}</option>`).join(''); }
    function origin() { $('#nAddrBox').hidden = $('#nOrigin').value !== 'online'; }
    $('#nProd').addEventListener('change', sizes); $('#nOrigin').addEventListener('change', origin); sizes(); origin();
    $('#nSave').addEventListener('click', () => {
      const er = $('#nErr'), name = $('#nName').value.trim(), qty = parseInt($('#nQty').value, 10), org = $('#nOrigin').value;
      const fail = t => { er.hidden = false; er.textContent = t; };
      if (!name) return fail('Escribe el nombre del cliente.');
      if (!(qty > 0)) return fail('La cantidad debe ser al menos 1.');
      if (org === 'online' && !$('#nAddr').value.trim()) return fail('Escribe la dirección de entrega.');
      const p = S.byCode($('#nProd').value);
      if (qty > p.stock) return fail('Solo hay ' + p.stock + ' un. disponibles de ' + p.name + '.');
      const r = S.createOrder({ name, phone: $('#nPhone').value.trim(), origin: org, address: $('#nAddr').value.trim(), priority: $('#nPrio').checked, lines: [{ code: p.code, qty, size: $('#nSize').value }] });
      if (r.error) return fail(r.error);
      m.close(); ui.toast('Pedido ' + r.ok.id + ' creado.'); VJ.app.refresh();
    });
  }
})();
