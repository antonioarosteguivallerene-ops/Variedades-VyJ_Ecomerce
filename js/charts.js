/* Gráficos en SVG hechos a mano (sin librerías). Los colores salen de css/tokens.css */
(function () {
  const VJ = window.VJ = window.VJ || {};
  const U = VJ.u;
  let uid = 0;

  function scale(max) {
    if (!(max > 0)) return { top: 1, ticks: [0, 1] };
    const rough = max / 4, mag = Math.pow(10, Math.floor(Math.log10(rough))), n = rough / mag;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    const top = Math.ceil(max / step) * step, ticks = [];
    for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
    return { top, ticks };
  }

  function frame(w, h, labels, values) {
    const pad = { l: 46, r: 10, t: 12, b: 26 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const sc = scale(Math.max.apply(null, values.concat([0])));
    const y = v => pad.t + ih - (v / sc.top) * ih;
    const band = iw / labels.length;
    const x = i => pad.l + band * i + band / 2;
    let g = '';
    sc.ticks.forEach(t => {
      g += `<line class="ch-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${y(t)}" y2="${y(t)}"/>` +
           `<text class="ch-axis" x="${pad.l - 8}" y="${y(t) + 3.5}" text-anchor="end">${U.moneyShort(t)}</text>`;
    });
    const every = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 44)));
    labels.forEach((l, i) => {
      if (i % every === 0) g += `<text class="ch-axis" x="${x(i)}" y="${h - 8}" text-anchor="middle">${U.esc(l)}</text>`;
    });
    return { pad, iw, ih, sc, y, x, band, grid: g };
  }

  const C = VJ.charts = {
    bars(w, h, labels, values) {
      const f = frame(w, h, labels, values), bw = Math.max(6, Math.min(42, f.band * 0.5));
      const bars = values.map((v, i) => {
        const top = f.y(v), hh = Math.max(0, f.pad.t + f.ih - top);
        return `<g class="ch-g"><rect class="ch-hit" x="${f.x(i) - f.band / 2}" y="${f.pad.t}" width="${f.band}" height="${f.ih}"/>` +
               `<rect class="ch-bar" style="animation-delay:${i * 35}ms" x="${f.x(i) - bw / 2}" y="${top}" width="${bw}" height="${hh}" rx="4"/>` +
               `<title>${U.esc(labels[i])}: ${U.money(v)}</title></g>`;
      }).join('');
      return `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Ventas por período">${f.grid}${bars}</svg>`;
    },

    line(w, h, labels, values) {
      const f = frame(w, h, labels, values), id = 'lg' + (++uid);
      const pts = values.map((v, i) => [f.x(i), f.y(v)]);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const base = f.pad.t + f.ih;
      const area = d + ` L${pts[pts.length - 1][0].toFixed(1)} ${base} L${pts[0][0].toFixed(1)} ${base} Z`;
      const dots = pts.map((p, i) => `<circle class="ch-dot${i === pts.length - 1 ? ' last' : ''}" cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 4.5 : 3}"><title>${U.esc(labels[i])}: ${U.money(values[i])}</title></circle>`).join('');
      return `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Ventas por período">` +
        `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rose-400);stop-opacity:.38"/><stop offset="1" style="stop-color:var(--rose-400);stop-opacity:0"/></linearGradient></defs>` +
        `${f.grid}<path d="${area}" fill="url(#${id})"/><path class="ch-line" d="${d}"/>${dots}</svg>`;
    },

    /* items: [{label, value}] -> { svg, legend } */
    donut(items) {
      const total = items.reduce((a, i) => a + i.value, 0), r = 54, c = 2 * Math.PI * r;
      let off = 0, arcs = '';
      if (total > 0) items.forEach((it, i) => {
        const len = it.value / total * c;
        arcs += `<circle class="ch-arc" cx="80" cy="80" r="${r}" fill="none" stroke="var(--cat-${i % 6 + 1})" stroke-width="24" stroke-dasharray="${Math.max(0, len - 2).toFixed(2)} ${(c - Math.max(0, len - 2)).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 80 80)"><title>${U.esc(it.label)}: ${Math.round(it.value / total * 100)}%</title></circle>`;
        off += len;
      });
      else arcs = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--line)" stroke-width="24"/>`;
      const svg = `<svg class="donut" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Ventas por categoría">${arcs}</svg>`;
      const legend = items.map((it, i) =>
        `<li><span class="sw" style="background:var(--cat-${i % 6 + 1})"></span><span class="lg-name">${U.esc(it.label)}</span><strong>${total ? Math.round(it.value / total * 100) : 0}%</strong></li>`).join('');
      return { svg, legend };
    },

    /* mini gráfica de tendencia para las tarjetas */
    spark(values, tone) {
      const w = 96, h = 36, p = 3, max = Math.max.apply(null, values.concat([1])), min = Math.min.apply(null, values.concat([0]));
      const span = max - min || 1, id = 'sp' + (++uid);
      const pts = values.map((v, i) => [p + i * (w - 2 * p) / Math.max(1, values.length - 1), h - p - (v - min) / span * (h - 2 * p)]);
      const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
      const last = pts[pts.length - 1];
      return `<svg class="spark ${tone || ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">` +
        `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>` +
        `<path d="${d} L${last[0]} ${h} L${pts[0][0]} ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle cx="${last[0]}" cy="${last[1]}" r="2.4" fill="currentColor"/></svg>`;
    },

    /* dibuja con el ancho real del contenedor y se redibuja al cambiar de tamaño */
    fit(el, draw) {
      const run = () => { el.innerHTML = draw(Math.max(260, Math.floor(el.clientWidth))); };
      run();
      if (window.ResizeObserver) {
        let last = el.clientWidth;
        const ro = new ResizeObserver(() => {
          if (!el.isConnected) { ro.disconnect(); return; }
          if (Math.abs(el.clientWidth - last) > 8) { last = el.clientWidth; run(); }
        });
        ro.observe(el);
      }
    }
  };
})();
