/* APP: inicio de sesión, estructura (menú + barra superior), navegación y tema */
(function () {
  const VJ = window.VJ, U = VJ.u, ui = VJ.ui, S = VJ.store, cfg = VJ.config;
  const state = { user: null, route: 'inicio', params: {} };
  let clockTimer = null, suppressHash = false;

  const NAV = [
    { id: 'inicio', icon: 'home', label: 'Inicio' },
    { id: 'productos', icon: 'box', label: 'Productos' },
    { id: 'inventario', icon: 'stock', label: 'Inventario' },
    { id: 'ventas', icon: 'dollar', label: 'Ventas', kids: [['ventas', 'Nueva venta'], ['historial', 'Historial']] },
    { id: 'pedidos', icon: 'file', label: 'Pedidos' },
    { id: 'reportes', icon: 'bars', label: 'Reportes' }
  ];
  const $app = () => document.getElementById('app');

  /* ---------- almacenamiento de sesión y tema (con tolerancia a fallos) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* noop */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } }
  };
  function savedUser() {
    const email = store.get(cfg.sessionKey);
    return cfg.users.find(u => u.email === email) || null;
  }
  function applyTheme(t) {
    const r = document.documentElement;
    if (t === 'dark' || t === 'light') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme');
  }
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function toggleTheme() {
    const t = isDark() ? 'light' : 'dark';
    applyTheme(t); store.set(cfg.themeKey, t);
    const b = document.getElementById('themeBtn'); if (b) b.innerHTML = VJ.icon(isDark() ? 'sun' : 'moon', 18);
    VJ.app.refresh();
  }

  /* ---------- LOGIN (pantalla 1) ---------- */
  function renderLogin() {
    clearInterval(clockTimer);
    $app().innerHTML = `
      <main class="login">
        <button class="icon-btn login-theme" id="themeBtn" aria-label="Cambiar tema">${VJ.icon(isDark() ? 'sun' : 'moon', 18)}</button>
        <form class="login-card" id="loginForm" novalidate>
          <div class="login-logo">${VJ.icon('mountain', 26)}</div>
          <h1 class="login-brand">${U.esc(cfg.store.name)}</h1>
          <p class="login-tag">${U.esc(cfg.store.tagline).toUpperCase()}</p>
          <div class="divider"><i></i></div>
          <h2 class="serif-i login-h">Iniciar sesión</h2>
          <div class="field"><label for="lUser">Usuario o correo electrónico</label><input class="input" id="lUser" autocomplete="username" placeholder="nombre@variedadesjesly.com" autofocus></div>
          <div class="field"><label for="lPass">Contraseña</label>
            <div class="pass"><input class="input" id="lPass" type="password" autocomplete="current-password" placeholder="••••••••"><button type="button" class="eye" id="lEye" aria-label="Mostrar contraseña">${VJ.icon('eye', 17)}</button></div></div>
          <p class="login-err" id="lErr" role="alert" hidden></p>
          <button type="button" class="forgot" id="lForgot">¿Olvidaste tu contraseña?</button>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Iniciar sesión</button>
          <p class="login-foot">Acceso exclusivo para <strong>Administrador</strong> y <strong>Empleado</strong></p>
        </form>
        ${cfg.demo.showCredentials ? `<aside class="demo-box"><strong>Cuentas de prueba</strong>
          <button type="button" data-fill="admin"><span>Administrador</span><code>admin@jesly.com</code><code>admin123</code></button>
          <button type="button" data-fill="empleado"><span>Empleado</span><code>empleado@jesly.com</code><code>empleado123</code></button></aside>` : ''}
      </main>`;
    const $ = s => $app().querySelector(s);
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#lEye').addEventListener('click', () => {
      const i = $('#lPass'), show = i.type === 'password'; i.type = show ? 'text' : 'password';
      $('#lEye').innerHTML = VJ.icon(show ? 'eyeoff' : 'eye', 17); $('#lEye').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
    $('#lForgot').addEventListener('click', () => ui.toast('Pide al administrador que restablezca tu contraseña.', 'info'));
    $app().querySelectorAll('[data-fill]').forEach(b => b.addEventListener('click', () => {
      const u = cfg.users.find(x => x.username === b.dataset.fill); $('#lUser').value = u.email; $('#lPass').value = u.password; $('#lErr').hidden = true;
    }));
    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const id = $('#lUser').value.trim().toLowerCase(), pw = $('#lPass').value;
      const u = cfg.users.find(x => (x.email === id || x.username === id) && x.password === pw);
      const err = $('#lErr');
      if (!u) {
        err.hidden = false; err.textContent = id && pw ? 'Usuario o contraseña incorrectos.' : 'Escribe tu usuario y contraseña.';
        const c = $('#loginForm'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); return;
      }
      state.user = u; store.set(cfg.sessionKey, u.email);
      boot(location.hash.replace('#', ''));
    });
  }

  /* ---------- ESTRUCTURA ---------- */
  function allowed(r) { return cfg.access[state.user.role].includes(r); }

  function renderShell() {
    const u = state.user;
    $app().innerHTML = `
      <div class="app" id="shell">
        <aside class="sidebar" id="sidebar">
          <div class="side-brand"><div class="logo-dot">${VJ.icon('mountain', 18)}</div>
            <div class="brand-txt"><strong>${U.esc(cfg.store.name)}</strong><span>${U.esc(cfg.store.short)}</span></div>
            <button class="icon-btn ghost collapse-btn" id="collapseBtn" aria-label="Contraer menú">${VJ.icon('menu', 16)}</button></div>
          <nav class="side-nav" id="sideNav" aria-label="Principal"></nav>
          <div class="side-user"><span class="av av-2">${U.esc(u.role === 'admin' ? 'A' : 'E')}</span>
            <div class="su-txt"><strong>${U.esc(cfg.roles[u.role])}</strong><span>${U.esc(u.email)}</span></div>
            <button class="icon-btn ghost" id="logoutBtn" aria-label="Cerrar sesión" title="Cerrar sesión">${VJ.icon('logout', 16)}</button></div>
        </aside>
        <div class="scrim" id="scrim"></div>
        <div class="main">
          <header class="topbar">
            <button class="icon-btn menu-btn" id="menuBtn" aria-label="Abrir menú">${VJ.icon('menu', 18)}</button>
            <div class="top-title"><nav class="crumb" id="crumb" aria-label="Ruta"></nav><h1 class="page-title" id="pageTitle"></h1></div>
            <div class="top-right">
              <div class="clock" id="clock" hidden></div>
              <button class="icon-btn" id="themeBtn" aria-label="Cambiar tema">${VJ.icon(isDark() ? 'sun' : 'moon', 18)}</button>
              <div class="bell-wrap"><button class="icon-btn" id="bellBtn" aria-label="Notificaciones" aria-expanded="false">${VJ.icon('bell', 18)}<i class="bell-dot" id="bellDot" hidden></i></button><div class="bell-pop" id="bellPop" hidden></div></div>
              <span class="av av-2 top-av" title="${U.esc(u.name)}">${U.esc(u.role === 'admin' ? 'A' : U.initials(u.name)[0])}</span>
            </div>
          </header>
          <main class="content" id="view" tabindex="-1"></main>
        </div>
      </div>`;
    const $ = s => $app().querySelector(s);
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#logoutBtn').addEventListener('click', logout);
    $('#collapseBtn').addEventListener('click', () => { $('#shell').classList.toggle('collapsed'); });
    $('#menuBtn').addEventListener('click', () => $('#shell').classList.add('nav-open'));
    $('#scrim').addEventListener('click', () => $('#shell').classList.remove('nav-open'));
    $('#sideNav').addEventListener('click', e => { const a = e.target.closest('[data-route]'); if (a) { e.preventDefault(); go(a.dataset.route); } });
    $('#bellBtn').addEventListener('click', e => { e.stopPropagation(); toggleBell(); });
    document.addEventListener('click', e => { const p = document.getElementById('bellPop'); if (p && !p.hidden && !e.target.closest('.bell-wrap')) closeBell(); });
  }

  function drawNav() {
    const pend = S.orders().filter(o => o.status === 'pendiente').length;
    document.getElementById('sideNav').innerHTML = NAV.filter(n => allowed(n.id)).map(n => {
      const kids = n.kids ? n.kids.filter(k => allowed(k[0])) : null;
      const on = kids ? kids.some(k => k[0] === state.route) : state.route === n.id;
      const badge = n.id === 'pedidos' && pend ? `<em class="nav-badge">${pend}</em>` : '';
      return `<a href="#${n.kids ? n.kids[0][0] : n.id}" class="nav-item ${on ? 'active' : ''}" data-route="${n.kids ? n.kids[0][0] : n.id}" ${on ? 'aria-current="page"' : ''} title="${n.label}">${VJ.icon(n.icon, 17)}<span>${n.label}</span>${badge}</a>` +
        (kids && on ? `<div class="subnav">${kids.map(k => `<a href="#${k[0]}" class="${state.route === k[0] ? 'on' : ''}" data-route="${k[0]}">${k[1]}</a>`).join('')}</div>` : '');
    }).join('');
  }

  /* ---------- notificaciones ---------- */
  function notes() {
    const out = [];
    S.products().filter(p => S.status(p) !== 'disponible').sort((a, b) => a.stock - b.stock).slice(0, 4)
      .forEach(p => out.push({ ico: 'alert', tone: S.status(p) === 'agotado' ? 'bad' : 'warn', t: `${p.name}: ${p.stock <= 0 ? 'agotado' : 'quedan ' + p.stock + ' un. (mínimo ' + p.min + ')'}`, go: 'inventario' }));
    S.orders().filter(o => o.status === 'pendiente').forEach(o => out.push({ ico: 'file', tone: 'info', t: `Pedido ${o.id} de ${o.name} está pendiente`, go: 'pedidos' }));
    return out;
  }
  function toggleBell() {
    const pop = document.getElementById('bellPop');
    if (!pop.hidden) return closeBell();
    const n = notes();
    pop.innerHTML = `<div class="bell-head"><strong>Notificaciones</strong><span class="muted sm">${n.length}</span></div>` +
      (n.length ? n.map(x => `<button class="note ${x.tone}" data-go="${x.go}"><span>${VJ.icon(x.ico, 15)}</span><span>${U.esc(x.t)}</span></button>`).join('') : '<p class="mini-empty">Sin novedades por ahora.</p>');
    pop.hidden = false; document.getElementById('bellBtn').setAttribute('aria-expanded', 'true');
    pop.onclick = e => { const b = e.target.closest('[data-go]'); if (b) { closeBell(); go(b.dataset.go); } };
  }
  function closeBell() { const p = document.getElementById('bellPop'); if (p) { p.hidden = true; document.getElementById('bellBtn').setAttribute('aria-expanded', 'false'); } }

  /* ---------- NAVEGACIÓN ---------- */
  function go(route, params) {
    if (!VJ.pages[route]) route = 'inicio';
    if (!allowed(route)) { ui.toast('Tu rol no tiene acceso a esa sección.', 'err'); route = 'inicio'; }
    state.route = route; state.params = params || {};
    suppressHash = true; try { if (location.hash !== '#' + route) location.hash = route; } catch (e) { /* noop */ }
    setTimeout(() => { suppressHash = false; }, 0);
    document.getElementById('shell').classList.remove('nav-open');
    closeBell(); ui.closeAll(); render();
    const v = document.getElementById('view'); window.scrollTo(0, 0); if (v) v.scrollTop = 0;
  }

  function render() {
    const page = VJ.pages[state.route], ctx = { user: state.user, params: state.params };
    const m = page.meta(ctx), view = document.getElementById('view');
    document.getElementById('pageTitle').textContent = m.title;
    document.getElementById('crumb').innerHTML = m.crumb.map((c, i) => `<span class="${i === m.crumb.length - 1 ? 'cur' : ''}">${U.esc(c)}</span>`).join('<i>›</i>');
    document.title = m.title + ' · ' + cfg.store.name;
    view.innerHTML = `<div class="page page-${state.route}">${page.render(ctx)}</div>`;
    if (page.mount) page.mount(view.firstElementChild, ctx);
    drawNav();
    document.getElementById('bellDot').hidden = notes().length === 0;

    /* reloj en Nueva venta (como el prototipo) */
    clearInterval(clockTimer);
    const ck = document.getElementById('clock');
    if (state.route === 'ventas') {
      const tick = () => { const n = new Date(); ck.innerHTML = `<strong>${U.fmtLong(n)}</strong><span>${U.fmtClock(n)}</span>`; };
      ck.hidden = false; tick(); clockTimer = setInterval(tick, 20000);
    } else ck.hidden = true;
  }

  function logout() {
    store.del(cfg.sessionKey); state.user = null; clearInterval(clockTimer);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* noop */ }
    renderLogin();
  }

  function boot(route) {
    renderShell();
    state.route = VJ.pages[route] ? route : 'inicio';
    go(state.route);
  }

  VJ.app = {
    state, go,
    refresh() { if (state.user && document.getElementById('view')) render(); }
  };

  /* ---------- ARRANQUE ---------- */
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
  let started = false;
  function init() {
    if (started) return; started = true;
    applyTheme(store.get(cfg.themeKey));
    S.init();
    state.user = savedUser();
    window.addEventListener('hashchange', () => {
      if (suppressHash || !state.user) return;
      const r = location.hash.replace('#', ''); if (VJ.pages[r] && r !== state.route) go(r);
    });
    if (state.user) boot(location.hash.replace('#', '')); else renderLogin();
  }
})();
