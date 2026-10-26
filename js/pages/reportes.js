/* REPORTES (pantalla 7): indicadores, gráfico por período, categorías, top productos, stock crítico y empleadas */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, ST = VJ.stats;
  const R = { period: 'semana', from: '', to: '', chart: 'bars' };

  /* "Esta semana" = últimos 7 días terminando hoy (así siempre hay datos que mostrar) */
  function range() {
    const n = new Date(), t0 = U.startOfDay(n); let from, to = U.addDays(t0, 1);
    if (R.period === 'hoy') from = t0;
    else if (R.period === 'semana') from = U.addDays(t0, -6);
    else if (R.period === 'mes') from = new Date(n.getFullYear(), n.getMonth(), 1);
    else if (R.period === 'trimestre') from = U.addDays(t0, -89);
    else { from = U.parseIso(R.from) || U.addDays(t0, -6); to = U.addDays(U.parseIso(R.to) || t0, 1); if (to <= from) to = U.addDays(from, 1); }
    const len = to - from;
    return { from, to, prevFrom: new Date(from - len), prevTo: from, days: Math.round(len / 864e5) };
  }

  function buckets(rg, sales) {
    const lab = [], val = [];
    if (rg.days === 1) {
      for (let h = 8; h <= 20; h += 2) {
        lab.push(h + 'h');
        val.push(ST.sum(sales.filter(s => { const x = new Date(s.at).getHours(); return x >= h && x < h + 2 || (h === 8 && x < 8) || (h === 20 && x >= 22); })));
      }
    } else if (rg.days <= 31) {
      for (let i = 0; i < rg.days; i++) {
        const d = U.addDays(rg.from, i);
        lab.push(rg.days <= 8 ? U.DOW_SHORT[d.getDay()] : String(d.getDate()));
        val.push(ST.sum(ST.day(sales, d)));
      }
    } else {
      for (let d = new Date(rg.from); d < rg.to; d = U.addDays(d, 7)) {
        lab.push(U.fmtDay(d)); val.push(ST.sum(ST.between(sales, d, U.addDays(d, 7))));
      }
    }
    return { lab, val };
  }

  VJ.pages.reportes = {
    meta: () => ({ crumb: ['Sistema', 'Reportes'], title: 'Reportes' }),

    render() {
      const rg = range(), pers = [['hoy', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes'], ['trimestre', 'Trimestre']];
      const last = U.addDays(rg.to, -1);
      return `
      <div class="toolbar free rep-bar">
        <div class="chips" id="rPer">${pers.map(p => `<button class="chip ${R.period === p[0] ? 'on' : ''}" data-p="${p[0]}">${p[1]}</button>`).join('')}</div>
        <div class="date-range"><input class="input" type="date" id="rFrom" value="${U.isoDate(rg.from)}" aria-label="Desde"><span>–</span><input class="input" type="date" id="rTo" value="${U.isoDate(last)}" aria-label="Hasta"></div>
        <span class="muted sm push-r" id="rLabel"></span>
        ${window.VJ_PREVIEW ? '' : `<button class="btn btn-sm" id="rPrint">${VJ.icon('download', 14)} Exportar PDF</button>`}
      </div>
      <div class="kpi-row k4" id="rKpis"></div>
      <div class="grid-2-1">
        <section class="card"><header class="card-head"><div><h3 class="serif-i">Ventas por período</h3><span class="muted sm" id="rSub"></span></div>
          <div class="seg sm" id="rChartSeg"><button class="${R.chart === 'bars' ? 'on' : ''}" data-c="bars">${VJ.icon('bars', 13)} Barras</button><button class="${R.chart === 'line' ? 'on' : ''}" data-c="line">${VJ.icon('trend', 13)} Línea</button></div></header>
          <div class="card-body"><div class="chart-box" id="rChart"></div></div></section>
        <section class="card"><header class="card-head"><div><h3 class="serif-i">Ventas por categoría</h3><span class="muted sm">% del total vendido</span></div></header>
          <div class="card-body donut-box" id="rDonut"></div></section>
      </div>
      <div class="grid-2-1">
        <section class="card"><header class="card-head"><div><h3 class="serif-i">Productos más vendidos</h3><span class="muted sm">Por unidades despachadas</span></div><span class="badge rose">Top 6</span></header>
          <ol class="top-list" id="rTop"></ol></section>
        <section class="card"><header class="card-head"><div><h3 class="serif-i"><span class="ico warn-i">${VJ.icon('alert', 15)}</span> Stock crítico</h3><span class="muted sm">Productos que requieren reabastecimiento</span></div></header>
          <div class="crit-list" id="rCrit"></div></section>
      </div>
      <section class="card"><header class="card-head"><div><h3 class="serif-i">Rendimiento por empleada</h3><span class="muted sm">Ventas registradas en el período seleccionado</span></div></header>
        <div class="emp-grid" id="rEmp"></div></section>`;
    },

    mount(el) {
      const $ = s => el.querySelector(s);

      function draw() {
        const rg = range(), sales = ST.between(S.sales(), rg.from, rg.to), prev = ST.between(S.sales(), rg.prevFrom, rg.prevTo);
        const orders = S.orders(), ord = ST.between(orders, rg.from, rg.to), ordP = ST.between(orders, rg.prevFrom, rg.prevTo);
        const crit = S.products().filter(p => S.status(p) !== 'disponible').sort((a, b) => (a.stock - a.min) - (b.stock - b.min));
        const last = U.addDays(rg.to, -1);
        $('#rLabel').textContent = 'Período: ' + (rg.days === 1 ? U.fmtDate(rg.from) : U.fmtDay(rg.from) + ' – ' + U.fmtDate(last));
        $('#rSub').textContent = rg.days === 1 ? U.fmtDate(rg.from) : U.fmtDay(rg.from) + ' – ' + U.fmtDate(last);
        $('#rFrom').value = U.isoDate(rg.from); $('#rTo').value = U.isoDate(last);

        $('#rKpis').innerHTML =
          ui.kpi({ icon: 'dollar', value: U.money(ST.sum(sales)), label: 'Ventas del período', sub: 'ingresos totales', extra: `<span class="kpi-corner">${ui.delta(ST.sum(sales), ST.sum(prev))}</span>` }) +
          ui.kpi({ icon: 'bag', tone: 'ok', value: ST.units(sales), label: 'Productos vendidos', sub: 'unidades despachadas', extra: `<span class="kpi-corner">${ui.delta(ST.units(sales), ST.units(prev))}</span>` }) +
          ui.kpi({ icon: 'file', tone: 'info', value: ord.length, label: 'Pedidos', sub: 'en el período', extra: `<span class="kpi-corner">${ui.delta(ord.length, ordP.length)}</span>` }) +
          ui.kpi({ icon: 'alert', tone: 'warn', value: crit.length, label: 'Stock bajo', sub: 'productos críticos', extra: '<span class="kpi-corner"><span class="badge warn xs">atención</span></span>' });

        const b = buckets(rg, sales);
        VJ.charts.fit($('#rChart'), w => R.chart === 'bars' ? VJ.charts.bars(w, 250, b.lab, b.val) : VJ.charts.line(w, 250, b.lab, b.val));

        let cats = ST.byCategory(sales);
        if (cats.length > 5) { const rest = cats.slice(5).reduce((a, c) => a + c.value, 0); cats = cats.slice(0, 5).concat([{ label: 'Otros', value: rest }]); }
        const dn = VJ.charts.donut(cats);
        $('#rDonut').innerHTML = sales.length ? `<div class="donut-wrap">${dn.svg}</div><ul class="legend-list">${dn.legend}</ul>` : ui.empty('bars', 'Sin ventas en el período', 'Elige otro rango de fechas.');

        const top = ST.topProducts(sales).sort((a, c) => c.units - a.units).slice(0, 6), mx = top.length ? top[0].units : 1;
        $('#rTop').innerHTML = top.length ? top.map((p, i) => `
          <li><span class="rank r${i}">${i + 1}</span><div class="top-main"><div class="top-row"><span class="tl"><strong>${U.esc(p.name)}</strong><small class="muted">${U.esc(p.cat)}</small></span><span class="tr"><strong>${p.units} un.</strong><small>${U.money(p.revenue)}</small></span></div>
            <div class="bar"><i class="r${Math.min(i, 3)}" style="width:${Math.round(p.units / mx * 100)}%"></i></div><small class="pct">${Math.round(p.units / mx * 100)}%</small></div></li>`).join('')
          : `<li class="mini-empty">Sin ventas en el período.</li>`;

        $('#rCrit').innerHTML = (crit.length ? crit.slice(0, 4).map(p => {
          const gap = p.min - p.stock, pc = Math.max(4, Math.min(100, Math.round(p.stock / Math.max(1, p.min) * 100)));
          return `<div class="crit ${p.stock <= 0 ? 'out' : ''}"><div class="crit-row"><div><strong>${U.esc(p.name)}</strong><small class="block muted">${U.esc(p.category)}</small></div><strong class="crit-n">${p.stock} / ${p.min}</strong></div>
            <div class="bar"><i class="warn" style="width:${pc}%"></i></div><small class="crit-gap">${VJ.icon('alert', 12)} ${gap > 0 ? U.plural(gap, 'ud. bajo el mínimo', 'uds. bajo el mínimo') : 'En el mínimo'}</small></div>`;
        }).join('') : '<p class="mini-empty">No hay productos críticos.</p>') + `<button class="btn btn-warn btn-block" data-go="inventario">Ver inventario completo →</button>`;

        const emps = ST.byEmployee(sales);
        $('#rEmp').innerHTML = emps.length ? emps.map(e => `<div class="emp-card">${ui.avatar(e.name, 'lg')}<div><strong>${U.esc(e.name)}</strong><small class="block muted">${U.plural(e.count, 'venta', 'ventas')}</small><strong class="serif-n">${U.money(e.total)}</strong></div></div>`).join('')
          : `<p class="mini-empty pad">Sin ventas en el período.</p>`;
      }
      draw();

      $('#rPer').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; R.period = b.dataset.p; el.querySelectorAll('#rPer .chip').forEach(c => c.classList.toggle('on', c === b)); draw(); });
      function custom() { R.period = 'custom'; R.from = $('#rFrom').value; R.to = $('#rTo').value; el.querySelectorAll('#rPer .chip').forEach(c => c.classList.remove('on')); draw(); }
      $('#rFrom').addEventListener('change', custom); $('#rTo').addEventListener('change', custom);
      $('#rChartSeg').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; R.chart = b.dataset.c; el.querySelectorAll('#rChartSeg button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      el.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) VJ.app.go(g.dataset.go); });
      const pr = $('#rPrint'); if (pr) pr.addEventListener('click', () => window.print());
    }
  };
})();
