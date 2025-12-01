# 📚 Documentación Técnica Completa - Sistema de Gestión Farmacéutica

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos Principales](#módulos-principales)
6. [Estructuras de Datos](#estructuras-de-datos)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [Sistema de Autenticación](#sistema-de-autenticación)
9. [Gestión de Estado](#gestión-de-estado)
10. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 1. Descripción General

### Propósito
Sistema web de gestión comercial para farmacias que permite:
- Gestión de productos y catálogo
- Generación de pedidos, proformas y listas de precios
- Control de visitas a clientes
- Gestión de cobros y pagos
- Agenda y calendario de eventos
- Reportes y estadísticas
- Gestión de clientes
- Sistema de usuarios con roles

### Usuarios Objetivo
- **Vendedores:** Personal de ventas que visita clientes
- **Administradores:** Gestores del sistema con permisos completos

---

## 2. Arquitectura del Sistema

### Patrón de Diseño
**SPA (Single Page Application)** con Vue.js 3

### Arquitectura de Componentes
```
┌─────────────────────────────────────┐
│         App.vue (Root)              │
│  ┌───────────────────────────────┐  │
│  │   AdminLayout.vue (Layout)    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Router Views          │  │  │
│  │  │   (Vistas dinámicas)    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Flujo de Datos
```
Component → Composable → LocalStorage
    ↓           ↓
  View ← Reactive State
```

---

## 3. Tecnologías Utilizadas

### Core
- **Vue.js 3.4+** - Framework principal
- **Vue Router 4** - Navegación SPA
- **Vite 5** - Build tool y dev server

### UI/UX
- **Bootstrap 5** - Framework CSS
- **BootstrapVue 3** - Componentes Vue + Bootstrap
- **Bootstrap Icons** - Iconografía

### Librerías Adicionales
- **Chart.js + vue-chartjs** - Gráficos estadísticos
- **jsPDF + jsPDF-AutoTable** - Generación de PDFs
- **XLSX (SheetJS)** - Manejo de archivos Excel
- **Alertify.js** - Diálogos de confirmación
- **vue-toastification** - Notificaciones toast

### Almacenamiento
- **LocalStorage** - Persistencia de datos local

---

## 4. Estructura del Proyecto

```
proyectoFarmacia/
├── public/                    # Archivos estáticos
├── src/
│   ├── assets/               # Recursos (CSS, imágenes)
│   ├── components/           # Componentes reutilizables
│   │   └── Productos/
│   │       └── Producto.vue  # Card de producto
│   ├── composables/          # Lógica reutilizable
│   │   ├── useAuth.js       # Autenticación
│   │   ├── useCart.js       # Carrito de compras
│   │   ├── useAgenda.js     # Eventos y calendario
│   │   ├── useCobros.js     # Gestión de cobros
│   │   ├── useClientes.js   # Gestión de clientes
│   │   ├── useEstadisticas.js # Procesamiento de datos
│   │   ├── useHistorial.js  # Historial de documentos
│   │   └── useUsuarios.js   # Gestión de usuarios
│   ├── layouts/
│   │   └── AdminLayout.vue  # Layout principal
│   ├── router/
│   │   └── index.js         # Configuración de rutas
│   ├── utils/               # Utilidades
│   │   ├── excelHandler.js  # Exportación Excel
│   │   └── pdfGenerator.js  # Generación PDF
│   ├── views/               # Vistas principales
│   │   ├── Dashboard.vue
│   │   ├── ProductosView.vue
│   │   ├── CarritoView.vue
│   │   ├── ClientesView.vue
│   │   ├── ClienteDetalleView.vue
│   │   ├── EstadisticasView.vue
│   │   ├── AgendaView.vue
│   │   ├── EventosListView.vue
│   │   ├── CobrosView.vue
│   │   ├── VisitasView.vue
│   │   └── ...
│   ├── App.vue              # Componente raíz
│   └── main.js              # Punto de entrada
├── package.json
└── vite.config.js
```

---

## 5. Módulos Principales

### 5.1 Autenticación (`useAuth.js`)

**Funcionalidad:**
- Login/Logout de usuarios
- Gestión de sesión
- Verificación de permisos
- Inactividad automática (1 hora)

**Usuarios Predefinidos:**
```javascript
{
  username: "romero30",
  password: "romero_30",
  name: "Antonio Romero",
  role: "admin"
}
```

**Métodos Principales:**
- `login(username, password)` - Iniciar sesión
- `logout()` - Cerrar sesión
- `hasPermission(permission)` - Verificar permisos
- `forceLogout()` - Logout por inactividad

**LocalStorage Keys:**
- `currentUser` - Usuario actual

---

### 5.2 Productos (`ProductosView.vue`)

**Funcionalidad:**
- Catálogo de productos
- Búsqueda y filtrado
- Agregar al carrito
- CRUD de productos (solo admin)

**Estructura de Producto:**
```javascript
{
  ID: string,
  NombreProducto: string,
  Marca: string,
  Presentacion: string,
  PrecioFarmacia: number,
  IVA: number,
  Promocion: string,  // Ej: "12+1 6+1"
  Descuento: number
}
```

**LocalStorage Keys:**
- `ListaProductos` - Array de productos

---

### 5.3 Carrito (`useCart.js`)

**Funcionalidad:**
- Agregar/quitar productos
- Calcular totales con IVA
- Aplicar promociones automáticas
- Generar documentos (Proforma, Pedido, Lista)

**Estructura de Item:**
```javascript
{
  ID: string,
  quantity: number,
  // ... datos del producto
  subtotalItem: number,
  ivaAmount: number,
  totalItem: number
}
```

**Cálculo de Promociones:**
```javascript
// Formato: "12+1 6+1" = compra 12 lleva 1 gratis, compra 6 lleva 1 gratis
parsePromotionRules(promoString)
calculateBonus(quantity, rules)
```

**LocalStorage Keys:**
- `farmacia_cart` - Array de items en carrito

---

### 5.4 Clientes (`useClientes.js`)

**Funcionalidad:**
- CRUD de clientes
- Clasificación automática (A/B/C)
- Historial por cliente
- Búsqueda y filtros

**Estructura de Cliente:**
```javascript
{
  id: string,
  nombre: string,
  empresa: string,
  telefono: string,
  email: string,
  direccion: string,
  ciudad: string,
  clasificacion: 'A' | 'B' | 'C',
  notas: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

**Clasificación:**
- **Clase A:** Compras ≥ $5,000
- **Clase B:** Compras ≥ $2,000
- **Clase C:** Compras < $2,000

**LocalStorage Keys:**
- `farmacia_clientes` - Array de clientes

---

### 5.5 Agenda (`useAgenda.js`)

**Funcionalidad:**
- Calendario mensual
- CRUD de eventos
- Filtros por tipo y estado
- Notificaciones de vencidos

**Estructura de Evento:**
```javascript
{
  id: string,
  titulo: string,
  descripcion: string,
  fecha: ISO date,
  tipo: 'Visita' | 'Reunión' | 'Llamada' | 'Tarea' | 'Otro',
  completada: boolean,
  createdAt: ISO timestamp
}
```

**LocalStorage Keys:**
- `farmacia_eventos` - Array de eventos

---

### 5.6 Cobros (`useCobros.js`)

**Funcionalidad:**
- Registrar cobros
- Tipos: Abono / Cancelación
- Métodos de pago
- Exportación a PDF

**Estructura de Cobro:**
```javascript
{
  id: string,
  fecha: ISO date,
  cliente: string,
  clienteId: string | null,
  numeroFactura: string,
  tipo: 'Abono' | 'Cancelación',
  metodoPago: 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta',
  cantidad: number,
  observaciones: string
}
```

**LocalStorage Keys:**
- `farmacia_cobros` - Array de cobros

---

### 5.7 Estadísticas (`useEstadisticas.js`)

**Funcionalidad:**
- Procesamiento de datos
- Generación de gráficos
- KPIs calculados
- Filtros por período

**Períodos Disponibles:**
- Última semana
- Último mes
- Último trimestre
- Último año

**Métricas:**
- Ventas totales
- Total cobrado
- Promedio de venta
- Tasa de conversión (visitas → pedidos)

---

### 5.8 Historial (`useHistorial.js`)

**Funcionalidad:**
- Registro de documentos generados
- Filtros por tipo y fecha
- Vinculación con clientes

**Estructura de Documento:**
```javascript
{
  id: string,
  type: 'Proforma' | 'Pedido' | 'Lista de Precios',
  clientName: string,
  clienteId: string | null,
  date: ISO date,
  items: Array,
  totals: {
    total: number,
    subtotal: number,
    iva: number
  },
  fecha: ISO timestamp
}
```

**LocalStorage Keys:**
- `farmacia_historial` - Array de documentos

---

## 6. Estructuras de Datos

### LocalStorage Schema

```javascript
{
  // Autenticación
  "currentUser": {
    username: string,
    name: string,
    role: 'admin' | 'vendedor'
  },
  
  // Productos
  "ListaProductos": [Product],
  
  // Carrito
  "farmacia_cart": [CartItem],
  
  // Clientes
  "farmacia_clientes": [Cliente],
  
  // Eventos
  "farmacia_eventos": [Evento],
  
  // Cobros
  "farmacia_cobros": [Cobro],
  
  // Historial
  "farmacia_historial": [Documento],
  
  // Visitas
  "VisitasDiarias": [Visita],
  
  // Usuarios
  "farmacia_users": [User]
}
```

---

## 7. Flujos de Trabajo

### 7.1 Flujo de Venta

```
1. Usuario navega a Productos
2. Busca/filtra productos
3. Agrega productos al carrito (especifica cantidad)
4. Va a Carrito
5. Revisa productos y totales
6. Click en "Proforma PDF" / "Pedido Excel" / "Lista Precio PDF"
7. Modal: Selecciona cliente registrado o escribe nombre
8. Completa datos (ciudad, fecha)
9. Sistema genera documento
10. Documento se guarda en Historial
11. Carrito se mantiene para seguir agregando
```

### 7.2 Flujo de Gestión de Cliente

```
1. Usuario navega a Clientes
2. Click en "Nuevo Cliente"
3. Completa formulario
4. Sistema guarda cliente
5. Cliente aparece en lista
6. Click en cliente → Ver detalle
7. Detalle muestra:
   - Información de contacto
   - Estadísticas (visitas, cobros, pedidos)
   - Historial completo en pestañas
```

### 7.3 Flujo de Evento/Agenda

```
1. Usuario navega a Agenda
2. Ve calendario mensual
3. Click en día → Agregar evento
4. Completa formulario (título, descripción, tipo)
5. Evento se guarda
6. Aparece en calendario
7. Puede marcar como completado
8. Sistema notifica eventos vencidos al login
```

---

## 8. Sistema de Autenticación

### Roles y Permisos

#### Vendedor
```javascript
permissions: [
  "view_products",
  "generate_proforma",
  "generate_pedido"
]
```

**Puede:**
- Ver productos
- Generar documentos
- Gestionar clientes (crear, editar)
- Registrar visitas y cobros
- Ver estadísticas

**NO Puede:**
- Editar/eliminar productos
- Eliminar clientes
- Gestionar usuarios
- Hacer backups

#### Administrador
```javascript
permissions: [
  "view_products",
  "edit_products",
  "delete_products",
  "load_excel",
  "export_data",
  "manage_firebase",
  "generate_proforma",
  "generate_pedido"
]
```

**Puede TODO** + permisos exclusivos:
- CRUD completo de productos
- Eliminar clientes
- Gestionar usuarios
- Backups y restauración

### Protección de Rutas

```javascript
// router/index.js
{
  path: "crear-producto",
  meta: { requiresAdmin: true }
}

// Navigation Guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !currentUser) {
    next('/login');
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/');
  } else {
    next();
  }
});
```

### Inactividad Automática

```javascript
INACTIVITY_TIMEOUT = 1 hora
WARNING_TIME = 1 minuto antes

// Eventos monitoreados
['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click']
```

---

## 9. Gestión de Estado

### Patrón Composable

Cada módulo usa el patrón Composable de Vue 3:

```javascript
// Ejemplo: useClientes.js
const clientes = ref([]);  // Estado reactivo compartido

export function useClientes() {
  // Cargar al inicializar
  if (clientes.value.length === 0) {
    loadClientes();
  }
  
  // Métodos
  const addCliente = (data) => {
    clientes.value.push(data);
    saveClientes();
  };
  
  // Retornar estado y métodos
  return {
    clientes,
    addCliente,
    // ...
  };
}
```

### Sincronización con LocalStorage

```javascript
// Cargar
const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    data.value = JSON.parse(stored);
  }
};

// Guardar
const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
};
```

---

## 10. Guía de Desarrollo

### Instalación

```bash
# Clonar repositorio
cd proyectoFarmacia

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

### Agregar un Nuevo Módulo

1. **Crear Composable** (`src/composables/useNuevoModulo.js`)
```javascript
import { ref } from 'vue';

const STORAGE_KEY = 'farmacia_nuevo_modulo';
const items = ref([]);

export function useNuevoModulo() {
  // Lógica aquí
  return { items };
}
```

2. **Crear Vista** (`src/views/NuevoModuloView.vue`)
```vue
<template>
  <div>
    <!-- UI aquí -->
  </div>
</template>

<script setup>
import { useNuevoModulo } from '@/composables/useNuevoModulo';
const { items } = useNuevoModulo();
</script>
```

3. **Agregar Ruta** (`src/router/index.js`)
```javascript
{
  path: "nuevo-modulo",
  component: () => import("@/views/NuevoModuloView.vue"),
  meta: { requiresAuth: true }
}
```

4. **Agregar al Menú** (`src/layouts/AdminLayout.vue`)
```vue
<router-link to="/nuevo-modulo">
  <i class="bi bi-icon"></i> Nuevo Módulo
</router-link>
```

### Convenciones de Código

- **Nombres de archivos:** PascalCase para componentes (`ProductoCard.vue`)
- **Composables:** camelCase con prefijo `use` (`useAuth.js`)
- **Constantes:** UPPER_SNAKE_CASE (`STORAGE_KEY`)
- **Variables reactivas:** camelCase (`clienteNombre`)
- **Funciones:** camelCase (`addCliente`)

### Estructura de Commits

```
feat: Agregar módulo de X
fix: Corregir cálculo de Y
refactor: Reorganizar componente Z
docs: Actualizar documentación
style: Mejorar estilos de A
```

---

## 📌 Puntos Importantes

### Limitaciones Actuales
- ❌ No hay backend (todo es local)
- ❌ No hay sincronización entre dispositivos
- ❌ Datos se pierden si se limpia el navegador
- ❌ No hay autenticación real (usuarios hardcoded)

### Mejoras Sugeridas
1. **Backend:** Implementar API REST con Node.js/Express
2. **Base de Datos:** PostgreSQL o MongoDB
3. **Autenticación:** JWT tokens
4. **PWA:** Convertir a Progressive Web App
5. **Sincronización:** Real-time con WebSockets
6. **Testing:** Unit tests con Vitest
7. **CI/CD:** Pipeline automatizado

### Contacto y Soporte
- Desarrollador: Antonio Romero
- Email: [contacto]
- Repositorio: [URL del repo]

---

**Última actualización:** Diciembre 2025
**Versión:** 1.0.0
