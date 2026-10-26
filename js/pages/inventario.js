/* INVENTARIO (pantalla 3): consulta, filtros, actualizar stock, detalle y eliminar */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, cfg = VJ.config;
  const F = { q: '', cat: '', st: '', page: 1 };

  function filtered() {
    const q = F.q.trim().toLowerCase();
    return S.products().filter(p =>
      (!q || (p.name + ' ' + p.code + ' ' + p.category + ' ' + p.brand + ' ' + p.color).toLowerCase().includes(q)) &&
      (!F.cat || p.category === F.cat) && (!F.st || S.status(p) === F.st));
  }

  VJ.pages.inventario = {
    meta: () => ({ crumb: ['Sistema', 'Inventario'], title: 'Inventario' }),

    render(ctx) {
      F.page = 1;
      const all = S.products();
      const low = all.filter(p => S.status(p) === 'bajo').length, out = all.filter(p => S.status(p) === 'agotado').length;
      const chips = [['', 'Todas'], ['disponible', 'Disponible'], ['bajo', 'Stock bajo'], ['agotado', 'Agotado']];
      return `
      <div class="kpi-row k3">
        ${ui.kpi({ icon: 'stock', value: all.length, label: 'Total productos', sub: 'en catálogo' })}
        ${ui.kpi({ icon: 'alert', tone: 'warn', value: low, label: 'Stock bajo', sub: 'requieren reabastecimiento' })}
        ${ui.kpi({ icon: 'ban', tone: 'bad', value: out, label: 'Agotados', sub: 'sin stock disponible' })}
      </div>

      <section class="card table-card">
        <div class="toolbar">
          <label class="search"><span class="sr-only">Buscar producto</span>${VJ.icon('search', 16)}<input class="input" id="invQ" placeholder="Buscar producto…" value="${U.esc(F.q)}"></label>
          <select class="select sel-sm" id="invCat" aria-label="Categoría"><option value="">Todas las categorías</option>${cfg.categories.map(c => `<option>${U.esc(c)}</option>`).join('')}</select>
          <div class="chips" id="invChips">${chips.map(c => `<button class="chip ${F.st === c[0] ? 'on' : ''}" data-st="${c[0]}">${c[1]}</button>`).join('')}</div>
          <span class="count muted sm" id="invCount"></span>
          ${ctx.user.role === 'admin' ? `<button class="btn btn-primary btn-sm push-r" id="newProd">${VJ.icon('plus', 15)} Nuevo producto</button>` : ''}
        </div>
        <div class="table-wrap"><table class="tbl stack">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Stock mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="invBody"></tbody>
        </table></div>
        <footer class="table-foot"><span class="muted sm" id="invShown"></span>
          <span class="legend"><i class="dot ok"></i> Disponible <i class="dot warn"></i> Stock bajo <i class="dot bad"></i> Agotado</span></footer>
        <div id="invPager"></div>
      </section>`;
    },

    mount(el, ctx) {
      const $ = s => el.querySelector(s), admin = ctx.user.role === 'admin';
      $('#invCat').value = F.cat;

      function draw() {
        const list = filtered(), size = cfg.inventoryPageSize, pages = Math.max(1, Math.ceil(list.length / size));
        if (F.page > pages) F.page = pages;
        const slice = list.slice((F.page - 1) * size, F.page * size);
        $('#invCount').textContent = U.plural(list.length, 'resultado', 'resultados');
        $('#invBody').innerHTML = slice.length ? slice.map(p => {
          const st = S.status(p);
          return `<tr>
            <td data-label="Código" class="mono">${U.esc(p.code)}</td>
            <td data-label="Producto"><div class="prod-cell"><strong>${U.esc(p.name)}</strong><small>${U.esc(p.color)} · ${U.esc(p.size)}</small></div></td>
            <td data-label="Categoría"><span class="tag">${U.esc(p.category)}</span></td>
            <td data-label="Stock"><strong class="stock ${st}">${p.stock}</strong> <small class="muted">un.</small></td>
            <td data-label="Mínimo"><span class="muted">${p.min} un.</span></td>
            <td data-label="Estado">${ui.statusBadge(p)}</td>
            <td class="actions"><button class="btn btn-soft btn-sm" data-act="upd" data-id="${U.esc(p.id)}">${VJ.icon('edit', 13)} Actualizar</button><button class="btn btn-ghost btn-sm" data-act="det" data-id="${U.esc(p.id)}">${VJ.icon('eye', 13)} Detalles</button></td>
          </tr>`;
        }).join('') : `<tr class="no-row"><td colspan="7">${ui.empty('search', 'Sin resultados', 'Prueba con otro nombre, código o filtro.')}</td></tr>`;
        $('#invShown').textContent = `Mostrando ${slice.length} de ${S.products().length} productos`;
        $('#invPager').innerHTML = ui.pager(list.length, F.page, size);
      }
      draw();

      $('#invQ').addEventListener('input', U.debounce(e => { F.q = e.target.value; F.page = 1; draw(); }, 120));
      $('#invCat').addEventListener('change', e => { F.cat = e.target.value; F.page = 1; draw(); });
      $('#invChips').addEventListener('click', e => {
        const b = e.target.closest('[data-st]'); if (!b) return;
        F.st = b.dataset.st; F.page = 1;
        el.querySelectorAll('#invChips .chip').forEach(c => c.classList.toggle('on', c === b)); draw();
      });
      const np = $('#newProd'); if (np) np.addEventListener('click', () => VJ.app.go('productos'));
      $('#invPager').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b && !b.disabled) { F.page = +b.dataset.page; draw(); } });

      $('#invBody').addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const p = S.product(b.dataset.id); if (!p) return;
        if (b.dataset.act === 'upd') stockModal(p, draw);
        else detailModal(p, admin, draw);
      });
      const unsub = () => { if (el.isConnected) VJ.app.refresh(); };
      el._unsub = unsub;
    }
  };

  /* ---- actualizar existencias ---- */
  function stockModal(p, done) {
    let mode = 'in';
    const body = `
      <div class="pm-head">${ui.thumb(p)}<div><strong>${U.esc(p.name)}</strong><small class="mono">${U.esc(p.code)}</small></div>
        <div class="pm-stock"><span class="muted sm">Stock actual</span><strong class="serif-n">${p.stock}</strong></div></div>
      <div class="seg" id="segMode" role="tablist">
        <button type="button" class="on" data-m="in">Entrada (+)</button><button type="button" data-m="out">Salida (−)</button><button type="button" data-m="set">Ajustar a</button>
      </div>
      <div class="form-grid g2">
        <div class="field"><label for="sq" id="sqLbl">Unidades que ingresan</label><input class="input" id="sq" type="number" min="0" step="1" inputmode="numeric" placeholder="0"><small class="err-msg" hidden></small></div>
        <div class="field"><label for="smin">Stock mínimo</label><input class="input" id="smin" type="number" min="0" step="1" inputmode="numeric" value="${p.min}"></div>
      </div>
      <p class="hint" id="sPrev"></p>`;
    const m = ui.modal({
      title: 'Actualizar stock', subtitle: 'Registra entradas, salidas o ajusta el conteo físico.', body,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" id="sSave">${VJ.icon('save', 15)} Guardar</button>`
    });
    const $ = s => m.el.querySelector(s);
    const lbl = { in: 'Unidades que ingresan', out: 'Unidades que salen', set: 'Nuevo stock' };
    function prev() {
      const q = parseInt($('#sq').value, 10); const h = $('#sPrev');
      if (isNaN(q)) { h.textContent = ''; return; }
      const next = mode === 'in' ? p.stock + q : mode === 'out' ? p.stock - q : q;
      h.textContent = 'Quedará en ' + next + ' un.'; h.className = 'hint ' + (next < 0 ? 'bad' : next <= (parseInt($('#smin').value, 10) || p.min) ? 'warn' : 'ok');
    }
    $('#segMode').addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m;
      m.el.querySelectorAll('#segMode button').forEach(x => x.classList.toggle('on', x === b));
      $('#sqLbl').textContent = lbl[mode]; prev();
    });
    $('#sq').addEventListener('input', prev); $('#smin').addEventListener('input', prev);
    $('#sSave').addEventListener('click', () => {
      const q = parseInt($('#sq').value, 10), min = parseInt($('#smin').value, 10), er = m.el.querySelector('.err-msg');
      const minChanged = !isNaN(min) && min !== p.min;
      if (isNaN(q) && !minChanged) { er.hidden = false; er.textContent = 'Escribe una cantidad.'; return; }
      let r = { ok: true };
      if (!isNaN(q)) r = S.adjustStock(p.id, { mode, qty: q, min });
      else r = S.updateProduct(p.id, { min });
      if (r.error) { er.hidden = false; er.textContent = r.error; return; }
      if (!isNaN(q) && minChanged) S.updateProduct(p.id, { min });
      m.close(); ui.toast('Stock de ' + p.name + ' actualizado.'); VJ.app.refresh();
    });
  }

  /* ---- detalle ---- */
  function detailModal(p, admin) {
    const margin = p.price > 0 ? Math.round((p.price - p.cost) / p.price * 100) : 0;
    const row = (k, v) => `<div class="dl-row"><dt>${k}</dt><dd>${v}</dd></div>`;
    const body = `
      <div class="detail-top">${ui.thumb(p, 'lg')}<div><h3 class="serif-n">${U.esc(p.name)}</h3><span class="mono">${U.esc(p.code)}</span> ${ui.statusBadge(p)}</div></div>
      <dl class="dl">
        ${row('Categoría', U.esc(p.category))}${row('Marca', U.esc(p.brand || '—'))}${row('Talla', U.esc(p.size || '—'))}${row('Color', U.esc(p.color || '—'))}
        ${row('Precio de compra', U.money(p.cost))}${row('Precio de venta', `<strong>${U.money(p.price)}</strong>`)}${row('Margen', margin + '%')}
        ${row('Stock', `${p.stock} un. (mínimo ${p.min})`)}${row('Valor en inventario', U.money(p.stock * p.price))}${row('Proveedor', U.esc(p.supplier || '—'))}
      </dl>
      <div class="confirm-box" id="delBox" hidden><p>¿Eliminar <strong>${U.esc(p.name)}</strong>? Las ventas anteriores se conservan.</p>
        <div class="row-gap"><button class="btn btn-sm" id="delNo">No, volver</button><button class="btn btn-sm btn-danger-solid" id="delYes">Sí, eliminar</button></div></div>`;
    const m = ui.modal({
      title: 'Detalle del producto', body, size: 'md',
      foot: admin
        ? `<button class="btn btn-danger" id="delAsk">${VJ.icon('trash', 15)} Eliminar</button><span class="grow"></span><button class="btn" data-close>Cerrar</button><button class="btn btn-primary" id="editBtn">${VJ.icon('edit', 15)} Editar</button>`
        : `<button class="btn" data-close>Cerrar</button>`
    });
    if (!admin) return;
    const $ = s => m.el.querySelector(s);
    $('#editBtn').addEventListener('click', () => { m.close(); VJ.app.go('productos', { edit: p.id }); });
    $('#delAsk').addEventListener('click', () => { $('#delBox').hidden = false; $('#delAsk').hidden = true; });
    $('#delNo').addEventListener('click', () => { $('#delBox').hidden = true; $('#delAsk').hidden = false; });
    $('#delYes').addEventListener('click', () => { S.removeProduct(p.id); m.close(); ui.toast('Producto eliminado.', 'info'); VJ.app.refresh(); });
  }
})();
