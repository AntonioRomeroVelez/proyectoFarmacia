# Sistema de Roles y Permisos - ACTUALIZADO

## 🎭 Roles del Sistema

El sistema tiene **2 roles**:
- **Administrador** (`admin`)
- **Vendedor** (`vendedor`)

---

## 👤 VENDEDOR

### ✅ Puede Acceder a:
- **Dashboard** - Vista general
- **Productos** - Ver catálogo (solo lectura)
- **Carrito** - Agregar productos y generar documentos
- **Historial** - Ver pedidos/proformas generados
- **Agenda** - Gestionar calendario y eventos
- **Eventos** - Lista completa de eventos
- **Cobros** - Registrar y consultar cobros
- **Visitas** - Registrar visitas a clientes
- **Reportes PDF** - Generar reportes
- **Estadísticas** - Ver gráficos y análisis
- **Clientes** - Ver y crear clientes (NO editar ni eliminar)

### ❌ NO Puede:
- Crear/editar/eliminar productos
- **Editar clientes existentes** ⚠️
- **Eliminar clientes** ⚠️
- Cargar productos desde Excel
- Comparar productos
- Gestionar usuarios
- Realizar backups/restaurar datos

### 📋 Permisos de Clientes:
- ✅ **Ver** clientes
- ✅ **Crear** nuevos clientes
- ❌ **Editar** clientes existentes
- ❌ **Eliminar** clientes

---

## 👨‍💼 ADMINISTRADOR

### ✅ Puede Acceder a TODO:
**Todas las funciones del Vendedor +**

#### Gestión de Productos:
- Crear, editar y eliminar productos
- Carga masiva desde Excel
- Comparación de productos

#### Gestión de Clientes:
- ✅ **Ver** clientes
- ✅ **Crear** clientes
- ✅ **Editar** clientes
- ✅ **Eliminar** clientes

#### Gestión del Sistema:
- Crear, editar, eliminar usuarios
- Backups automáticos y manuales
- Restaurar datos

---

## 📊 Comparativa de Permisos

| Funcionalidad | Vendedor | Admin |
|---------------|----------|-------|
| Ver productos | ✅ | ✅ |
| Crear/Editar productos | ❌ | ✅ |
| Generar pedidos/proformas | ✅ | ✅ |
| **Ver clientes** | ✅ | ✅ |
| **Crear clientes** | ✅ | ✅ |
| **Editar clientes** | ❌ | ✅ |
| **Eliminar clientes** | ❌ | ✅ |
| Ver estadísticas | ✅ | ✅ |
| Carga Excel | ❌ | ✅ |
| Gestionar usuarios | ❌ | ✅ |
| Backup/Restaurar | ❌ | ✅ |

---

## 🔐 Usuarios Predefinidos

### Administradores:
1. **romero30** / romero_30 - Antonio Romero
2. **dianita26** / dianita_26 - Diana Benálcazar

### Vendedor:
1. **vendedor26** / vendedor_26 - Diana Benálcazar

---

## 🛠️ Implementación

### Restricción en ClientesView.vue:
```vue
<!-- Botones de editar/eliminar solo visibles para admin -->
<div class="cliente-actions" v-if="isAdmin">
  <b-button @click="editarCliente(cliente)">✏️</b-button>
  <b-button @click="confirmarEliminar(cliente)">🗑️</b-button>
</div>
```

### Verificación de Rol:
```javascript
import { useAuth } from '@/composables/useAuth';
const { isAdmin } = useAuth();
```

---

## ✅ Cambios Implementados

- ✅ Vendedores pueden crear clientes
- ✅ Vendedores NO pueden editar clientes
- ✅ Vendedores NO pueden eliminar clientes
- ✅ Solo administradores ven botones de editar/eliminar
- ✅ Ambos roles pueden ver la lista completa de clientes
