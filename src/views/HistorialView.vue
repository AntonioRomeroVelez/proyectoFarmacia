<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold text-primary mb-0">
        <BIconClockHistory class="me-2" />Historial de Documentos
      </h2>
      <b-button 
        variant="outline-danger" 
        @click="confirmClearAll" 
        :disabled="documents.length === 0"
      >
        <BIconTrash class="me-2" />Vaciar Historial
      </b-button>
    </div>

    <!-- Estado vacío -->
    <b-card v-if="documents.length === 0" class="text-center py-5 shadow-sm">
      <div style="font-size: 4rem; color: #6c757d">📂</div>
      <h5 class="text-muted mt-3">No hay documentos guardados</h5>
      <p class="text-muted mb-3">
        Los documentos generados desde el carrito aparecerán aquí.
      </p>
      <router-link to="/carrito">
        <b-button variant="primary"> Ir al Carrito </b-button>
      </router-link>
    </b-card>

    <!-- Contenido con documentos -->
    <div v-else>
      <!-- Tabla de documentos (Desktop) -->
      <b-card class="shadow-sm d-none d-md-block">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Items</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in documents" :key="doc.id">
                <td>{{ formatDate(doc.date) }}</td>
                <td>
                  <span :class="getBadgeClass(doc.type)" class="badge rounded-pill">
                    {{ doc.type }}
                  </span>
                </td>
                <td class="fw-medium">{{ doc.clientName || 'Cliente General' }}</td>
                <td class="fw-bold text-success">
                  ${{ Number(doc.totals?.total || 0).toFixed(3) }}
                </td>
                <td>
                  <span class="badge bg-secondary">{{ doc.items?.length || 0 }} items</span>
                </td>
                <td class="text-end">
                  <div class="btn-group">
                    <b-button 
                      variant="outline-primary" 
                      size="sm" 
                      @click="handleDownload(doc)"
                      title="Volver a descargar"
                    >
                      <BIconDownload />
                    </b-button>
                    <b-button 
                      variant="outline-success" 
                      size="sm" 
                      @click="handleLoadToCart(doc)"
                      title="Cargar al carrito"
                    >
                      <BIconCartPlus />
                    </b-button>
                    <b-button 
                      variant="outline-danger" 
                      size="sm" 
                      @click="handleDelete(doc.id)"
                      title="Eliminar"
                    >
                      <BIconTrash />
                    </b-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </b-card>

      <!-- Vista Móvil (Cards) -->
      <div class="d-md-none">
        <div v-for="doc in documents" :key="doc.id" class="card mb-3 shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span :class="getBadgeClass(doc.type)" class="badge rounded-pill mb-2">
                  {{ doc.type }}
                </span>
                <h6 class="card-title fw-bold mb-0">{{ doc.clientName || 'Cliente General' }}</h6>
                <small class="text-muted">{{ formatDate(doc.date) }}</small>
              </div>
              <div class="text-end">
                <div class="fw-bold text-success fs-5">
                  ${{ Number(doc.totals?.total || 0).toFixed(3) }}
                </div>
                <small class="text-muted">{{ doc.items?.length || 0 }} items</small>
              </div>
            </div>
            
            <hr class="my-2">
            
            <div class="d-flex justify-content-end gap-2">
              <b-button 
                variant="outline-primary" 
                size="sm" 
                class="flex-grow-1"
                @click="handleDownload(doc)"
              >
                <BIconDownload class="me-1" /> Descargar
              </b-button>
              <b-button 
                variant="outline-success" 
                size="sm" 
                class="flex-grow-1"
                @click="handleLoadToCart(doc)"
              >
                <BIconCartPlus class="me-1" /> Cargar
              </b-button>
              <b-button 
                variant="outline-danger" 
                size="sm" 
                @click="handleDelete(doc.id)"
              >
                <BIconTrash />
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useHistorial } from '@/composables/useHistorial';
import { useCart } from '@/composables/useCart';
import { useExcelHandler } from '@/utils/excelHandler';
import { usePDFGenerator } from '@/utils/pdfGenerator';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import alertify from 'alertifyjs';
import { BIconClockHistory, BIconTrash, BIconDownload, BIconCartPlus } from 'bootstrap-icons-vue';

const { documents, deleteDocument, clearAllDocuments } = useHistorial();
const { clearCart, addToCart, updateQuantity } = useCart();
const { exportCustomExcel } = useExcelHandler();
const { generatePDFFromData } = usePDFGenerator();
const toast = useToast();
const router = useRouter();

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getBadgeClass = (type) => {
  switch (type) {
    case 'Proforma': return 'bg-info text-dark';
    case 'Pedido': return 'bg-primary';
    case 'Lista de Precios': return 'bg-warning text-dark';
    default: return 'bg-secondary';
  }
};

const confirmClearAll = () => {
  alertify.confirm(
    'Vaciar Historial',
    '¿Estás seguro de que deseas eliminar todos los documentos guardados?',
    () => clearAllDocuments(),
    () => {}
  ).set('labels', { ok: 'Sí, Vaciar', cancel: 'Cancelar' });
};

const handleDelete = (id) => {
  alertify.confirm(
    'Eliminar Documento',
    '¿Estás seguro de que deseas eliminar este documento?',
    () => deleteDocument(id),
    () => {}
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};

const handleLoadToCart = (doc) => {
  alertify.confirm(
    'Cargar al Carrito',
    '⚠️ Esto reemplazará los productos actuales en tu carrito. ¿Deseas continuar?',
    () => {
      clearCart();
      // Reconstruir el carrito item por item
      doc.items.forEach(item => {
        // Asumiendo que addToCart toma el producto completo
        // Si addToCart es simple, podríamos necesitar lógica más compleja
        // Pero useCart generalmente maneja esto.
        // Simularemos agregar y luego actualizar cantidad
        addToCart(item);
        updateQuantity(item.ID, item.quantity);
      });
      toast.success('Productos cargados al carrito');
      router.push('/carrito');
    },
    () => {}
  ).set('labels', { ok: 'Sí, Cargar', cancel: 'Cancelar' });
};

const handleDownload = (doc) => {
  const filename = `${doc.clientName.replace(/\s+/g, "_")}_${doc.type.replace(/\s+/g, "_")}_${doc.date}`;

  if (doc.type === 'Proforma') {
    const pdfData = doc.items.map((item) => {
      const bonus = item.promotionDetails?.bonus || 0;
      const precio = Number(item.PrecioFarmacia || 0);
      const subtotal = Number(item.subtotalItem || 0);

      return {
        "Cant.": item.quantity,
        Bonificacion: bonus > 0 ? bonus : "",
        Presentacion: item.Presentacion,
        NombreProducto: item.IVA > 0 ? `* ${item.NombreProducto}` : item.NombreProducto,
        Marca: item.Marca,
        P_Unitario: "$" + precio.toFixed(2),
        P_Total: "$" + subtotal.toFixed(2),
      };
    });

    generatePDFFromData(pdfData, `${filename}.pdf`, {
      title: "Proforma",
      subtitle: `Cliente: ${doc.clientName}`,
      totals: doc.totals, // Usar totales guardados
      headerData: {
        cliente: doc.clientName,
        fecha: doc.date,
        tipo: "Proforma",
      },
    });

  } else if (doc.type === 'Pedido') {
    const exportData = doc.items.map((item) => ({
      "Cantidad": item.quantity,
      "Bonificación": item.promotionDetails?.bonus > 0 ? item.promotionDetails.bonus : "",
      "Producto": item.NombreProducto,
      "Lote": "",
      "Fecha de Vencimiento": "",
    }));

    const metadata = {
      Cliente: doc.clientName,
      Fecha: doc.date,
    };

    exportCustomExcel(metadata, exportData, `${filename}.xlsx`);

  } else if (doc.type === 'Lista de Precios') {
    const pdfData = doc.items.map((item) => ({
      Producto: item.NombreProducto,
      Marca: item.Marca,
      "Presentación": item.Presentacion,
      Precio: "$ " + Number(item.PrecioFarmacia).toFixed(2),
      "Promoción": item.Promocion ? `${item.Promocion}` : "",
      "Desc. en + 2 uni": item.Descuento ? `${item.Descuento} %` : "",
    }));

    generatePDFFromData(pdfData, `${filename}.pdf`, {
      title: "Lista productos MH",
      subtitle: `Cliente: ${doc.clientName}`,
      date: `Fecha: ${doc.date}`,
    });
  }
};
</script>

<style scoped>
.table th {
  font-weight: 600;
  color: #495057;
}
</style>
