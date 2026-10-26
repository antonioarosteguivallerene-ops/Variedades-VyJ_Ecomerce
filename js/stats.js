/* Cálculos reutilizables (inicio, historial y reportes) */
(function () {
  const VJ = window.VJ = window.VJ || {};
  const U = VJ.u;

  const st = VJ.stats = {
    sum: s => s.reduce((a, x) => a + x.total, 0),
    units: s => s.reduce((a, x) => a + x.lines.reduce((b, l) => b + l.qty, 0), 0),
    between: (arr, from, to) => arr.filter(x => { const t = new Date(x.at); return t >= from && t < to; }),
    day: (arr, d) => st.between(arr, U.startOfDay(d), U.addDays(U.startOfDay(d), 1)),

    /* últimos n días terminando hoy: [{date, total, count}] */
    lastDays(sales, n) {
      const t0 = U.startOfDay(new Date()), out = [];
      for (let i = n - 1; i >= 0; i--) {
        const d = U.addDays(t0, -i), s = st.day(sales, d);
        out.push({ date: d, total: st.sum(s), count: s.length });
      }
      return out;
    },

    /* agrupa líneas vendidas por producto */
    topProducts(sales) {
      const m = {};
      sales.forEach(s => s.lines.forEach(l => {
        const k = l.code; m[k] = m[k] || { code: k, name: l.name, cat: l.cat, units: 0, revenue: 0 };
        m[k].units += l.qty; m[k].revenue += l.qty * l.price;
      }));
      return Object.values(m).sort((a, b) => b.revenue - a.revenue);
    },
    byCategory(sales) {
      const m = {};
      sales.forEach(s => s.lines.forEach(l => { const c = l.cat || 'Otros'; m[c] = (m[c] || 0) + l.qty * l.price; }));
      return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    },
    byEmployee(sales) {
      const m = {};
      sales.forEach(s => { m[s.empName] = m[s.empName] || { name: s.empName, count: 0, total: 0 }; m[s.empName].count++; m[s.empName].total += s.total; });
      return Object.values(m).sort((a, b) => b.total - a.total);
    }
  };
})();
