<template>
  <div class="excel-handler">
    <!-- Spinner de carga -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-container">
        <b-spinner variant="primary" style="width: 4rem; height: 4rem;"></b-spinner>
        <p class="mt-3 text-white fw-bold">{{ loadingMessage }}</p>
      </div>
    </div>

    <b-card title="📊 Importar Productos desde Excel" class="shadow-sm main-card">
      <b-form-group label="Subir archivo Excel:">
        <div class="custom-file-upload">
          <label for="excel-file" class="file-upload-label">
            <div class="file-upload-content">
              <span class="file-upload-icon">📁</span>
              <span class="file-upload-text">
                {{
                  file
                    ? file.name
                    : "Haz clic para seleccionar un archivo Excel"
                }}
              </span>
            </div>
          </label>
          <input id="excel-file" type="file" accept=".xlsx, .xls" @change="handleFileUpload"
            class="file-input-hidden" />
        </div>
        <small class="text-muted mt-2 d-block">
         <strong>Columnas:</strong> CODIGO, Marca, Nombre,
         Presentacion, Principio_Activo, Tipo, P_Farmacia, PVP, Promocion, Descuento,
         IVA, Observacion (Opcional)
        </small>
      </b-form-group>

      <!-- Alerta de error de carga -->
      <b-alert v-if="fileLoadError" show variant="danger" class="mb-3" dismissible @dismissed="fileLoadError = ''">
        <h5 class="alert-heading">❌ Error al cargar el archivo</h5>
        <p class="mb-2">{{ fileLoadError }}</p>

        <div v-if="missingColumns.length > 0" class="mt-2">
          <p class="mb-1 font-weight-bold">El archivo debe tener las siguientes columnas exactas:</p>
          <ul class="mb-0 small">
            <li>CODIGO</li>
            <li>Marca</li>
            <li>Nombre</li>
            <li>Presentacion</li>
            <li>Principio_Activo</li>
           <li>Tipo</li>
            <li>P_Farmacia</li>
            <li>PVP</li>
            <li>Promocion</li>
            <li>Descuento</li>
            <li>IVA</li>
            <li>Observacion (Opcional)</li>
          </ul>
          <p class="mt-2 mb-0 small text-muted">
            Columnas faltantes detectadas: <strong>{{ missingColumns.join(', ') }}</strong>
          </p>
        </div>
      </b-alert>

      <!-- Info de productos existentes -->
      <div v-if="productosEnSistema > 0"
        style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <div class="d-flex justify-content-center align-items-center flex-wrap gap-2">
          <div>
            <strong>📦 Productos en sistema:</strong> {{ productosEnSistema }}
          </div>
          <div class="d-flex gap-2 flex-wrap align-items-center justify-content-center">
            <b-button variant="success" size="sm" @click="descargarProductosExcel">
              📥 Descargar Excel
            </b-button>
            <b-button variant="danger" size="sm" @click="borrarTodosLosProductos">
              🗑️ Borrar Todos
            </b-button>
          </div>
        </div>
      </div>

      <div v-if="productos.length" class="mt-3">
        <!-- Resumen y acciones -->
        <div
          class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-3 gap-3 flex-wrap">
          <div class="w-100">
            <h5 class="mb-1">📦 Productos Cargados: {{ productos.length }}</h5>
            <div class="d-flex gap-2 flex-wrap">
              <b-badge variant="success"> ✓ {{ validCount }} Válidos </b-badge>
              <b-badge v-if="duplicateCount > 0" variant="danger">
                ⚠ {{ duplicateCount }} Duplicados
              </b-badge>
              <b-badge v-if="errorCount > 0" variant="warning">
                ❌ {{ errorCount }} Con Errores
              </b-badge>
            </div>
          </div>
          <div class="d-grid gap-2 d-sm-flex w-100 justify-content-lg-end flex-wrap">
            <b-button variant="outline-secondary" size="sm" @click="cancelarCarga">
              ✕ Cancelar
            </b-button>
            <b-button variant="primary" size="sm" @click="confirmarGuardar" :disabled="productos.length === 0">
              💾 Guardar Productos
            </b-button>
          </div>
        </div>

        <!-- Filtros -->
        <b-card class="mb-3 bg-light">
          <b-row class="g-2">
            <b-col cols="12" md="4">
              <b-form-input v-model="searchText" placeholder="🔍 Buscar por código, nombre, marca..." size="sm" />
            </b-col>
            <b-col cols="12" md="3">
              <b-form-select v-model="filterMarca" size="sm">
                <option value="">📦 Todas las marcas</option>
                <option v-for="marca in marcasUnicas" :key="marca" :value="marca">
                  {{ marca }}
                </option>
              </b-form-select>
            </b-col>
            <b-col cols="12" md="3">
              <b-form-select v-model="filterStatus" size="sm">
                <option value="all">📋 Todos</option>
                <option value="valid">✓ Solo válidos</option>
                <option value="duplicates">⚠ Solo duplicados</option>
                <option value="errors">❌ Solo con errores</option>
              </b-form-select>
            </b-col>
            <b-col cols="12" md="2">
              <b-button variant="outline-secondary" size="sm" class="w-100" @click="limpiarFiltros">
                🔄 Limpiar
              </b-button>
            </b-col>
          </b-row>
        </b-card>

        <!-- Grid de tarjetas -->
        <div class="row mb-4">
          <div v-for="producto in productosFiltrados" :key="producto.CODIGO + Math.random()"
            class="col-12 col-sm-6 col-md-4 col-lg-3 mb-2">
            <b-card :class="getCardClass(producto)" class="h-100 producto-card">
              <!-- Header -->
              <template #header>
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <b-badge :variant="getStatusBadgeVariant(producto)" class="px-2 py-1">
                    {{ getStatusText(producto) }}
                  </b-badge>
                </div>
              </template>

              <!-- Contenido -->
              <h6 class="card-title mb-2">{{ producto.Nombre }}</h6>

              <div class="product-info">
                <div class="mb-1 d-flex flex-wrap gap-2">
                  <strong>Marca: </strong> {{ producto.Marca || "" }}
                </div>

                <div class="mb-1 d-flex flex-wrap gap-2">
                  <strong>Presentación:</strong>
                  {{ producto.Presentacion || "" }}
                </div>


                <div class="mb-1 d-flex flex-wrap gap-2">
                  <strong>Principio Activo: </strong> {{ producto.Principio_Activo || "" }}
                </div>

                <hr class="my-2" />



                <b-badge variant="info" class="px-2">
                  P. Farmacia:
                  ${{ Number(producto.P_Farmacia || 0).toFixed(3) }}
                </b-badge>

                <b-badge variant="info" class="px-2">
                  PVP: ${{ Number(producto.PVP || 0).toFixed(3) }}
                </b-badge>

                <b-badge :variant="producto.IVA >= 0 && producto.IVA <= 100
                  ? 'info'
                  : 'danger'
                  " class="px-2"> IVA:
                  {{ producto.IVA }}%
                </b-badge>




                <b-badge v-if="producto.Descuento" variant="warning" class="px-2">Descuento: {{ producto.Descuento
                }}%</b-badge>
              </div>


              <!-- Errores -->
              <div v-if="producto.errors.length > 0" class="mt-2 error-box">
                <small class="text-danger d-block fw-bold mb-1">Errores:</small>
                <small class="text-danger d-block" v-for="(error, idx) in producto.errors" :key="idx">
                  • {{ error }}
                </small>
              </div>
            </b-card>
          </div>
        </div>

        <!-- Información de ayuda -->
        <b-alert show variant="info" class="small">
          <strong>ℹ️ Códigos de color:</strong>
          <ul class="mb-0 mt-2">
            <li>
              <strong style="color: #28a745">🟢 Verde:</strong> Producto válido
              sin errores
            </li>
            <li>
              <strong style="color: #ffc107">🟡 Amarillo:</strong> Producto
              duplicado (código repetido)
            </li>
            <li>
              <strong style="color: #dc3545">🔴 Rojo:</strong> Producto con
              errores de validación
            </li>
          </ul>
        </b-alert>
      </div>

      <div v-else class="text-center text-muted py-5">
        <div style="font-size: 3rem">📊</div>
        <p class="mt-3">
          No hay productos cargados. Selecciona un archivo Excel para comenzar.
        </p>
      </div>
    </b-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useExcelHandler } from "@/utils/excelHandler";
import { useToast } from "vue-toastification";
import alertify from "alertifyjs";
import { useProductos } from '@/composables/useProductos';

const { readExcelHandler } = useExcelHandler();
const toast = useToast();
const { productos: productosDB, addProducto, bulkAddProductos, loadProductos, clearAllProductos } = useProductos();

const file = ref(null);
const productos = ref([]);
const searchText = ref("");
const filterMarca = ref("");
const filterStatus = ref("all");
const productosEnSistema = ref(0);
const fileLoadError = ref("");
const missingColumns = ref([]);
const isLoading = ref(false);
const loadingMessage = ref("");

const fields = [
  { key: "CODIGO", label: "Código", sortable: true },
  { key: "Marca", label: "Marca", sortable: true },
  { key: "Nombre", label: "Nombre", sortable: true },
  { key: "Presentacion", label: "Presentación" },
  { key: "Principio_Activo", label: "Principio Activo" },
  { key: "Tipo", label: "Tipo" },
  { key: "P_Farmacia", label: "P. Farmacia", sortable: true },
  { key: "PVP", label: "PVP", sortable: true },
  { key: "Promocion", label: "Promoción" },
  { key: "Observacion", label: "Observación" },
  { key: "Descuento", label: "Desc.", sortable: true },
  { key: "IVA", label: "IVA", sortable: true },
  { key: "Estado", label: "Estado" },
];

const marcasUnicas = computed(() => {
  const marcas = new Set();
  productos.value.forEach((p) => {
    if (p.Marca) marcas.add(p.Marca);
  });
  return Array.from(marcas).sort();
});

const duplicateCount = computed(() => {
  return productos.value.filter((p) => p.isDuplicate).length;
});

const errorCount = computed(() => {
  return productos.value.filter((p) => p.hasErrors).length;
});

const validCount = computed(() => {
  return productos.value.filter((p) => !p.isDuplicate && !p.hasErrors).length;
});

const productosFiltrados = computed(() => {
  let result = productos.value;

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(
      (p) =>
        String(p.CODIGO || "")
          .toLowerCase()
          .includes(search) ||
        String(p.Nombre || "")
          .toLowerCase()
          .includes(search) ||
        String(p.Marca || "")
          .toLowerCase()
          .includes(search) ||
        String(p.Principio_Activo || "")
          .toLowerCase()
          .includes(search)
    );
  }

  if (filterMarca.value) {
    result = result.filter((p) => p.Marca === filterMarca.value);
  }

  if (filterStatus.value === "valid") {
    result = result.filter((p) => !p.isDuplicate && !p.hasErrors);
  } else if (filterStatus.value === "duplicates") {
    result = result.filter((p) => p.isDuplicate);
  } else if (filterStatus.value === "errors") {
    result = result.filter((p) => p.hasErrors);
  }

  return result;
});

const rowClass = (item) => {
  if (!item) return "";
  if (item.hasErrors) return "table-warning";
  if (item.isDuplicate) return "table-danger";
  return "table-success";
};

const getStatusVariant = (item) => {
  if (item.hasErrors) return "warning";
  if (item.isDuplicate) return "danger";
  return "secondary";
};

const getStatusBadgeVariant = (item) => {
  if (item.hasErrors) return "warning";
  if (item.isDuplicate) return "danger";
  return "success";
};

const getStatusText = (item) => {
  if (item.hasErrors) return "❌ Error";
  if (item.isDuplicate) return "⚠ Duplicado";
  return "✓ Válido";
};

const getCardClass = (item) => {
  if (item.hasErrors) return "border-danger card-error";
  if (item.isDuplicate) return "border-warning card-duplicate";
  return "border-success card-valid";
};

const validateProduct = (producto) => {
  const errors = [];

  // Solo validar campos obligatorios: Marca, Nombre
  if (!producto.Nombre) errors.push("Nombre vacío");
  if (!producto.Marca) errors.push("Marca vacía");

  // Validar precios (obligatorios)
  if (isNaN(producto.P_Farmacia) || producto.P_Farmacia < 0) {
    errors.push("Precio inválido");
  }
  if (isNaN(producto.PVP) || producto.PVP < 0) {
    errors.push("PVP inválido");
  }

  // Validar IVA (obligatorio)
  if (isNaN(producto.IVA) || producto.IVA < 0 || producto.IVA > 100) {
    errors.push("IVA inválido");
  }

  return errors;
};

const handleFileUpload = async (event) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  file.value = selectedFile;

  const fileName = selectedFile.name.toLowerCase();
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    fileLoadError.value = "Por favor selecciona un archivo Excel válido (.xlsx o .xls)";
    toast.error(
      "❌ Por favor selecciona un archivo Excel válido (.xlsx o .xls)"
    );
    file.value = null;
    return;
  }

  isLoading.value = true;
  loadingMessage.value = "📖 Leyendo archivo Excel...";
  fileLoadError.value = "";
  missingColumns.value = [];

  // Esperar a que Vue actualice el DOM para mostrar el spinner
  await nextTick();

  // Dar un pequeño delay para asegurar que el spinner se renderice
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const { readExcelFile } = useExcelHandler();
    const data = await readExcelFile(selectedFile);

    if (data.length < 2) {
      fileLoadError.value = "El archivo Excel está vacío o no tiene datos.";
      toast.error("❌ El archivo Excel está vacío o no tiene datos");
      return;
    }

    const headers = data[0];
    const requiredColumns = [
      "CODIGO",
      "Marca",
      "Nombre",
      "Presentacion",
      "Principio_Activo",
      "P_Farmacia",
      "PVP",
      "Promocion",
      "Descuento",
      "IVA"
    ];

    const missing = requiredColumns.filter(
      (col) => !headers.includes(col)
    );
    if (missing.length > 0) {
      missingColumns.value = missing;
      fileLoadError.value = "El archivo no tiene el formato correcto. Faltan columnas requeridas.";
      toast.error(
        `❌ Estructura incorrecta. Faltan columnas: ${missing.join(
          ", "
        )}`
      );
      file.value = null;
      return;
    }

    loadingMessage.value = "✅ Validando estructura...";

    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });

    const parsedProducts = [];
    // Objeto para rastrear productos por su clave única normalizada
    const productoKeys = {};

    // Función para normalizar strings
    const normalizeString = (str) => String(str || "").replace(/\s+/g, "").toLowerCase();

    // Cargar productos existentes de IndexedDB y agregarlos al mapa de claves
    productosDB.value.forEach(p => {
      const productKey = `${normalizeString(p.Marca)}-${normalizeString(p.NombreProducto)}-${normalizeString(p.Presentacion)}-${normalizeString(p.PrincipioActivo)}`;
      productoKeys[productKey] = { existing: true }; // Marcar como existente en sistema
    });

    loadingMessage.value = "📦 Procesando productos...";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const codigo = row[colIndices["CODIGO"]];

      const producto = {
        CODIGO: codigo || "",
        Marca: row[colIndices["Marca"]] || "",
        Nombre: row[colIndices["Nombre"]] || "",
        Presentacion: row[colIndices["Presentacion"]] || "",
        Principio_Activo: row[colIndices["Principio_Activo"]] || "",
        Tipo: row[colIndices["Tipo"]] || "",
        P_Farmacia: parseFloat(parseFloat(row[colIndices["P_Farmacia"]] || 0).toFixed(3)),
        PVP: parseFloat(parseFloat(row[colIndices["PVP"]] || 0).toFixed(3)),
        Promocion: row[colIndices["Promocion"]] || "",
        Observacion: row[colIndices["Observacion"]] || "",
        Descuento: parseFloat(row[colIndices["Descuento"]]) || 0,
        IVA: parseFloat(row[colIndices["IVA"]]) || 0,
        isDuplicate: false,
        hasErrors: false,
        errors: [],
      };

      producto.errors = validateProduct(producto);
      producto.hasErrors = producto.errors.length > 0;

      // Generar clave única normalizada (sin espacios, en minúsculas)
      const productKey = `${normalizeString(producto.Marca)}-${normalizeString(producto.Nombre)}-${normalizeString(producto.Presentacion)}-${normalizeString(producto.Principio_Activo)}`;

      // Verificar si ya existe un producto con esta combinación
      if (productoKeys[productKey]) {
        producto.isDuplicate = true;
        // Si no es un producto existente del sistema, marcar también el original como duplicado
        if (!productoKeys[productKey].existing) {
          productoKeys[productKey].isDuplicate = true;
        }
      } else {
        // Guardar referencia al primer producto con esta clave
        productoKeys[productKey] = producto;
      }

      parsedProducts.push(producto);
    }

    productos.value = parsedProducts;

    const validProducts = parsedProducts.filter(
      (p) => !p.isDuplicate && !p.hasErrors
    ).length;
    toast.success(
      `📦 ${parsedProducts.length} productos cargados: ${validProducts} válidos, ${duplicateCount.value} duplicados, ${errorCount.value} con errores`,
      {
        timeout: 1000,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    fileLoadError.value = "Ocurrió un error al procesar el archivo Excel. Verifique que el archivo no esté dañado.";
    toast.error("❌ Error al procesar el archivo Excel");
  } finally {
    isLoading.value = false;
    loadingMessage.value = "";
  }
};

const confirmarGuardar = async () => {
  // Mostrar feedback inmediato
  isLoading.value = true;
  loadingMessage.value = "🔍 Verificando datos...";

  // Dar tiempo al UI para actualizarse
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 50));

  if (errorCount.value > 0) {
    isLoading.value = false;
    toast.warning(
      "⚠️ Hay productos con errores. Por favor revísalos antes de guardar."
    );
    return;
  }

  if (duplicateCount.value > 0) {
    isLoading.value = false;
    toast.error(
      "❌ No se puede guardar. Existen productos duplicados en el archivo o que ya existen en el sistema. Por favor elimínelos del archivo Excel."
    );
    return;
  }

  isLoading.value = false;

  const mensaje = `💾 Guardar ${productos.value.length} productos`;

  alertify.confirm(
    "Confirmar Guardado",
    `${mensaje}<br><br>¿Estás seguro de que deseas guardar estos productos?`,
    () => {
      // Usar setTimeout para permitir que el modal se cierre y la UI se actualice antes de iniciar el proceso pesado
      setTimeout(() => {
        guardarProductos();
      }, 100);
    },
    () => {
      toast.info("Operación cancelada");
    }
  ).set('labels', { ok: 'Guardar', cancel: 'Cancelar' });
};

const guardarProductos = async () => {
  isLoading.value = true;
  loadingMessage.value = "💾 Iniciando guardado...";

  // Esperar a que Vue actualice el DOM y que el modal de alertify se cierre visualmente
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 300));

  loadingMessage.value = "💾 Procesando datos...";
  // Aumentar el tiempo de espera para asegurar que el spinner se vea antes de la operación bloqueante
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const existingProducts = productosDB.value;
    const existingCount = existingProducts.length;

    const productosValidos = productos.value.filter((p) => !p.hasErrors);

    if (productosValidos.length === 0) {
      toast.error("❌ No hay productos válidos para guardar");
      return;
    }

    // Encontrar el máximo ID actual para generar IDs incrementales únicos
    let maxId = 0;
    if (existingProducts.length > 0) {
      existingProducts.forEach(p => {
        // Intentar extraer el número del ID (puede ser número o string)
        const idNum = typeof p.ID === 'number' ? p.ID : parseInt(p.ID);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      });
    }

    // Generar IDs únicos incrementales
    const productosConId = productosValidos.map((p, index) => ({
      ID: maxId + index + 1, // ID numérico incremental único
      Codigo: p.CODIGO,
      Marca: p.Marca,
      NombreProducto: p.Nombre,
      Presentacion: p.Presentacion,
      PrincipioActivo: p.Principio_Activo,
      Tipo: p.Tipo,
      PrecioFarmacia: p.P_Farmacia,
      PVP: p.PVP,
      Promocion: p.Promocion,
      Observacion: p.Observacion,
      Descuento: p.Descuento,
      IVA: p.IVA,
      isDuplicate: p.isDuplicate,
    }));

    // Guardar en IndexedDB usando bulkAdd
    await bulkAddProductos(productosConId);
    const allProducts = productosDB.value;

    const skipped = productos.value.length - productosValidos.length;
    toast.success(
      `✅ ${productosValidos.length} productos guardados correctamente. ${skipped > 0 ? `(${skipped} omitidos por errores)` : ""
      } Total en sistema: ${allProducts.length}`,
      {
        timeout: 1000,
      }
    );

    productos.value = [];
    file.value = null;
    productosEnSistema.value = allProducts.length; // Actualizar contador
  } catch (error) {
    console.error("Error:", error);
    toast.error("❌ Error al guardar productos");
  } finally {
    isLoading.value = false;
    loadingMessage.value = "";
  }
};

const cancelarCarga = () => {
  alertify.confirm(
    "Cancelar Carga",
    "⚠️ ¿Cancelar la carga? Se perderán los datos no guardados.",
    () => {
      productos.value = [];
      file.value = null;
      toast.info("🔄 Carga cancelada");
    },
    () => {
      // Cancel action
    }
  ).set('labels', { ok: 'Sí, Cancelar', cancel: 'No' });
};

const limpiarFiltros = () => {
  searchText.value = "";
  filterMarca.value = "";
  filterStatus.value = "all";
  toast.info("🔄 Filtros limpiados");
};

// Cargar conteo de productos al montar el componente
onMounted(async () => {
  await loadProductos();
  productosEnSistema.value = productosDB.value.length;
});

// Watch para actualizar el conteo cuando cambien los productos
watch(productosDB, (newVal) => {
  productosEnSistema.value = newVal.length;
}, { immediate: true });

// Borrar todos los productos del sistema
const borrarTodosLosProductos = () => {
  alertify.confirm(
    "Eliminar Todos los Productos",
    `⚠️ ¿Eliminar TODOS los ${productosEnSistema.value} productos del sistema?<br><br>Esta acción NO se puede deshacer.`,
    async () => {
      try {
        await clearAllProductos();
        productosEnSistema.value = 0;
        toast.success('🗑️ Todos los productos han sido eliminados del sistema');
      } catch (e) {
        toast.error('❌ Error al eliminar productos');
      }
    },
    () => {
      // Cancel action
    }
  ).set('labels', { ok: 'Sí, Borrar Todo', cancel: 'Cancelar' });
};

// Descargar todos los productos en Excel
const descargarProductosExcel = async () => {
  try {
    const productosGuardados = productosDB.value;

    if (productosGuardados.length === 0) {
      toast.warning('No hay productos para descargar');
      return;
    }

    // Convertir productos al formato esperado por el Excel
    const productosParaExcel = productosGuardados.map(p => ({
      CODIGO: p.Codigo || '',
      Marca: p.Marca || '',
      Nombre: `${p.NombreProducto} - ${p.Presentacion}` || '',
      Presentacion: p.Presentacion || '',
      Principio_Activo: p.PrincipioActivo || '',
      Tipo: p.Tipo || '',
      P_Farmacia: parseFloat(p.PrecioFarmacia || 0).toFixed(3),
      PVP: parseFloat(p.PVP || 0).toFixed(3),
      Promocion: p.Promocion || '',
      Observacion: p.Observacion || '',
      Descuento: p.Descuento || 0,
      IVA: p.IVA || 0,
      Observacion: p.Observacion || ''
    }));

    // Usar ExcelJS para generar el archivo
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Definir columnas
    worksheet.columns = [
      { header: 'CODIGO', key: 'CODIGO', width: 15 },
      { header: 'Marca', key: 'Marca', width: 20 },
      { header: 'Nombre', key: 'Nombre', width: 40 },
      { header: 'Presentacion', key: 'Presentacion', width: 25 },
      { header: 'Principio_Activo', key: 'Principio_Activo', width: 30 },
      { header: 'Tipo', key: 'Tipo', width: 15 },
      { header: 'P_Farmacia', key: 'P_Farmacia', width: 12 },
      { header: 'PVP', key: 'PVP', width: 12 },
      { header: 'Promocion', key: 'Promocion', width: 15 },
      { header: 'Descuento', key: 'Descuento', width: 12 },
      { header: 'IVA', key: 'IVA', width: 10 },
      { header: 'Observacion', key: 'Observacion', width: 30 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    productosParaExcel.forEach(producto => {
      worksheet.addRow(producto);
    });

    // Aplicar bordes y alineación a todas las celdas con datos
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Descargar
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fecha = new Date().toISOString().split('T')[0];
    link.download = `Productos_${fecha}.xlsx`;
    link.click();

    toast.success(`📥 ${productosGuardados.length} productos descargados en Excel`);
  } catch (error) {
    console.error('Error al descargar Excel:', error);
    toast.error('❌ Error al generar el archivo Excel');
  }
};
</script>

<style scoped>
.excel-handler {
  width: 100%;
}

.custom-file-upload {
  margin-bottom: 0.5rem;
}

.file-input-hidden {
  display: none;
}

.file-upload-label {
  display: block;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #0d6efd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0;
}

.file-upload-label:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: #0a58ca;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.file-upload-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.file-upload-icon {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.file-upload-text {
  font-size: 0.95rem;
  color: #495057;
  font-weight: 500;
  word-break: break-word;
  text-align: center;
}

.table-danger {
  background-color: #f8d7da !important;
}

.table-danger:hover {
  background-color: #f5c6cb !important;
}

.table-warning {
  background-color: #fff3cd !important;
}

.table-warning:hover {
  background-color: #ffe69c !important;
}

.table-success {
  background-color: #d1e7dd !important;
}

.table-success:hover {
  background-color: #badbcc !important;
}

/* Card styles for product preview */
.producto-card {
  transition: all 0.3s ease;
  border-width: 3px !important;
}

.producto-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
}

.card-valid {
  background: linear-gradient(135deg, #f0fff4 0%, #e6f9ed 100%);
  border-color: #28a745 !important;
}

.card-duplicate {
  background: linear-gradient(135deg, #fffbea 0%, #fff3cd 100%);
  border-color: #ffc107 !important;
}

.card-error {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
  border-color: #dc3545 !important;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  min-height: 2.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.product-info {
  font-size: 0.85rem;
  word-break: break-word;
  overflow-wrap: break-word;
}

.product-info p {
  margin-bottom: 0.25rem;
  color: #495057;
}

.error-box {
  background: #fff;
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 0.5rem;
}

/* Loading overlay styles */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem 3rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

@media (max-width: 576px) {
  :deep(.main-card .card-body) {
    padding: 0.75rem;
  }

  .file-upload-label {
    padding: 0.75rem;
  }
}
</style>
