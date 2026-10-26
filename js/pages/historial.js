/* HISTORIAL DE VENTAS (pantalla 5): filtros, orden, paginación y detalle */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, ST = VJ.stats, cfg = VJ.config;
  const F = { q: '', from: '', to: '', emp: '', method: '', key: 'at', dir: -1, page: 1 };

  function filtered() {
    const q = F.q.trim().toLowerCase(), from = U.parseIso(F.from), to = F.to ? U.addDays(U.parseIso(F.to), 1) : null;
    const list = S.sales().filter(s => {
      const t = new Date(s.at);
      return (!q || (s.id + ' ' + s.empName).toLowerCase().includes(q)) && (!F.emp || s.empName === F.emp) &&
        (!F.method || s.method === F.method) && (!from || t >= from) && (!to || t < to);
    });
    return list.sort((a, b) => F.key === 'total' ? (a.total - b.total) * F.dir : (new Date(a.at) - new Date(b.at)) * F.dir);
  }

  VJ.pages.historial = {
    meta: () => ({ crumb: ['Ventas', 'Historial de ventas'], title: 'Historial de ventas' }),

    render() {
      F.page = 1;
      const now = new Date(), sales = S.sales(), days = ST.lastDays(sales, 7);
      const today = ST.day(sales, now), yest = ST.day(sales, U.addDays(now, -1));
      const avg = today.length ? ST.sum(today) / today.length : 0, avgY = yest.length ? ST.sum(yest) / yest.length : 0;
      const emps = Array.from(new Set(sales.map(s => s.empName))).sort();
      const diff = today.length - yest.length;
      return `
      <div class="kpi-row k3">
        ${ui.kpi({ icon: 'dollar', value: U.money(ST.sum(today)), label: 'Total vendido hoy', sub: ui.delta(ST.sum(today), ST.sum(yest), 'vs ayer'), extra: VJ.charts.spark(days.map(d => d.total), 'rose') })}
        ${ui.kpi({ icon: 'receipt', tone: 'ok', value: today.length, label: 'Ventas del día', sub: `<span class="delta ${diff >= 0 ? 'up' : 'down'}">${VJ.icon(diff >= 0 ? 'arrowUp' : 'arrowDown', 11)} ${diff >= 0 ? '+' : ''}${diff} vs ayer</span>`, extra: VJ.charts.spark(days.map(d => d.count), 'ok') })}
        ${ui.kpi({ icon: 'pulse', tone: 'warn', value: U.money(avg), label: 'Promedio por venta', sub: avgY ? ui.delta(avg, avgY, 'vs ayer') : '<span class="muted">Estable</span>', extra: VJ.charts.spark(days.map(d => d.count ? d.total / d.count : 0), 'warn') })}
      </div>

      <section class="card table-card">
        <div class="toolbar">
          <label class="search"><span class="sr-only">Buscar</span>${VJ.icon('search', 16)}<input class="input" id="hQ" placeholder="Buscar por folio o empleado…"></label>
          <div class="date-range"><input class="input" type="date" id="hFrom" aria-label="Desde"><span>–</span><input class="input" type="date" id="hTo" aria-label="Hasta"></div>
          <select class="select sel-sm" id="hEmp" aria-label="Empleado"><option value="">Todas</option>${emps.map(e => `<option>${U.esc(e)}</option>`).join('')}</select>
          <div class="chips" id="hChips"><button class="chip on" data-m="">Todos</button><button class="chip" data-m="efectivo">Efectivo</button><button class="chip" data-m="transferencia">Transferencia</button></div>
          <span class="count muted sm" id="hCount"></span>
        </div>
        <div class="table-wrap"><table class="tbl stack">
          <thead><tr><th>Número de venta</th><th><button class="th-sort" data-k="at">Fecha y hora <span id="arrAt"></span></button></th><th>Empleado</th><th>Método de pago</th><th><button class="th-sort" data-k="total">Total <span id="arrTotal"></span></button></th><th>Acciones</th></tr></thead>
          <tbody id="hBody"></tbody>
        </table></div>
        <footer class="table-foot"><span class="muted sm" id="hShown"></span><span id="hPager"></span></footer>
      </section>`;
    },

    mount(el) {
      const $ = s => el.querySelector(s), size = cfg.pageSize, now = new Date();

      function draw() {
        const list = filtered(), pages = Math.max(1, Math.ceil(list.length / size));
        if (F.page > pages) F.page = pages;
        const a = (F.page - 1) * size, slice = list.slice(a, a + size);
        $('#hCount').textContent = U.plural(list.length, 'resultado', 'resultados');
        $('#arrAt').textContent = F.key === 'at' ? (F.dir < 0 ? '↓' : '↑') : '';
        $('#arrTotal').textContent = F.key === 'total' ? (F.dir < 0 ? '↓' : '↑') : '';
        $('#hBody').innerHTML = slice.length ? slice.map(s => {
          const n = s.lines.reduce((x, l) => x + l.qty, 0);
          return `<tr>
            <td data-label="Venta"><span class="mono">${U.esc(s.id)}</span> ${U.sameDay(s.at, now) ? '<span class="badge rose xs">Hoy</span>' : ''}<small class="block muted">${U.plural(n, 'producto', 'productos')}</small></td>
            <td data-label="Fecha"><strong>${U.fmtDate(s.at)}</strong><small class="block muted">${U.fmtTime(s.at)}</small></td>
            <td data-label="Empleado"><span class="emp">${ui.avatar(s.empName)} ${U.esc(s.empName)}</span></td>
            <td data-label="Pago">${ui.methodBadge(s.method, s.bank)}</td>
            <td data-label="Total"><strong class="serif-n">${U.money(s.total)}</strong></td>
            <td class="actions"><button class="btn btn-ghost btn-sm" data-id="${U.esc(s.id)}">${VJ.icon('eye', 13)} Ver detalle</button></td></tr>`;
        }).join('') : `<tr class="no-row"><td colspan="6">${ui.empty('receipt', 'Sin ventas para mostrar', 'Cambia los filtros o registra una venta nueva.')}</td></tr>`;
        $('#hShown').textContent = list.length ? `Mostrando ${a + 1}–${a + slice.length} de ${list.length} ventas` : 'Mostrando 0 ventas';
        $('#hPager').innerHTML = ui.pager(list.length, F.page, size);
      }
      draw();

      $('#hQ').addEventListener('input', U.debounce(e => { F.q = e.target.value; F.page = 1; draw(); }, 120));
      $('#hFrom').addEventListener('change', e => { F.from = e.target.value; F.page = 1; draw(); });
      $('#hTo').addEventListener('change', e => { F.to = e.target.value; F.page = 1; draw(); });
      $('#hEmp').addEventListener('change', e => { F.emp = e.target.value; F.page = 1; draw(); });
      $('#hChips').addEventListener('click', e => {
        const b = e.target.closest('[data-m]'); if (!b) return; F.method = b.dataset.m; F.page = 1;
        el.querySelectorAll('#hChips .chip').forEach(c => c.classList.toggle('on', c === b)); draw();
      });
      el.addEventListener('click', e => {
        const t = e.target.closest('.th-sort');
        if (t) { const k = t.dataset.k; if (F.key === k) F.dir *= -1; else { F.key = k; F.dir = -1; } draw(); return; }
        const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { F.page = +pg.dataset.page; draw(); return; }
        const b = e.target.closest('#hBody [data-id]'); if (b) detail(S.sales().find(s => s.id === b.dataset.id));
      });
    }
  };

  function detail(s) {
    if (!s) return;
    const rows = s.lines.map(l => `<tr><td data-label="Producto"><strong>${U.esc(l.name)}</strong><small class="block mono">${U.esc(l.code)}</small></td><td data-label="Cant.">${l.qty}</td><td data-label="Precio">${U.money(l.price)}</td><td data-label="Subtotal"><strong>${U.money(l.price * l.qty)}</strong></td></tr>`).join('');
    ui.modal({
      title: 'Venta ' + s.id, subtitle: `${U.fmtDate(s.at)} · ${U.fmtTime(s.at)} · ${U.esc(s.empName)}`, size: 'md',
      body: `<div class="table-wrap"><table class="tbl compact stack"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table></div>
        <dl class="sum modal-sum">
          <div><dt>Subtotal</dt><dd>${U.money(s.subtotal)}</dd></div>
          ${s.discount ? `<div><dt>Descuento</dt><dd>− ${U.money(s.discount)}</dd></div>` : ''}
          <div class="grand"><dt>Total</dt><dd>${U.money(s.total)}</dd></div></dl>
        <div class="meta-line">${ui.methodBadge(s.method, s.bank)}
          ${s.method === 'transferencia' && s.ref ? `<span class="muted sm">Ref. ${U.esc(s.ref)}</span>` : ''}
          ${s.method === 'efectivo' ? `<span class="muted sm">Recibido ${U.money(s.received)} · cambio ${U.money(s.change)}</span>` : ''}</div>
        ${s.note ? `<p class="note-box"><strong>Nota:</strong> ${U.esc(s.note)}</p>` : ''}`,
      foot: `<button class="btn btn-primary" data-close>Cerrar</button>`
    });
  }
})();
