/* ==========================================================
   CONFIGURACIÓN — todo lo que probablemente quieras cambiar
   está en este archivo (moneda, bancos, usuarios, listas).
   ========================================================== */
window.VJ = window.VJ || {};

VJ.config = {
  store: { name: 'Variedades Jesly', tagline: 'Sistema de gestión', short: 'Gestión' },

  /* MONEDA
     El prototipo usa el signo "$" y miles con punto ($ 89.000).
     Para córdobas con otro formato, por ejemplo:
       symbol: 'C$', thousands: ',', decimal: '.', decimals: 2          */
  currency: { symbol: '$', thousands: '.', decimal: ',', decimals: 0 },

  /* BANCOS para pagos por transferencia */
  banks: ['Banpro', 'Lafise', 'BAC', 'BDF'],

  /* MÉTODOS DE PAGO (el texto de ayuda de Transferencia se arma con los bancos) */
  paymentMethods: [
    { id: 'efectivo', label: 'Efectivo', hint: 'Pago en billetes y monedas', icon: 'banknote' },
    { id: 'transferencia', label: 'Transferencia', hint: null, icon: 'card' }
  ],

  /* FLUJO DE UN PEDIDO */
  orderFlow: [
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'confirmado', label: 'Confirmado' },
    { id: 'preparando', label: 'Preparando' },
    { id: 'listo', label: 'Listo para entregar' },
    { id: 'entregado', label: 'Entregado' }
  ],

  /* LISTAS DEL FORMULARIO DE PRODUCTOS */
  categories: ['Blusas', 'Vestidos', 'Pantalones', 'Faldas', 'Chaquetas', 'Calzado', 'Accesorios', 'Ropa interior'],
  sizes: ['XS/S', 'XS/S/M', 'XS/S/M/L', 'S/M', 'S/M/L', 'S/M/L/XL', 'M/L', 'M/L/XL', '35-41', 'Única'],
  colors: ['Rosado', 'Champán', 'Beige', 'Negro', 'Gris', 'Blanco', 'Multicolor', 'Dorado', 'Lila', 'Camel', 'Rojo', 'Azul', 'Verde', 'Celeste'],

  /* TABLAS */
  pageSize: 8,
  inventoryPageSize: 15,

  /* USUARIOS DE PRUEBA (reemplazar por un backend real en producción) */
  users: [
    { email: 'admin@jesly.com',    username: 'admin',    password: 'admin123',    role: 'admin',    name: 'Administrador' },
    { email: 'empleado@jesly.com', username: 'empleado', password: 'empleado123', role: 'empleado', name: 'Laura Gómez' },
    { email: 'juliana@jesly.com',  username: 'juliana',  password: 'empleado123', role: 'empleado', name: 'Juliana Pérez' },
    { email: 'camila@jesly.com',   username: 'camila',   password: 'empleado123', role: 'empleado', name: 'Camila Torres' },
    { email: 'diana@jesly.com',    username: 'diana',    password: 'empleado123', role: 'empleado', name: 'Diana Ruiz' }
  ],
  roles: { admin: 'Administrador', empleado: 'Empleado' },

  /* Qué secciones ve cada rol */
  access: {
    admin: ['inicio', 'productos', 'inventario', 'ventas', 'historial', 'pedidos', 'reportes'],
    empleado: ['inicio', 'inventario', 'ventas', 'historial', 'pedidos']
  },

  demo: { showCredentials: true },   // muestra las cuentas de prueba en el login

  storageKey: 'vj.data.v2',
  sessionKey: 'vj.session.v1',
  themeKey: 'vj.theme.v1'
};
