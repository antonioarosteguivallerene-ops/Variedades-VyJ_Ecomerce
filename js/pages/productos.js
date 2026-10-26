/* REGISTRAR / EDITAR PRODUCTO (pantalla 2 del prototipo) */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, cfg = VJ.config;
  let image = null;

  const opts = (list, val, ph) => `<option value="">${ph}</option>` + list.map(x => `<option ${x === val ? 'selected' : ''}>${U.esc(x)}</option>`).join('');
  const field = (id, label, inner, extra) => `<div class="field" id="fld-${id}"><label for="f-${id}">${label}</label>${inner}<small class="err-msg" hidden></small>${extra || ''}</div>`;

  /* reduce la imagen para no llenar el almacenamiento del navegador */
  function shrink(file, cb) {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 360, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => cb(null);
      img.src = fr.result;
    };
    fr.onerror = () => cb(null);
    fr.readAsDataURL(file);
  }

  VJ.pages.productos = {
    meta(ctx) {
      const e = !!ctx.params.edit;
      return { crumb: ['Productos', e ? 'Editar producto' : 'Registrar producto'], title: e ? 'Editar producto' : 'Registrar producto' };
    },

    render(ctx) {
      const p = ctx.params.edit ? S.product(ctx.params.edit) : null;
      image = p ? p.image : null;
      const v = p || { code: '', name: '', category: '', brand: '', size: '', color: '', cost: '', price: '', stock: '', min: '', supplier: '' };
      const sym = cfg.currency.symbol;
      return `
      <form id="pform" novalidate autocomplete="off">
        <section class="card form-card">
          <header class="card-head"><span class="ico">${VJ.icon('info', 16)}</span><h3>Información básica</h3></header>
          <div class="form-grid">
            ${field('code', 'Código del producto', `<input class="input" id="f-code" value="${U.esc(v.code)}" placeholder="Ej. ${U.nextCode(S.products())}" maxlength="20">`)}
            ${field('name', 'Nombre del producto', `<input class="input" id="f-name" value="${U.esc(v.name)}" placeholder="Ej. Blusa floral manga corta" maxlength="60">`)}
            ${field('cat', 'Categoría', `<select class="select" id="f-cat">${opts(cfg.categories, v.category, 'Seleccionar categoría')}</select>`)}
            ${field('brand', 'Marca', `<input class="input" id="f-brand" value="${U.esc(v.brand)}" placeholder="Ej. Studio F, Bershka" maxlength="40">`)}
            ${field('size', 'Talla', `<select class="select" id="f-size">${opts(cfg.sizes, v.size, 'Seleccionar talla')}</select>`)}
            ${field('color', 'Color', `<select class="select" id="f-color">${opts(cfg.colors, v.color, 'Seleccionar color')}</select>`)}
          </div>
        </section>

        <section class="card form-card">
          <header class="card-head"><span class="ico">${VJ.icon('dollar', 16)}</span><h3>Precios e inventario</h3></header>
          <div class="form-grid">
            ${field('cost', `Precio de compra (${sym})`, `<div class="money-input"><span>${sym}</span><input class="input" id="f-cost" type="number" min="0" step="any" inputmode="decimal" value="${v.cost}" placeholder="0"></div>`)}
            ${field('price', `Precio de venta (${sym})`, `<div class="money-input"><span>${sym}</span><input class="input" id="f-price" type="number" min="0" step="any" inputmode="decimal" value="${v.price}" placeholder="0"></div>`, '<small class="hint" id="marginHint"></small>')}
            ${field('stock', p ? 'Stock actual' : 'Stock inicial', `<input class="input" id="f-stock" type="number" min="0" step="1" inputmode="numeric" value="${v.stock}" placeholder="Ej. 50">`)}
            ${field('min', 'Stock mínimo', `<input class="input" id="f-min" type="number" min="0" step="1" inputmode="numeric" value="${v.min}" placeholder="Ej. 10">`)}
            ${field('supplier', 'Proveedor', `<input class="input" id="f-supplier" value="${U.esc(v.supplier)}" placeholder="Nombre del proveedor" maxlength="60">`)}
          </div>
        </section>

        <section class="card form-card">
          <header class="card-head"><span class="ico">${VJ.icon('image', 16)}</span><h3>Imagen del producto</h3></header>
          <div class="card-body"><div id="dropzone"></div></div>
        </section>

        <div class="form-actions">
          <button type="button" class="btn" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${VJ.icon('save', 16)} ${p ? 'Guardar cambios' : 'Guardar producto'}</button>
        </div>
      </form>`;
    },

    mount(el, ctx) {
      const editId = ctx.params.edit, $ = s => el.querySelector(s);
      const zone = $('#dropzone');

      function drawZone() {
        zone.innerHTML = image
          ? `<div class="drop has-img"><img src="${image}" alt="Vista previa del producto"><div class="drop-side"><strong>Imagen cargada</strong><div class="row-gap"><button type="button" class="btn btn-sm" id="chgImg">Cambiar</button><button type="button" class="btn btn-sm btn-danger" id="delImg">Quitar</button></div></div></div>`
          : `<button type="button" class="drop" id="dropBtn"><span class="drop-ico">${VJ.icon('upload', 20)}</span><strong>Haz clic para subir una imagen</strong><small>PNG, JPG o WEBP · máx. 5 MB</small></button>`;
        zone.insertAdjacentHTML('beforeend', '<input type="file" id="fileIn" accept="image/png,image/jpeg,image/webp" hidden>');
      }
      drawZone();

      function take(file) {
        if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return ui.toast('Formato no permitido. Usa PNG, JPG o WEBP.', 'err');
        if (file.size > 5 * 1024 * 1024) return ui.toast('La imagen supera los 5 MB.', 'err');
        shrink(file, d => { if (!d) return ui.toast('No se pudo leer la imagen.', 'err'); image = d; drawZone(); });
      }
      zone.addEventListener('click', e => {
        if (e.target.closest('#dropBtn,#chgImg')) $('#fileIn').click();
        if (e.target.closest('#delImg')) { image = null; drawZone(); }
      });
      zone.addEventListener('change', e => { if (e.target.id === 'fileIn') take(e.target.files[0]); });
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('over'));
      zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); take(e.dataTransfer.files[0]); });

      /* margen en vivo */
      function margin() {
        const c = parseFloat($('#f-cost').value), p = parseFloat($('#f-price').value), h = $('#marginHint');
        if (p > 0 && c >= 0) { const g = p - c; h.textContent = 'Ganancia ' + U.money(g) + ' · margen ' + Math.round(g / p * 100) + '%'; h.className = 'hint ' + (g >= 0 ? 'ok' : 'bad'); }
        else h.textContent = '';
      }
      $('#f-cost').addEventListener('input', margin); $('#f-price').addEventListener('input', margin); margin();

      $('#cancelBtn').addEventListener('click', () => VJ.app.go('inventario'));

      function err(id, msg) {
        const f = $('#fld-' + id), m = f.querySelector('.err-msg');
        f.classList.toggle('err', !!msg); m.hidden = !msg; m.textContent = msg || '';
        return !msg;
      }
      el.querySelectorAll('.input,.select').forEach(i => i.addEventListener('input', () => { const f = i.closest('.field'); if (f) { f.classList.remove('err'); f.querySelector('.err-msg').hidden = true; } }));

      $('#pform').addEventListener('submit', e => {
        e.preventDefault();
        const g = id => $('#f-' + id).value.trim();
        const d = { code: g('code'), name: g('name'), category: g('cat'), brand: g('brand'), size: g('size'), color: g('color'),
          cost: parseFloat(g('cost')) || 0, price: parseFloat(g('price')), stock: parseInt(g('stock'), 10), min: parseInt(g('min'), 10), supplier: g('supplier'), image };
        let ok = true;
        ok = err('code', d.code ? '' : 'Escribe un código.') && ok;
        ok = err('name', d.name ? '' : 'Escribe el nombre.') && ok;
        ok = err('cat', d.category ? '' : 'Selecciona una categoría.') && ok;
        ok = err('price', d.price > 0 ? '' : 'El precio de venta debe ser mayor que 0.') && ok;
        ok = err('stock', d.stock >= 0 ? '' : 'Indica el stock.') && ok;
        ok = err('min', d.min >= 0 ? '' : 'Indica el stock mínimo.') && ok;
        if (!ok) { const bad = el.querySelector('.field.err input,.field.err select'); if (bad) bad.focus(); return; }

        const r = editId ? S.updateProduct(editId, d) : S.addProduct(d);
        if (r.error) { err('code', r.error); return ui.toast(r.error, 'err'); }
        ui.toast(editId ? 'Producto actualizado.' : 'Producto guardado en el inventario.');
        VJ.app.go('inventario');
      });
    }
  };
})();
