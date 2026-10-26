/* ==========================================================
   DATOS DE EJEMPLO (solo para demostración)
   Basados en las pantallas del prototipo. Las fechas se calculan
   respecto al día en que se carga la app, para que "Hoy" siempre tenga ventas.
   Para restablecerlos: botón al final de Inicio (administrador).
   ========================================================== */
(function () {
  const VJ = window.VJ = window.VJ || {};

  VJ.seed = function (now) {
    const day0 = new Date(now); day0.setHours(0, 0, 0, 0);

    /* hoy: minutos hacia atrás desde ahora; otros días: hora fija */
    const ago = m => new Date(Math.max(day0.getTime() + 60000, now.getTime() - m * 60000)).toISOString();
    const at = (days, hhmm) => {
      const d = new Date(day0); d.setDate(d.getDate() - days);
      const [h, m] = hhmm.split(':').map(Number); d.setHours(h, m, 0, 0);
      return d.toISOString();
    };

    /* código, nombre, categoría, marca, tallas, color, precio venta, stock, mínimo, proveedor */
    const raw = [
      ['VJ-001', 'Blusa floral manga corta', 'Blusas', 'Casa Jesly', 'S/M/L', 'Rosado', 65000, 42, 10, 'Distribuidora Aurora'],
      ['VJ-002', 'Vestido midi satinado', 'Vestidos', 'Maison Rosé', 'S/M', 'Champán', 120000, 7, 8, 'Importadora Mares'],
      ['VJ-003', 'Pantalón palazzo lino', 'Pantalones', 'Nórdica', 'S/M/L/XL', 'Beige', 98000, 0, 5, 'Textiles del Pacífico'],
      ['VJ-004', 'Falda plisada midi', 'Faldas', 'Línea Aurora', 'XS/S/M', 'Negro', 68000, 28, 8, 'Distribuidora Aurora'],
      ['VJ-005', 'Chaqueta blazer entallada', 'Chaquetas', 'Atelier 21', 'M/L', 'Gris', 155000, 4, 5, 'Importadora Mares'],
      ['VJ-006', 'Blusa off-shoulder encaje', 'Blusas', 'Casa Jesly', 'XS/S/M', 'Blanco', 52000, 15, 6, 'Distribuidora Aurora'],
      ['VJ-007', 'Vestido floral maxi', 'Vestidos', 'Maison Rosé', 'S/M/L', 'Multicolor', 145000, 0, 4, 'Importadora Mares'],
      ['VJ-008', 'Zapato taco stiletto', 'Calzado', 'Paso Fino', '35-41', 'Rosado', 185000, 12, 6, 'Calzado Fino S.A.'],
      ['VJ-009', 'Bolso clutch dorado', 'Accesorios', 'Accesorios Luna', 'Única', 'Dorado', 78000, 6, 4, 'Accesorios Luna'],
      ['VJ-010', 'Top crop tejido crochet', 'Blusas', 'Línea Aurora', 'XS/S', 'Lila', 72000, 3, 5, 'Textiles del Pacífico'],
      ['VJ-011', 'Pantalón recto pinzas', 'Pantalones', 'Nórdica', 'XS/S/M/L', 'Negro', 89000, 31, 10, 'Textiles del Pacífico'],
      ['VJ-012', 'Collar perlas multicapa', 'Accesorios', 'Accesorios Luna', 'Única', 'Blanco', 35000, 0, 3, 'Accesorios Luna'],
      ['VJ-013', 'Vestido cocktail lentejuelas', 'Vestidos', 'Maison Rosé', 'XS/S/M', 'Negro', 210000, 9, 4, 'Importadora Mares'],
      ['VJ-014', 'Sandalia plataforma trenzada', 'Calzado', 'Paso Fino', '35-41', 'Camel', 132000, 5, 6, 'Calzado Fino S.A.'],
      ['VJ-015', 'Bralette encaje floral', 'Ropa interior', 'Casa Jesly', 'XS/S/M/L', 'Rosado', 42000, 22, 8, 'Distribuidora Aurora']
    ];
    const products = raw.map(r => ({
      id: r[0], code: r[0], name: r[1], category: r[2], brand: r[3], size: r[4], color: r[5],
      price: r[6], cost: Math.round(r[6] * 0.55 / 1000) * 1000,
      stock: r[7], min: r[8], supplier: r[9], image: null, createdAt: at(40, '09:00')
    }));
    const P = code => products.find(p => p.code === code);
    const line = (code, qty) => ({ code, name: P(code).name, cat: P(code).category, price: P(code).price, qty });

    /* ---------- ventas (hoy = 5, con el total del prototipo: 874.000) ---------- */
    const S = [
      // [fecha ISO, empleada, método, banco, referencia, líneas, nota]
      [ago(45),  'Juliana Pérez', 'efectivo', '', '', [line('VJ-011', 1)]],
      [ago(130), 'Laura Gómez', 'transferencia', 'Banpro', '40918822', [line('VJ-005', 1)]],
      [ago(200), 'Camila Torres', 'efectivo', '', '', [line('VJ-011', 1), line('VJ-009', 1), line('VJ-001', 2)]],
      [ago(260), 'Diana Ruiz', 'transferencia', 'BAC', '77120934', [line('VJ-002', 1)]],
      [ago(330), 'Laura Gómez', 'efectivo', '', '', [line('VJ-011', 1), line('VJ-006', 1), line('VJ-010', 1)]],
      [at(1, '15:02'), 'Juliana Pérez', 'transferencia', 'Lafise', '55210877', [line('VJ-013', 1)]],
      [at(1, '13:40'), 'Laura Gómez', 'efectivo', '', '', [line('VJ-015', 1), line('VJ-003', 1), line('VJ-012', 1)]],
      [at(1, '11:15'), 'Camila Torres', 'transferencia', 'BDF', '30044512', [line('VJ-009', 1)]],
      [at(2, '17:20'), 'Laura Gómez', 'efectivo', '', '', [line('VJ-005', 1), line('VJ-006', 1)]],
      [at(2, '12:05'), 'Diana Ruiz', 'transferencia', 'Banpro', '40918377', [line('VJ-008', 1)]],
      [at(3, '16:10'), 'Camila Torres', 'efectivo', '', '', [line('VJ-014', 1), line('VJ-012', 1)]],
      [at(3, '10:30'), 'Juliana Pérez', 'transferencia', 'BAC', '77120102', [line('VJ-013', 1), line('VJ-015', 1)]],
      [at(4, '15:45'), 'Laura Gómez', 'efectivo', '', '', [line('VJ-002', 1), line('VJ-004', 1)]],
      [at(4, '11:00'), 'Camila Torres', 'transferencia', 'BDF', '30044199', [line('VJ-008', 1), line('VJ-001', 1)]],
      [at(5, '14:20'), 'Diana Ruiz', 'efectivo', '', '', [line('VJ-011', 2)]],
      [at(5, '10:10'), 'Juliana Pérez', 'efectivo', '', '', [line('VJ-013', 1)]],
      [at(6, '16:30'), 'Laura Gómez', 'transferencia', 'Lafise', '55210301', [line('VJ-007', 1)]],
      [at(6, '13:00'), 'Juliana Pérez', 'efectivo', '', '', [line('VJ-005', 1), line('VJ-009', 1)]]
    ];
    /* ---------- historial generado (reproducible) para que Mes y Trimestre tengan datos ---------- */
    let seedN = 20261021;
    const rnd = () => { seedN |= 0; seedN = seedN + 0x6D2B79F5 | 0; let t = Math.imul(seedN ^ seedN >>> 15, 1 | seedN); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const staff = VJ.config.users.filter(u => u.role === 'empleado').map(u => u.name);
    for (let d = 7; d <= 90; d++) {
      const n = d <= 30 ? 1 + Math.floor(rnd() * 3) : (rnd() < 0.55 ? 1 : 2);
      for (let k = 0; k < n; k++) {
        const hh = 9 + Math.floor(rnd() * 9), mm = String(Math.floor(rnd() * 60)).padStart(2, '0');
        const cnt = 1 + Math.floor(rnd() * 3), used = new Set(), lines = [];
        while (lines.length < cnt) { const p = pick(products); if (used.has(p.code)) continue; used.add(p.code); lines.push(line(p.code, rnd() < 0.2 ? 2 : 1)); }
        const cash = rnd() < 0.55;
        S.push([at(d, hh + ':' + mm), pick(staff), cash ? 'efectivo' : 'transferencia', cash ? '' : pick(VJ.config.banks), cash ? '' : String(10000000 + Math.floor(rnd() * 89999999)), lines]);
      }
    }
    const sales = S.slice().sort((a, b) => new Date(a[0]) - new Date(b[0])).map((s, i) => {
      const subtotal = s[5].reduce((a, l) => a + l.price * l.qty, 0);
      return {
        id: 'VJ-' + (10021 + i), at: s[0], empName: s[1], method: s[2], bank: s[3], ref: s[4],
        lines: s[5], subtotal, discount: 0, total: subtotal,
        received: s[2] === 'efectivo' ? Math.ceil(subtotal / 10000) * 10000 : 0,
        change: s[2] === 'efectivo' ? Math.ceil(subtotal / 10000) * 10000 - subtotal : 0, note: ''
      };
    });

    /* ---------- pedidos ---------- */
    const ol = (code, qty, size, color) => ({ code, name: P(code).name, price: P(code).price, qty, size, color });
    const O = [
      ['PED-0050', 'Luisa Fernández', 'tienda', 'entregado', at(4, '13:00'), '8774 6601', '', false, [ol('VJ-006', 1, 'S', 'Blanco'), ol('VJ-015', 1, 'S', 'Rosado')]],
      ['PED-0051', 'Daniela Pinto', 'online', 'entregado', at(3, '10:30'), '8855 2031', 'Granada, barrio Xalteva, de la iglesia 2 cuadras al lago', false, [ol('VJ-013', 1, 'M', 'Negro')]],
      ['PED-0052', 'Alejandra Torres', 'tienda', 'entregado', at(2, '16:45'), '8120 4477', '', false, [ol('VJ-009', 1, 'Única', 'Dorado'), ol('VJ-006', 1, 'XS', 'Blanco'), ol('VJ-015', 1, 'S', 'Rosado')]],
      ['PED-0053', 'Camila Jiménez', 'online', 'entregado', at(1, '09:15'), '8390 1822', 'Masaya, Reparto Monimbó, casa 14', false, [ol('VJ-005', 1, 'L', 'Gris')]],
      ['PED-0054', 'Natalia Vargas', 'online', 'listo', at(1, '14:22'), '8611 7305', 'León, Reparto Sutiaba, frente a la parada', true, [ol('VJ-013', 1, 'S', 'Negro'), ol('VJ-014', 1, '38', 'Camel')]],
      ['PED-0055', 'Sofía Herrera', 'tienda', 'listo', ago(240), '8450 2290', '', false, [ol('VJ-011', 1, 'M', 'Negro')]],
      ['PED-0056', 'Isabella Mora', 'online', 'preparando', ago(180), '8702 9914', 'Managua, Altamira, del Colegio Calasanz 1 c. arriba', true, [ol('VJ-008', 1, '37', 'Rosado'), ol('VJ-014', 1, '38', 'Camel')]],
      ['PED-0057', 'Mariana Castillo', 'tienda', 'confirmado', ago(150), '8333 1048', '', false, [ol('VJ-002', 1, 'M', 'Champán')]],
      ['PED-0058', 'Valentina Ríos', 'online', 'pendiente', ago(95), '8264 5530', 'Managua, Villa Fontana, rotonda 1 c. al sur', true, [ol('VJ-005', 1, 'M', 'Gris'), ol('VJ-004', 1, 'S', 'Negro'), ol('VJ-015', 1, 'S', 'Rosado')]]
    ];
    /* pedidos antiguos ya entregados, para los reportes de mes y trimestre */
    const names = ['Fátima Lacayo', 'Yadira Mendoza', 'Karla Obando', 'Martha Sevilla', 'Elena Cuadra', 'Rosa Baltodano', 'Ivania Solís', 'Lucía Zeledón', 'Jessica Altamirano', 'Marlene Rizo', 'Gabriela Montoya', 'Ana Lorío'];
    const where = ['Managua, Altamira, del Colegio Calasanz 1 c. arriba', 'Masaya, Reparto Monimbó, casa 14', 'Granada, barrio Xalteva, de la iglesia 2 cuadras al lago', 'León, Reparto Sutiaba, frente a la parada', 'Managua, Villa Fontana, rotonda 1 c. al sur', 'Managua, Carretera Sur km 7'];
    const sz = p => p.size.includes('/') ? pick(p.size.split('/')) : (p.size === '35-41' ? '38' : p.size);
    names.forEach((nm, i) => {
      const online = rnd() < 0.6, a = pick(products), b = pick(products);
      const lns = a === b ? [ol(a.code, 1, sz(a), a.color)] : [ol(a.code, 1, sz(a), a.color), ol(b.code, 1, sz(b), b.color)];
      O.push(['PED-' + String(49 - i).padStart(4, '0'), nm, online ? 'online' : 'tienda', 'entregado', at(8 + i * 5, '12:00'),
        '8' + String(100 + Math.floor(rnd() * 899)) + ' ' + String(1000 + Math.floor(rnd() * 8999)), online ? pick(where) : '', false, lns]);
    });
    const orders = O.map(o => ({
      id: o[0], name: o[1], origin: o[2], status: o[3], at: o[4], phone: o[5], address: o[6], priority: o[7],
      lines: o[8], stockDeducted: o[3] !== 'pendiente'
    }));

    return { products, sales, orders, seededAt: now.toISOString() };
  };
})();
