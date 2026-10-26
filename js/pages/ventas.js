/* NUEVA VENTA (pantalla 4): buscador, carrito, resumen, método de pago y registro */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, cfg = VJ.config;

  const blank = () => ({ cart: [], method: 'efectivo', bank: cfg.banks[0] || '', ref: '', received: '', discount: '', note: '' });
  let T = blank();

  const subtotal = () => T.cart.reduce((a, l) => { const p = S.byCode(l.code); return a + (p ? p.price * l.qty : 0); }, 0);
  const discAmt = () => Math.round(subtotal() * Math.min(100, Math.max(0, parseFloat(T.discount) || 0)) / 100);
  const total = () => subtotal() - discAmt();

  function methodHint(m) { return m.hint || cfg.banks.join(', '); }

  VJ.pages.ventas = {
    meta: () => ({ crumb: ['Ventas', 'Nueva venta'], title: 'Nueva venta' }),

    render() {
      T.cart = T.cart.filter(l => S.byCode(l.code));
      return `
      <div class="sale-layout">
        <div class="sale-main">
          <div class="searchbox">
            <label class="search big"><span class="sr-only">Buscar producto</span>${VJ.icon('search', 17)}
              <input class="input" id="saleQ" placeholder="Buscar producto por nombre o código…" autocomplete="off"></label>
            <div class="results" id="saleRes" hidden></div>
          </div>
          <section class="card cart-card">
            <header class="card-head"><span class="ico">${VJ.icon('cart', 16)}</span><h3>Productos en la venta</h3><span class="muted sm" id="cartCount"></span></header>
            <div id="cartBody"></div>
          </section>
          <section class="card note-card">
            <label class="lbl" for="saleNote">Nota u observación (opcional)</label>
            <textarea class="textarea" id="saleNote" rows="2" placeholder="Ej. Separado para cliente, regalo, cambio pendiente…">${U.esc(T.note)}</textarea>
          </section>
        </div>
        <aside class="card sale-side" id="saleSide"></aside>
      </div>`;
    },

    mount(el, ctx) {
      const $ = s => el.querySelector(s);

      /* ---------- buscador ---------- */
      function results() {
        const q = $('#saleQ').value.trim().toLowerCase(), box = $('#saleRes');
        if (!q) { box.hidden = true; return []; }
        const list = S.products().filter(p => (p.name + ' ' + p.code + ' ' + p.category + ' ' + p.color).toLowerCase().includes(q)).slice(0, 8);
        box.hidden = false;
        box.innerHTML = list.length ? list.map(p => {
          const out = p.stock <= 0;
          return `<button type="button" class="res-row" data-code="${U.esc(p.code)}" ${out ? 'disabled' : ''}>
            ${ui.thumb(p)}<span class="res-main"><strong>${U.esc(p.name)}</strong><small><span class="mono">${U.esc(p.code)}</span> · ${U.esc(p.color)} · ${U.esc(p.size)}</small></span>
            <span class="res-end"><strong>${U.money(p.price)}</strong>${ui.statusBadge(p)}</span></button>`;
        }).join('') : `<div class="res-none">No hay productos que coincidan con “${U.esc($('#saleQ').value)}”.</div>`;
        return list;
      }
      function add(code) {
        const p = S.byCode(code); if (!p) return;
        const line = T.cart.find(l => l.code === p.code);
        const have = line ? line.qty : 0;
        if (have + 1 > p.stock) return ui.toast(p.stock <= 0 ? p.name + ' está agotado.' : 'Solo hay ' + p.stock + ' un. de ' + p.name + '.', 'err');
        if (line) line.qty++; else T.cart.push({ code: p.code, qty: 1 });
        $('#saleQ').value = ''; $('#saleRes').hidden = true;
        drawCart(); drawSide();
      }
      $('#saleQ').addEventListener('input', results);
      $('#saleQ').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const exact = S.byCode($('#saleQ').value);
          if (exact) return add(exact.code);
          const l = results().filter(p => p.stock > 0); if (l.length) add(l[0].code);
        }
        if (e.key === 'Escape') { $('#saleRes').hidden = true; }
      });
      $('#saleRes').addEventListener('click', e => { const b = e.target.closest('[data-code]'); if (b) add(b.dataset.code); });
      document.addEventListener('click', function off(e) {
        if (!el.isConnected) return document.removeEventListener('click', off);
        if (!e.target.closest('.searchbox')) $('#saleRes').hidden = true;
      });

      /* ---------- carrito ---------- */
      function drawCart() {
        $('#cartCount').textContent = T.cart.length ? U.plural(T.cart.reduce((a, l) => a + l.qty, 0), 'unidad', 'unidades') : '';
        $('#cartBody').innerHTML = T.cart.length ? `<ul class="cart-list">${T.cart.map(l => {
          const p = S.byCode(l.code);
          return `<li class="cart-row">${ui.thumb(p)}
            <div class="cart-name"><strong>${U.esc(p.name)}</strong><small><span class="mono">${U.esc(p.code)}</span> · ${U.esc(p.color)} · ${U.money(p.price)} c/u</small></div>
            <div class="qty" role="group" aria-label="Cantidad de ${U.esc(p.name)}">
              <button type="button" data-q="-1" data-code="${U.esc(p.code)}" aria-label="Quitar una unidad">${VJ.icon('minus', 14)}</button>
              <input type="number" min="1" max="${p.stock}" value="${l.qty}" data-qin="${U.esc(p.code)}" aria-label="Cantidad">
              <button type="button" data-q="1" data-code="${U.esc(p.code)}" aria-label="Agregar una unidad">${VJ.icon('plus', 14)}</button>
            </div>
            <strong class="cart-sub">${U.money(p.price * l.qty)}</strong>
            <button type="button" class="icon-btn sm" data-rm="${U.esc(p.code)}" aria-label="Quitar del carrito">${VJ.icon('trash', 14)}</button></li>`;
        }).join('')}</ul>`
          : `<div class="cart-empty"><span class="empty-ico">${VJ.icon('cart', 26)}</span><strong>Carrito vacío</strong><small>Busca y agrega productos arriba</small></div>`;
      }
      $('#cartBody').addEventListener('click', e => {
        const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
        if (q) {
          const l = T.cart.find(x => x.code === q.dataset.code), p = S.byCode(l.code), n = l.qty + (+q.dataset.q);
          if (n < 1) { T.cart = T.cart.filter(x => x !== l); }
          else if (n > p.stock) { return ui.toast('Solo hay ' + p.stock + ' un. de ' + p.name + '.', 'err'); }
          else l.qty = n;
          drawCart(); drawSide();
        }
        if (rm) { T.cart = T.cart.filter(x => x.code !== rm.dataset.rm); drawCart(); drawSide(); }
      });
      $('#cartBody').addEventListener('change', e => {
        const i = e.target.closest('[data-qin]'); if (!i) return;
        const l = T.cart.find(x => x.code === i.dataset.qin), p = S.byCode(l.code);
        let n = parseInt(i.value, 10); if (isNaN(n) || n < 1) n = 1;
        if (n > p.stock) { n = p.stock; ui.toast('Solo hay ' + p.stock + ' un. de ' + p.name + '.', 'err'); }
        l.qty = n; drawCart(); drawSide();
      });
      $('#saleNote').addEventListener('input', e => { T.note = e.target.value; });

      /* ---------- resumen y pago ---------- */
      function money$(id, v) { const n = $('#' + id); if (n) n.textContent = v; }
      function totals() {
        const sub = subtotal(), d = discAmt(), t = total();
        money$('sSub', U.money(sub)); money$('sDisc', d ? '− ' + U.money(d) : '—'); money$('sTot', U.money(t));
        const rec = parseFloat(T.received), hint = $('#sCash'), btn = $('#regBtn'), msg = $('#regHint');
        let ok = T.cart.length > 0, txt = ok ? '' : 'Agrega al menos un producto para continuar';
        if (T.method === 'efectivo' && hint) {
          if (T.received !== '' && !isNaN(rec)) {
            if (rec >= t) { hint.textContent = 'Cambio: ' + U.money(rec - t); hint.className = 'hint ok'; }
            else { hint.textContent = 'Faltan ' + U.money(t - rec); hint.className = 'hint bad'; if (ok) { ok = false; txt = 'El efectivo recibido no cubre el total'; } }
          } else { hint.textContent = ''; }
        }
        if (btn) btn.disabled = !ok;
        if (msg) msg.textContent = txt;
      }
      function drawSide() {
        const sym = cfg.currency.symbol;
        $('#saleSide').innerHTML = `
          <header class="side-head"><span class="ico">${VJ.icon('receipt', 16)}</span><h3>Resumen</h3></header>
          <dl class="sum">
            <div><dt>Subtotal</dt><dd id="sSub"></dd></div>
            <div class="disc"><dt><label for="sDiscIn">Descuento</label></dt><dd><span class="disc-in"><input id="sDiscIn" class="input" type="number" min="0" max="100" step="1" inputmode="decimal" value="${U.esc(T.discount)}" placeholder="0"><i>%</i></span><span id="sDisc" class="disc-val"></span></dd></div>
            <div class="grand"><dt>Total</dt><dd id="sTot"></dd></div>
          </dl>
          <div class="side-sec"><span class="lbl"><span class="ico">${VJ.icon('card', 14)}</span> Método de pago</span>
            <div class="pay-opts" role="radiogroup" aria-label="Método de pago">${cfg.paymentMethods.map(m => `
              <button type="button" class="pay ${T.method === m.id ? 'on' : ''}" role="radio" aria-checked="${T.method === m.id}" data-m="${m.id}">
                <span class="pay-ico">${VJ.icon(m.icon, 16)}</span><span class="pay-txt"><strong>${U.esc(m.label)}</strong><small>${U.esc(methodHint(m))}</small></span><span class="radio"></span></button>`).join('')}</div>
          </div>
          ${T.method === 'efectivo' ? `
            <div class="field"><label for="sRec">Efectivo recibido</label><div class="money-input"><span>${sym}</span><input class="input" id="sRec" type="number" min="0" step="any" inputmode="decimal" value="${U.esc(T.received)}" placeholder="0"></div><small class="hint" id="sCash"></small></div>`
            : `<div class="field"><label for="sBank">Banco</label><select class="select" id="sBank">${cfg.banks.map(b => `<option ${b === T.bank ? 'selected' : ''}>${U.esc(b)}</option>`).join('')}</select></div>
               <div class="field"><label for="sRef">N.º de referencia (opcional)</label><input class="input" id="sRef" value="${U.esc(T.ref)}" placeholder="Ej. 40918822" maxlength="24"></div>`}
          <button type="button" class="btn btn-primary btn-block btn-lg" id="regBtn" disabled>${VJ.icon('check', 17)} Registrar venta</button>
          <p class="reg-hint" id="regHint"></p>`;
        totals();
      }
      $('#saleSide').addEventListener('click', e => {
        const m = e.target.closest('[data-m]'); if (m) { T.method = m.dataset.m; drawSide(); return; }
        if (e.target.closest('#regBtn')) register();
      });
      $('#saleSide').addEventListener('input', e => {
        const id = e.target.id;
        if (id === 'sDiscIn') T.discount = e.target.value;
        if (id === 'sRec') T.received = e.target.value;
        if (id === 'sRef') T.ref = e.target.value;
        totals();
      });
      $('#saleSide').addEventListener('change', e => { if (e.target.id === 'sBank') T.bank = e.target.value; });

      function register() {
        const r = S.createSale({
          user: ctx.user, lines: T.cart.map(l => ({ code: l.code, qty: l.qty })), discountPct: Math.min(100, Math.max(0, parseFloat(T.discount) || 0)),
          method: T.method, bank: T.bank, ref: T.ref, received: parseFloat(T.received) || 0, note: T.note.trim()
        });
        if (r.error) { drawCart(); return ui.toast(r.error, 'err'); }
        const s = r.ok; T = blank();
        ui.modal({
          title: 'Venta registrada', size: 'sm',
          body: `<div class="done"><span class="done-ico">${VJ.icon('check', 28)}</span>
            <p class="mono big">${U.esc(s.id)}</p><strong class="serif-n xl">${U.money(s.total)}</strong>
            <small class="muted">${U.plural(s.lines.reduce((a, l) => a + l.qty, 0), 'producto', 'productos')} · ${s.method === 'efectivo' ? 'Efectivo' : 'Transferencia ' + U.esc(s.bank)}</small>
            ${s.method === 'efectivo' && s.change > 0 ? `<span class="badge ok">Cambio: ${U.money(s.change)}</span>` : ''}</div>`,
          foot: `<button class="btn" id="goHist">Ver historial</button><button class="btn btn-primary" id="newSale">Nueva venta</button>`,
          onMount: m => {
            m.el.querySelector('#goHist').addEventListener('click', () => { m.close(); VJ.app.go('historial'); });
            m.el.querySelector('#newSale').addEventListener('click', () => { m.close(); VJ.app.refresh(); });
          },
          onClose: () => VJ.app.refresh()
        });
      }

      drawCart(); drawSide();
    }
  };
})();
