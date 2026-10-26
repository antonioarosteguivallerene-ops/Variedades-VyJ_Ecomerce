/* Pantalla de INICIO (resumen del día). Es una sección nueva: usa los mismos componentes del prototipo. */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, ST = VJ.stats, cfg = VJ.config;

  function greeting() { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }

  VJ.pages.inicio = {
    meta: () => ({ crumb: ['Sistema', 'Inicio'], title: 'Inicio' }),

    render(ctx) {
      const now = new Date(), sales = S.sales(), orders = S.orders();
      const today = ST.day(sales, now), yest = ST.day(sales, U.addDays(now, -1));
      const week = ST.lastDays(sales, 7);
      const pend = orders.filter(o => o.status === 'pendiente');
      const low = S.products().filter(p => S.status(p) !== 'disponible').sort((a, b) => a.stock - b.stock);
      const isAdmin = ctx.user.role === 'admin';
      const first = ctx.user.role === 'admin' ? ctx.user.name : ctx.user.name.split(' ')[0];

      const recentSales = sales.slice().sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);
      const recentOrders = orders.slice().sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);

      const flowLabel = id => cfg.orderFlow.find(s => s.id === id).label;
      const flowTone = { pendiente: 'warn', confirmado: 'info', preparando: 'rose', listo: 'ok', entregado: 'neutral' };

      return `
      <section class="card hero">
        <div class="hero-txt">
          <span class="eyebrow">${U.esc(U.fmtWeekday(now))}</span>
          <h2 class="serif-i">${greeting()}, ${U.esc(first)}</h2>
          <p>${today.length
            ? `Hoy llevas <strong>${U.plural(today.length, 'venta', 'ventas')}</strong> por <strong>${U.money(ST.sum(today))}</strong>`
            : 'Todavía no hay ventas registradas hoy'}${pend.length ? ` y <strong>${U.plural(pend.length, 'pedido pendiente', 'pedidos pendientes')}</strong> por atender.` : '.'}</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" data-go="ventas">${VJ.icon('cart', 16)} Nueva venta</button>
          ${isAdmin ? `<button class="btn" data-go="productos">${VJ.icon('plus', 16)} Registrar producto</button>` : ''}
          <button class="btn" data-go="pedidos">${VJ.icon('file', 16)} Ver pedidos</button>
        </div>
      </section>

      <div class="kpi-row k4">
        ${ui.kpi({ icon: 'dollar', value: U.money(ST.sum(today)), label: 'Vendido hoy', sub: ui.delta(ST.sum(today), ST.sum(yest), 'vs ayer') })}
        ${ui.kpi({ icon: 'receipt', tone: 'ok', value: today.length, label: 'Ventas del día', sub: `${U.plural(ST.units(today), 'unidad', 'unidades')} vendidas` })}
        ${ui.kpi({ icon: 'file', tone: 'warn', value: pend.length, label: 'Pedidos pendientes', sub: 'requieren atención', attrs: ' data-go="pedidos" tabindex="0"', cls: 'link' })}
        ${ui.kpi({ icon: 'alert', tone: 'bad', value: low.length, label: 'Stock bajo o agotado', sub: `${low.filter(p => p.stock <= 0).length} agotados`, attrs: ' data-go="inventario" tabindex="0"', cls: 'link' })}
      </div>

      <div class="grid-2-1">
        <section class="card">
          <header class="card-head"><h3 class="serif-i">Ventas de los últimos 7 días</h3><span class="muted sm">${U.fmtDay(week[0].date)} – ${U.fmtDay(week[6].date)}</span></header>
          <div class="card-body"><div class="chart-box" id="homeChart"></div></div>
        </section>

        <section class="card">
          <header class="card-head"><h3 class="serif-i">Alertas de stock</h3><button class="link-btn" data-go="inventario">Ver inventario →</button></header>
          <ul class="mini-list">
            ${low.length ? low.slice(0, 5).map(p => `
              <li><span class="mini-main"><strong>${U.esc(p.name)}</strong><small class="mono">${U.esc(p.code)}</small></span>
                  <span class="mini-end">${ui.statusBadge(p)}<small>${p.stock}/${p.min} un.</small></span></li>`).join('')
              : `<li class="mini-empty">Todo el inventario está sobre el mínimo.</li>`}
          </ul>
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <header class="card-head"><h3 class="serif-i">Últimas ventas</h3><button class="link-btn" data-go="historial">Historial →</button></header>
          <ul class="mini-list">
            ${recentSales.map(s => `
              <li><span class="mini-main"><strong class="mono">${U.esc(s.id)}</strong><small>${U.esc(s.empName)} · ${U.sameDay(s.at, now) ? 'Hoy ' + U.fmtTime(s.at) : U.fmtDate(s.at)}</small></span>
                  <span class="mini-end"><strong class="serif-n">${U.money(s.total)}</strong>${ui.methodBadge(s.method)}</span></li>`).join('')}
          </ul>
        </section>
        <section class="card">
          <header class="card-head"><h3 class="serif-i">Pedidos recientes</h3><button class="link-btn" data-go="pedidos">Todos →</button></header>
          <ul class="mini-list">
            ${recentOrders.map(o => `
              <li><span class="mini-main"><strong>${U.esc(o.name)}</strong><small><span class="mono">${U.esc(o.id)}</span> · ${o.origin === 'online' ? 'Online' : 'Tienda'}</small></span>
                  <span class="mini-end"><strong class="serif-n">${U.money(S.orderTotal(o))}</strong><span class="badge dot ${flowTone[o.status]}">${flowLabel(o.status)}</span></span></li>`).join('')}
          </ul>
        </section>
      </div>

      ${isAdmin ? `<p class="foot-note">Los datos de esta demostración se guardan en este navegador. <button class="link-btn" id="resetDemo">Restablecer datos de ejemplo</button></p>` : ''}`;
    },

    mount(el) {
      el.addEventListener('click', e => {
        const g = e.target.closest('[data-go]'); if (g) VJ.app.go(g.dataset.go);
        if (e.target.closest('#resetDemo')) { S.reset(); ui.toast('Datos de ejemplo restablecidos.', 'info'); VJ.app.refresh(); }
      });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { const g = e.target.closest('[data-go]'); if (g) VJ.app.go(g.dataset.go); } });
      const week = ST.lastDays(S.sales(), 7);
      VJ.charts.fit(el.querySelector('#homeChart'), w => VJ.charts.bars(w, 230, week.map(d => U.DOW_SHORT[d.date.getDay()]), week.map(d => d.total)));
    }
  };
})();
