# Variedades Jesly · Sistema de gestión

Sitio web (HTML + CSS + JavaScript puro, sin dependencias) basado en el prototipo de 7 interfaces, más una pantalla de Inicio.
Los datos se guardan en el navegador (localStorage) y se pueden restablecer desde Inicio.

## Cómo abrirlo en Visual Studio Code
1. Abre esta carpeta en VS Code.
2. Instala la extensión **Live Server** y pulsa "Go Live" sobre `index.html`
   (también funciona abriendo `index.html` con doble clic).

## Cuentas de prueba
| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | admin@jesly.com | admin123 |
| Empleado | empleado@jesly.com | empleado123 |

El empleado no ve **Productos** ni **Reportes** (se cambia en `js/config.js`).

## Estructura
```
index.html          página única; carga estilos y scripts en orden
css/tokens.css      colores y tipografías (aquí se cambia la paleta y el modo oscuro)
css/base.css        botones, campos, tablas, chips, modales
css/layout.css      menú lateral, barra superior, responsive
css/pages.css       estilos de cada pantalla
js/config.js        moneda, bancos, listas, usuarios, permisos
js/data.js          datos de ejemplo
js/store.js         guardado en localStorage y reglas (stock, ventas, pedidos)
js/stats.js         cálculos de reportes
js/charts.js        gráficos SVG propios
js/ui.js            modales, panel lateral, avisos
js/pages/*.js       una pantalla por archivo
js/app.js           sesión, menú, rutas y tema
tools/build-artifact.mjs   genera dist/artifact.html (todo en un solo archivo)
```

## Cambios frecuentes
- **Moneda**: `js/config.js` → `currency` (por ejemplo `symbol: 'C$'`).
- **Bancos**: `js/config.js` → `banks`.
- **Colores**: `css/tokens.css`.
- **Datos de ejemplo**: `js/data.js`. Sube la versión de `storageKey` en `config.js` para que el navegador los recargue.

Para regenerar el archivo único: `node tools/build-artifact.mjs`.
