<template>
  <div class="container-fluid py-2 py-md-4">
    <div class="d-flex justify-content-center align-items-center mb-3 mb-md-4 flex-wrap gap-2">
      <h2 class="fw-bold text-primary mb-0">Comparación de Productos</h2>
      <router-link to="/productos">
        <b-button variant="outline-primary" size="sm">
          ← Volver
        </b-button>
      </router-link>
    </div>

    <!-- Alerta de error de carga -->
    <b-alert v-if="fileLoadError" show variant="danger" class="mb-3" dismissible @dismissed="fileLoadError = ''">
      <h5 class="alert-heading">❌ Error al cargar el archivo</h5>
      <p class="mb-0">{{ fileLoadError }}</p>
    </b-alert>

    <!-- Carga de Excel -->
    <b-card class="shadow-sm mb-3 mb-md-4">
      <h5 class="mb-3">📁 Cargar Nuevo Archivo Excel</h5>
      <div class="d-flex flex-column flex-md-row gap-2">
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx, .xls" class="form-control" />
        <b-button v-if="todosProductos.length > 0 || erroresValidacion.length > 0" variant="outline-secondary" size="sm"
          @click="limpiar" class="flex-shrink-0">
          🗑️ Limpiar
        </b-button>
      </div>
      <small class="text-muted mt-2 d-block">
        La comparación se realiza por: <strong>Marca</strong>, luego Nombre, Presentación y Principio Activo (ignorando
        espacios).
       Se lee también la columna <strong>Tipo</strong>.
        Los precios se comparan con 3 decimales.
      </small>
    </b-card>

    <!-- Estadísticas y filtros de errores -->
    <div v-if="erroresValidacion.length > 0">
      <!-- Estadísticas de errores -->
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <div class="stat-badge stat-error">
          <span class="stat-value">{{ erroresValidacion.length }}</span>
          <span class="stat-text">Errores</span>
        </div>
      </div>

      <!-- Tabla de errores -->
      <b-card class="shadow-sm mb-4">
        <h5 class="text-danger mb-3">⚠️ Errores de Validación en el Excel</h5>
        <p class="text-muted">Corrige los siguientes errores antes de procesar la comparación:</p>

        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>
                <th>Fila</th>
                <th>Producto</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(error, index) in erroresValidacion" :key="index" class="table-danger-custom">
                <td>{{ error.fila }}</td>
                <td>
                  <strong>{{ error.producto.Nombre || '(Sin nombre)' }}</strong>
                  <br>
                  <small class="text-muted">
                    {{ error.producto.Marca || '(Sin marca)' }}
                  </small>
                </td>
                <td>
                  <b-badge variant="danger" v-for="(msg, i) in error.errores" :key="i" class="me-1 mb-1">
                    {{ msg }}
                  </b-badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </b-card>
    </div>

    <!-- Vista de Resultados de Comparación -->
    <div v-else-if="todosProductos.length > 0">
      <!-- Estadísticas -->
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <div class="stat-badge stat-total">
          <span class="stat-value">{{ todosProductos.length }}</span>
          <span class="stat-text">Total Procesados</span>
        </div>
        <div class="stat-badge stat-nuevos">
          <span class="stat-value">{{ estadisticas.nuevos }}</span>
          <span class="stat-text">Nuevos</span>
        </div>
        <div class="stat-badge stat-existentes">
          <span class="stat-value">{{ estadisticas.existentes }}</span>
          <span class="stat-text">Existen</span>
        </div>
        <div class="stat-badge stat-cambios">
          <span class="stat-value">{{ estadisticas.conCambios }}</span>
          <span class="stat-text">Con Cambios</span>
        </div>
        <div class="stat-badge stat-eliminados">
          <span class="stat-value">{{ estadisticas.eliminados }}</span>
          <span class="stat-text">Eliminados</span>
        </div>
      </div>

      <!-- Filtros de visualización -->
      <div class="mb-3 d-flex gap-2 flex-wrap">
        <b-button size="sm" :variant="filtroActual === 'todos' ? 'primary' : 'outline-primary'"
          @click="filtroActual = 'todos'">Todos</b-button>
        <b-button size="sm" :variant="filtroActual === 'nuevos' ? 'success' : 'outline-success'"
          @click="filtroActual = 'nuevos'">Nuevos</b-button>
        <b-button size="sm" :variant="filtroActual === 'cambios' ? 'warning' : 'outline-warning'"
          @click="filtroActual = 'cambios'">Con Cambios</b-button>
        <b-button size="sm" :variant="filtroActual === 'eliminados' ? 'danger' : 'outline-danger'"
          @click="filtroActual = 'eliminados'">Eliminados</b-button>
      </div>

      <!-- Tabla de Resultados -->
      <b-card class="shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">📊 Resultados de la Comparación</h5>
          <b-button variant="success" size="sm" class="download-btn" @click="descargarExcel">
            💾 Descargar Reporte
          </b-button>
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Estado</th>
                <th>Producto</th>
                <th>Detalles</th>
                <th>P. Farmacia</th>
                <th>PVP</th>
                <th>Promoción</th>
                <th>Desc.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(producto, index) in productosFiltrados" :key="index" :class="getRowClass(producto)">
                <!-- Estado -->
                <td>
                  <b-badge :variant="getEstadoBadgeVariant(producto.estado)" class="mb-1">
                    {{ producto.estado.toUpperCase() }}
                  </b-badge>
                  <div v-if="producto.tieneCambios" class="mt-1">
                    <b-badge variant="warning" class="text-dark" style="font-size: 0.7rem;">
                      Modificado
                    </b-badge>
                  </div>
                </td>

                <!-- Producto -->
                <td>
                  <div class="fw-bold">{{ producto.Nombre }}</div>
                  <div class="small text-muted">{{ producto.Marca }}</div>
                  <div class="small text-muted" style="font-size: 0.75rem;">COD: {{ producto.CODIGO }}</div>
                </td>

                <!-- Detalles -->
                <td>
                  <div class="small">{{ producto.Presentacion }}</div>
                  <div class="small text-muted fst-italic">{{ producto.Principio_Activo }}</div>
                 <div v-if="producto.Tipo" class="small text-info fw-bold">{{ producto.Tipo }}</div>
                </td>

                <!-- P. Farmacia -->
                <td>
                  <div :class="{ 'text-primary fw-bold': producto.cambios?.P_Farmacia }">
                    ${{ formatPrice(producto.P_Farmacia) }}
                  </div>
                  <div v-if="producto.cambios?.P_Farmacia" class="text-muted text-decoration-line-through small">
                    Ant: ${{ formatPrice(producto.cambios.P_Farmacia.anterior) }}
                  </div>
                </td>

                <!-- PVP -->
                <td>
                  <div :class="{ 'text-primary fw-bold': producto.cambios?.PVP }">
                    ${{ formatPrice(producto.PVP) }}
                  </div>
                  <div v-if="producto.cambios?.PVP" class="text-muted text-decoration-line-through small">
                    Ant: ${{ formatPrice(producto.cambios.PVP.anterior) }}
                  </div>
                </td>

                <!-- Promoción -->
                <td>
                  <div :class="{ 'text-primary fw-bold': producto.cambios?.Promocion }">
                    {{ producto.Promocion || '-' }}
                  </div>
                  <div v-if="producto.cambios?.Promocion" class="text-muted text-decoration-line-through small">
                    Ant: {{ producto.cambios.Promocion.anterior || '-' }}
                  </div>
                </td>

                <!-- Descuento -->
                <td>
                  <div :class="{ 'text-primary fw-bold': producto.cambios?.Descuento }">
                    {{ producto.Descuento ? producto.Descuento + '%' : '-' }}
                  </div>
                  <div v-if="producto.cambios?.Descuento" class="text-muted text-decoration-line-through small">
                    Ant: {{ producto.cambios.Descuento.anterior ? producto.cambios.Descuento.anterior + '%' : '-' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-muted mt-3 text-center small">
          Mostrando {{ productosFiltrados.length }} de {{ todosProductos.length }} registros
        </div>
      </b-card>
    </div>

    <!-- Estado vacío -->
    <b-card v-else-if="!cargando" class="text-center py-5 shadow-sm">
      <div style="font-size: 4rem; color: #6c757d;">⚖️</div>
      <h5 class="text-muted mt-3">Comparador de Productos</h5>
      <p class="text-muted mb-0">Carga un nuevo Excel para compararlo con la base de datos actual.</p>
    </b-card>

    <!-- Loading -->
    <div v-if="cargando" class="text-center py-5">
      <b-spinner variant="primary" style="width: 3rem; height: 3rem;"></b-spinner>
      <p class="text-muted mt-3">Procesando y comparando archivo...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import alertify from 'alertifyjs';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { useProductos } from '@/composables/useProductos';

const toast = useToast();
const { productos: allProductos } = useProductos();
const fileInput = ref(null);
const cargando = ref(false);
const erroresValidacion = ref([]);
const todosProductos = ref([]);
const filtroActual = ref('todos');
const fileLoadError = ref('');

// Utilidad para formatear precios a 3 decimales
const formatPrice = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '0.000' : num.toFixed(3);
};

// Normalizar texto para claves (ELIMINAR TODOS LOS ESPACIOS)
const normalize = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, '');

// Generar clave única del producto
const generarClave = (p) => {
  return `${normalize(p.Marca)}|${normalize(p.Nombre)}|${normalize(p.Presentacion)}|${normalize(p.Principio_Activo)}`;
};

// Validar producto básico
const validarProducto = (producto, fila) => {
  const errores = [];
  if (!producto.Marca) errores.push('Marca requerida');
  if (!producto.Nombre) errores.push('Nombre requerido');

  return errores.length > 0 ? { fila, producto, errores } : null;
};

// Manejar carga de archivo
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  cargando.value = true;
  erroresValidacion.value = [];
  todosProductos.value = [];
  fileLoadError.value = '';

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      fileLoadError.value = 'El archivo Excel está vacío o no tiene un formato válido.';
      toast.error('El archivo Excel está vacío');
      cargando.value = false;
      return;
    }

    // 1. Validar estructura básica del Excel
    const errores = [];
    jsonData.forEach((producto, index) => {
      const error = validarProducto(producto, index + 2);
      if (error) errores.push(error);
    });

    if (errores.length > 0) {
      erroresValidacion.value = errores;
      toast.error(`❌ Se encontraron ${errores.length} errores de validación`);
      cargando.value = false;
      return;
    }

    // 2. Cargar productos existentes de la base de datos reactiva
    const productosBD = allProductos.value;

    // Mapa de productos existentes para búsqueda rápida
    const mapaExistentes = new Map();
    productosBD.forEach(p => {
      const pNormalizado = {
        Marca: p.Marca,
        Nombre: p.NombreProducto || p.Nombre,
        Presentacion: p.Presentacion,
        Principio_Activo: p.PrincipioActivo || p.Principio_Activo,
        P_Farmacia: p.PrecioFarmacia || p.P_Farmacia,
        PVP: p.PVP,
        Promocion: p.Promocion,
        Descuento: p.Descuento,
        IVA: p.IVA,
        CODIGO: p.Codigo || p.CODIGO
      };
      mapaExistentes.set(generarClave(pNormalizado), pNormalizado);
    });

    const resultados = [];
    const clavesProcesadasExcel = new Set();

    // 3. Procesar Excel (Identificar Nuevos y Existentes con Cambios)
    jsonData.forEach(productoExcel => {
      const clave = generarClave(productoExcel);
      clavesProcesadasExcel.add(clave);

      const productoExistente = mapaExistentes.get(clave);

      if (productoExistente) {
        // EXISTE: Verificar cambios
        const cambios = {};
        let tieneCambios = false;

        // Comparar precios (3 decimales)
        const pFarmaciaExcel = parseFloat(parseFloat(productoExcel.P_Farmacia || 0).toFixed(3));
        const pFarmaciaBD = parseFloat(parseFloat(productoExistente.P_Farmacia || 0).toFixed(3));

        if (pFarmaciaExcel !== pFarmaciaBD) {
          cambios.P_Farmacia = { anterior: pFarmaciaBD.toFixed(3), nuevo: pFarmaciaExcel.toFixed(3) };
          tieneCambios = true;
        }

        const pvpExcel = parseFloat(parseFloat(productoExcel.PVP || 0).toFixed(3));
        const pvpBD = parseFloat(parseFloat(productoExistente.PVP || 0).toFixed(3));

        if (pvpExcel !== pvpBD) {
          cambios.PVP = { anterior: pvpBD.toFixed(3), nuevo: pvpExcel.toFixed(3) };
          tieneCambios = true;
        }

        // Comparar Promoción
        const promoExcel = normalize(productoExcel.Promocion);
        const promoBD = normalize(productoExistente.Promocion);
        if (promoExcel !== promoBD) {
          cambios.Promocion = { anterior: productoExistente.Promocion, nuevo: productoExcel.Promocion };
          tieneCambios = true;
        }

        // Comparar Descuento
        const descExcel = parseFloat(productoExcel.Descuento || 0);
        const descBD = parseFloat(productoExistente.Descuento || 0);
        if (descExcel !== descBD) {
          cambios.Descuento = { anterior: productoExistente.Descuento, nuevo: productoExcel.Descuento };
          tieneCambios = true;
        }

        // Comparar Tipo
        const tipoExcel = normalize(productoExcel.Tipo);
        const tipoBD = normalize(productoExistente.Tipo);
        if (tipoExcel !== tipoBD) {
          cambios.Tipo = { anterior: productoExistente.Tipo || '', nuevo: productoExcel.Tipo || '' };
          tieneCambios = true;
        }

        // Comparar Observacion
        const obsExcel = normalize(productoExcel.Observacion);
        const obsBD = normalize(productoExistente.Observacion);
        if (obsExcel !== obsBD) {
          cambios.Observacion = { anterior: productoExistente.Observacion || '', nuevo: productoExcel.Observacion || '' };
          tieneCambios = true;
        }

        resultados.push({
          ...productoExcel,
          P_Farmacia: pFarmaciaExcel,
          PVP: pvpExcel,
          estado: 'existe',
          tieneCambios,
          cambios
        });

      } else {
        // NUEVO
        resultados.push({
          ...productoExcel,
          P_Farmacia: parseFloat(parseFloat(productoExcel.P_Farmacia || 0).toFixed(3)),
          PVP: parseFloat(parseFloat(productoExcel.PVP || 0).toFixed(3)),
          estado: 'nuevo',
          tieneCambios: false,
          cambios: null
        });
      }
    });

    // 4. Identificar marcas presentes en el Excel
    const marcasEnExcel = new Set();
    jsonData.forEach(producto => {
      if (producto.Marca) {
        marcasEnExcel.add(normalize(producto.Marca));
      }
    });

    // 5. Identificar Eliminados (SOLO de las marcas presentes en el Excel)
    mapaExistentes.forEach((prodBD, clave) => {
      if (!clavesProcesadasExcel.has(clave)) {
        const marcaBD = normalize(prodBD.Marca);
        // Solo marcar como eliminado si la marca del producto está en el Excel
        if (marcasEnExcel.has(marcaBD)) {
          resultados.push({
            ...prodBD,
            P_Farmacia: parseFloat(parseFloat(prodBD.P_Farmacia || 0).toFixed(3)),
            PVP: parseFloat(parseFloat(prodBD.PVP || 0).toFixed(3)),
            estado: 'eliminado',
            tieneCambios: false,
            cambios: null
          });
        }
        // Si la marca NO está en el Excel, se ignora completamente
      }
    });

    todosProductos.value = resultados;
    toast.success(`✅ Comparación completada: ${resultados.length} productos procesados`);

  } catch (error) {
    console.error('Error al procesar:', error);
    fileLoadError.value = 'Ocurrió un error al procesar el archivo. Asegúrate de que sea un Excel válido.';
    toast.error('Error al procesar el archivo Excel');
  } finally {
    cargando.value = false;
  }
};

// Limpiar
const limpiar = () => {
  alertify.confirm(
    "Limpiar Comparación",
    "¿Estás seguro de que deseas limpiar todos los datos de la comparación?",
    () => {
      todosProductos.value = [];
      erroresValidacion.value = [];
      if (fileInput.value) fileInput.value.value = '';
      filtroActual.value = 'todos';
      toast.info("Datos limpiados");
    },
    () => {
      // Cancel action
    }
  ).set('labels', { ok: 'Sí, Limpiar', cancel: 'Cancelar' });
};

// Estadísticas
const estadisticas = computed(() => {
  return {
    nuevos: todosProductos.value.filter(p => p.estado === 'nuevo').length,
    existentes: todosProductos.value.filter(p => p.estado === 'existe').length,
    conCambios: todosProductos.value.filter(p => p.tieneCambios).length,
    eliminados: todosProductos.value.filter(p => p.estado === 'eliminado').length
  };
});

// Filtros
const productosFiltrados = computed(() => {
  if (filtroActual.value === 'todos') return todosProductos.value;
  if (filtroActual.value === 'nuevos') return todosProductos.value.filter(p => p.estado === 'nuevo');
  if (filtroActual.value === 'cambios') return todosProductos.value.filter(p => p.tieneCambios);
  if (filtroActual.value === 'eliminados') return todosProductos.value.filter(p => p.estado === 'eliminado');
  return todosProductos.value;
});

// Estilos
const getRowClass = (producto) => {
  if (producto.estado === 'nuevo') return 'table-success-custom';
  if (producto.estado === 'eliminado') return 'table-danger-custom';
  if (producto.tieneCambios) return 'table-warning-custom';
  return '';
};

const getEstadoBadgeVariant = (estado) => {
  if (estado === 'nuevo') return 'success';
  if (estado === 'eliminado') return 'danger';
  if (estado === 'existe') return 'secondary';
  return 'light';
};

// Descargar Excel de Reporte con ExcelJS
const descargarExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Comparacion');

    // Identificar columnas dinámicas (extras) que vienen del Excel
    const standardKeys = new Set(['Estado', 'Modificado', 'CODIGO', 'Marca', 'Nombre', 'Presentacion', 'Principio_Activo', 'P_Farmacia', 'PVP', 'Promocion', 'Descuento', 'IVA', 'Detalle_Cambios', 'Tipo', 'Observacion']);
    const internalKeys = new Set(['estado', 'tieneCambios', 'cambios', 'fila', 'id', '_id', '__v']); // Claves internas a ignorar

    // Recopilar todas las claves posibles de los productos
    const extraKeys = new Set();
    todosProductos.value.forEach(p => {
      Object.keys(p).forEach(k => {
        // Mapear nombres de columnas si es necesario o usar la clave directa
        // Ignorar si es una columna estándar o interna
        if (!internalKeys.has(k) &&
          !['CODIGO', 'Marca', 'Nombre', 'Presentacion', 'Principio_Activo', 'P_Farmacia', 'PVP', 'Promocion', 'Descuento', 'IVA', 'Tipo', 'Observacion'].includes(k)) {
          extraKeys.add(k);
        }
      });
    });

    const sortedExtraKeys = Array.from(extraKeys).sort();

    // Definir columnas base
    const columns = [
      { header: 'Estado', key: 'Estado', width: 15 },
      { header: 'Modificado', key: 'Modificado', width: 12 },
      { header: 'CODIGO', key: 'CODIGO', width: 15 },
      { header: 'Marca', key: 'Marca', width: 20 },
      { header: 'Nombre', key: 'Nombre', width: 30 },
      { header: 'Presentacion', key: 'Presentacion', width: 25 },
      { header: 'Principio_Activo', key: 'Principio_Activo', width: 25 },
      { header: 'Tipo', key: 'Tipo', width: 20 },
      { header: 'P_Farmacia', key: 'P_Farmacia', width: 15 },
      { header: 'PVP', key: 'PVP', width: 15 },
      { header: 'Promocion', key: 'Promocion', width: 20 },
      { header: 'Descuento', key: 'Descuento', width: 15 },
      { header: 'IVA', key: 'IVA', width: 10 },
      { header: 'Observacion', key: 'Observacion', width: 25 },
      { header: 'Detalle Cambios', key: 'Detalle_Cambios', width: 40 },
    ];

    // Agregar columnas extras al final
    sortedExtraKeys.forEach(key => {
      columns.push({ header: key, key: key, width: 20 });
    });

    worksheet.columns = columns;

    // Estilo Header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Azul
    };

    // Obtener productos de la BD reactiva
    const productosBD = allProductos.value;

    // Identificar marcas comparadas en el Excel
    const marcasComparadas = new Set();
    todosProductos.value.forEach(p => {
      if (p.Marca) {
        marcasComparadas.add(normalize(p.Marca));
      }
    });

    // Crear mapa de productos comparados por clave única
    const productosComparadosMap = new Map();
    todosProductos.value.forEach(p => {
      const clave = generarClave(p);
      productosComparadosMap.set(clave, p);
    });

    // Combinar: productos comparados + productos de BD no comparados
    const productosParaExportar = [];

    // 1. Agregar todos los productos comparados (del Excel)
    productosParaExportar.push(...todosProductos.value);

    // 2. Agregar productos de BD que NO fueron comparados (marcas diferentes)
    productosBD.forEach(prodBD => {
      const marcaBD = normalize(prodBD.Marca);

      // Si la marca NO está en las marcas comparadas, agregar como "sin cambios"
      if (!marcasComparadas.has(marcaBD)) {
        const clave = generarClave({
          Marca: prodBD.Marca,
          Nombre: prodBD.NombreProducto || prodBD.Nombre,
          Presentacion: prodBD.Presentacion,
          Principio_Activo: prodBD.PrincipioActivo || prodBD.Principio_Activo
        });

        // Verificar que no esté ya en los comparados
        if (!productosComparadosMap.has(clave)) {
          productosParaExportar.push({
            CODIGO: prodBD.Codigo || prodBD.CODIGO,
            Marca: prodBD.Marca,
            Nombre: prodBD.NombreProducto || prodBD.Nombre,
            Presentacion: prodBD.Presentacion,
            Principio_Activo: prodBD.PrincipioActivo || prodBD.Principio_Activo,
            P_Farmacia: prodBD.PrecioFarmacia || prodBD.P_Farmacia,
            PVP: prodBD.PVP,
            Promocion: prodBD.Promocion,
            Descuento: prodBD.Descuento,
            IVA: prodBD.IVA,
            estado: 'sin_comparar',
            tieneCambios: false,
            cambios: null
          });
        }
      }
    });

    // Ordenar por Marca y luego por Nombre
    productosParaExportar.sort((a, b) => {
      const marcaComp = (a.Marca || '').localeCompare(b.Marca || '');
      if (marcaComp !== 0) return marcaComp;
      return (a.Nombre || '').localeCompare(b.Nombre || '');
    });

    // Agregar filas
    productosParaExportar.forEach(p => {
      const rowData = {
        Estado: p.estado === 'sin_comparar' ? 'SIN COMPARAR' : p.estado.toUpperCase(),
        Modificado: p.tieneCambios ? 'SI' : 'NO',
        CODIGO: p.CODIGO,
        Marca: p.Marca,
        Nombre: p.Nombre,
        Presentacion: p.Presentacion,
        Principio_Activo: p.Principio_Activo,
        P_Farmacia: parseFloat(p.P_Farmacia || 0).toFixed(3),
        PVP: parseFloat(p.PVP || 0).toFixed(3),
        Promocion: p.Promocion,
        Descuento: p.Descuento,
        IVA: p.IVA || 0,
        Detalle_Cambios: [
          p.cambios?.P_Farmacia ? `Precio: ${p.cambios.P_Farmacia.anterior} -> ${p.cambios.P_Farmacia.nuevo}` : '',
          p.cambios?.PVP ? `PVP: ${p.cambios.PVP.anterior} -> ${p.cambios.PVP.nuevo}` : '',
          p.cambios?.Promocion ? `Promo: ${p.cambios.Promocion.anterior} -> ${p.cambios.Promocion.nuevo}` : '',
          p.cambios?.Descuento ? `Desc: ${p.cambios.Descuento.anterior} -> ${p.cambios.Descuento.nuevo}` : '',
          p.cambios?.Tipo ? `Tipo: ${p.cambios.Tipo.anterior} -> ${p.cambios.Tipo.nuevo}` : '',
          p.cambios?.Observacion ? `Obs: ${p.cambios.Observacion.anterior} -> ${p.cambios.Observacion.nuevo}` : ''
        ].filter(Boolean).join(' | '),
        Tipo: p.Tipo || '',
        Observacion: p.Observacion || ''
      };

      // Agregar datos de columnas extras
      sortedExtraKeys.forEach(key => {
        // Asegurarse de que el valor exista y no sea undefined/null para evitar errores, aunque ExcelJS maneja nulls
        rowData[key] = p[key] !== undefined && p[key] !== null ? p[key] : '';
      });

      const row = worksheet.addRow(rowData);

      // Colorear filas según estado
      let fillColor = null;
      if (p.estado === 'nuevo') {
        fillColor = 'FFC6EFCE'; // Verde claro
      } else if (p.estado === 'eliminado') {
        fillColor = 'FFFFC7CE'; // Rojo claro
      } else if (p.tieneCambios) {
        fillColor = 'FFFFEB9C'; // Amarillo claro
      } else if (p.estado === 'sin_comparar') {
        fillColor = 'FFE7E6E6'; // Gris claro
      }

      if (fillColor) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
        });
      }
    });

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Descargar
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fecha = new Date().toISOString().split('T')[0];
    link.download = `Reporte_Comparacion_${fecha}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(`✅ Reporte descargado: ${productosParaExportar.length} productos totales`);
  } catch (error) {
    console.error('Error exportar:', error);
    toast.error('Error al generar reporte');
  }
};
</script>

<style scoped>
.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-weight: 800;
  font-size: 1.1rem;
}

.stat-text {
  font-size: 0.85rem;
  opacity: 0.9;
}

.stat-total {
  background: #6c757d;
}

.stat-nuevos {
  background: #28a745;
}

.stat-existentes {
  background: #17a2b8;
}

.stat-cambios {
  background: #ffc107;
  color: #333;
}

.stat-eliminados {
  background: #dc3545;
}

.stat-error {
  background: #dc3545;
}

.table-success-custom {
  background-color: #e8f5e9 !important;
}

.table-danger-custom {
  background-color: #ffebee !important;
  opacity: 0.7;
}

.table-warning-custom {
  background-color: #fff3e0 !important;
}

.download-btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
