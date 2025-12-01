# 🏥 Sistema de Gestión Farmacéutica

Sistema web completo para la gestión comercial de farmacias, desarrollado con Vue.js 3.

## 📋 Características Principales

- ✅ **Gestión de Productos** - Catálogo completo con búsqueda y filtros
- ✅ **Carrito de Compras** - Con cálculo automático de IVA y promociones
- ✅ **Generación de Documentos** - Proformas PDF, Pedidos Excel, Listas de Precios
- ✅ **Gestión de Clientes** - CRUD completo con clasificación automática (A/B/C)
- ✅ **Agenda y Eventos** - Calendario con notificaciones de vencimiento
- ✅ **Control de Cobros** - Registro de abonos y cancelaciones
- ✅ **Visitas a Clientes** - Seguimiento de actividad comercial
- ✅ **Estadísticas** - Gráficos interactivos con Chart.js
- ✅ **Sistema de Usuarios** - Roles (Admin/Vendedor) con permisos
- ✅ **Backups Automáticos** - Respaldo diario de datos

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- npm 9+

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

La aplicación estará disponible en `http://localhost:5173`

## 👥 Usuarios de Prueba

### Administrador
- **Usuario:** `romero30`
- **Contraseña:** `romero_30`

### Vendedor
- **Usuario:** `vendedor26`
- **Contraseña:** `vendedor_26`

## 📚 Documentación

- **[Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)** - Guía completa del sistema
- **[Roles y Permisos](./ROLES_Y_PERMISOS.md)** - Descripción de roles de usuario

## 🛠️ Tecnologías Utilizadas

- **Vue.js 3** - Framework JavaScript
- **Vite** - Build tool
- **Bootstrap 5** - Framework CSS
- **Chart.js** - Gráficos estadísticos
- **jsPDF** - Generación de PDFs
- **XLSX** - Manejo de Excel
- **LocalStorage** - Persistencia de datos

## 📁 Estructura del Proyecto

```
proyectoFarmacia/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── composables/     # Lógica de negocio (Composition API)
│   ├── layouts/         # Layouts de la aplicación
│   ├── router/          # Configuración de rutas
│   ├── utils/           # Utilidades (PDF, Excel)
│   ├── views/           # Vistas principales
│   └── App.vue          # Componente raíz
├── public/              # Archivos estáticos
└── package.json
```

## 🔑 Módulos Principales

### Composables (Lógica de Negocio)
- `useAuth.js` - Autenticación y permisos
- `useCart.js` - Carrito de compras
- `useClientes.js` - Gestión de clientes
- `useAgenda.js` - Eventos y calendario
- `useCobros.js` - Registro de cobros
- `useEstadisticas.js` - Procesamiento de datos para gráficos

### Vistas Principales
- `Dashboard.vue` - Panel principal
- `ProductosView.vue` - Catálogo de productos
- `CarritoView.vue` - Carrito y generación de documentos
- `ClientesView.vue` - Lista de clientes
- `EstadisticasView.vue` - Reportes y gráficos
- `AgendaView.vue` - Calendario de eventos

## 📊 Almacenamiento de Datos

Los datos se almacenan en **LocalStorage** del navegador:

- `currentUser` - Usuario actual
- `ListaProductos` - Catálogo de productos
- `farmacia_cart` - Carrito de compras
- `farmacia_clientes` - Base de datos de clientes
- `farmacia_eventos` - Eventos de agenda
- `farmacia_cobros` - Registro de cobros
- `farmacia_historial` - Documentos generados

## 🔒 Seguridad

- Sistema de roles (Admin/Vendedor)
- Protección de rutas según permisos
- Logout automático por inactividad (1 hora)
- Validación de formularios

## 🎨 Características de UI/UX

- Diseño responsive (móvil y desktop)
- Tema moderno con Bootstrap 5
- Notificaciones toast
- Confirmaciones con Alertify
- Gráficos interactivos
- Animaciones suaves

## 📈 Próximas Mejoras Sugeridas

- [ ] Backend con API REST
- [ ] Base de datos (PostgreSQL/MongoDB)
- [ ] Autenticación JWT
- [ ] PWA (Progressive Web App)
- [ ] Sincronización en tiempo real
- [ ] Testing automatizado
- [ ] CI/CD pipeline

## 👨‍💻 Desarrollo

### Agregar un Nuevo Módulo

1. Crear composable en `src/composables/`
2. Crear vista en `src/views/`
3. Agregar ruta en `src/router/index.js`
4. Agregar enlace en `src/layouts/AdminLayout.vue`

Ver [Documentación Técnica](./DOCUMENTACION_TECNICA.md) para más detalles.

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

## 📞 Contacto

**Desarrollador:** Antonio Romero  
**Email:** [tu-email]

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
