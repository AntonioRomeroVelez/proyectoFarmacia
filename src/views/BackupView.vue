<template>
  <div class="backup-container">
    <div class="backup-header">
      <h1>💾 Backup y Restauración</h1>
      <p class="subtitle">Exporta e importa todos tus datos entre dispositivos</p>
    </div>

    <!-- Estadísticas de datos -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>{{ stats.productos }}</h3>
          <p>Productos</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>{{ stats.usuarios }}</h3>
          <p>Usuarios</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚗</div>
        <div class="stat-info">
          <h3>{{ stats.visitas }}</h3>
          <p>Visitas</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <h3>{{ stats.historial }}</h3>
          <p>Historial</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <h3>{{ stats.agenda }}</h3>
          <p>Eventos</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>{{ stats.cobros }}</h3>
          <p>Cobros</p>
        </div>
      </div>
    </div>

    <!-- Sección de Exportación -->
    <div class="action-section export-section">
      <div class="section-header">
        <h2>📤 Exportar Datos</h2>
        <p>Descarga todos tus datos en un archivo JSON</p>
      </div>

      <div class="export-options">
        <button @click="exportAllData" class="btn btn-primary">
          <span class="icon">⬇️</span>
          Descargar Backup Completo
        </button>

        <button @click="exportSelectedData" class="btn btn-secondary">
          <span class="icon">📋</span>
          Exportar Selección
        </button>
      </div>

      <!-- Opciones de exportación selectiva -->
      <div v-if="showExportOptions" class="export-checkboxes">
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.productos" />
          <span>Productos</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.usuarios" />
          <span>Usuarios</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.visitas" />
          <span>Visitas</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.historial" />
          <span>Historial</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.agenda" />
          <span>Agenda</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.cobros" />
          <span>Cobros</span>
        </label>
      </div>

      <div v-if="lastExport" class="last-export">
        ✅ Última exportación: {{ lastExport }}
      </div>
    </div>

    <!-- Sección de Importación -->
    <div class="action-section import-section">
      <div class="section-header">
        <h2>📥 Importar Datos</h2>
        <p>Restaura tus datos desde un archivo JSON</p>
      </div>

      <div class="import-zone">
        <input type="file" ref="fileInput" @change="handleFileSelect" accept=".json,.zip" style="display: none" />

        <div class="import-icon">📁</div>
        <p class="import-text">
          <strong>Selecciona tu archivo JSON o ZIP</strong>
        </p>
        <button @click="triggerFileInput" class="btn-select-file">
          📂 Seleccionar Archivo
        </button>
        <p class="import-hint">Formatos aceptados: .json, .zip</p>
      </div>

      <div class="import-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="importOptions.merge" />
          <span>Fusionar con datos existentes (no sobrescribir)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="importOptions.backup" />
          <span>Crear backup automático antes de importar</span>
        </label>
      </div>

      <div v-if="importPreview" class="import-preview">
        <h3>Vista previa de importación:</h3>
        <div class="preview-stats">
          <div v-for="(value, key) in importPreview" :key="key" class="preview-item">
            <strong>{{ formatKey(key) }}:</strong> {{ value.length || 0 }} registros
          </div>
        </div>
        <div class="preview-actions">
          <button @click="confirmImport" class="btn btn-success">
            ✅ Confirmar Importación
          </button>
          <button @click="cancelImport" class="btn btn-danger">
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Sección de Backups Automáticos -->
    <div class="action-section auto-backup-section">
      <div class="section-header">
        <h2>🔄 Backups Automáticos</h2>
        <p>Sistema de respaldo automático a las 7:00 PM</p>
      </div>

      <!-- Alerta de cambios no respaldados -->
      <div v-if="hasChanges" class="changes-alert">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <strong>Tienes cambios no respaldados</strong>
          <p>Se detectaron modificaciones desde el último backup</p>
        </div>
        <button @click="forceBackup" class="btn-alert">
          Crear Backup Ahora
        </button>
      </div>

      <!-- Información del último backup -->
      <div v-if="lastBackupDate" class="backup-info">
        <div class="info-item">
          <span class="info-label">📅 Último backup automático:</span>
          <span class="info-value">{{ formatLastBackupDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">📦 Backups guardados:</span>
          <span class="info-value">{{ autoBackups.length }} / 7</span>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="backup-actions">
        <button @click="forceBackup" class="btn btn-primary">
          <span class="icon">🔄</span>
          Crear Backup Manual
        </button>
        <button v-if="autoBackups.length > 0" @click="deleteAllBackups" class="btn btn-danger">
          <span class="icon">🗑️</span>
          Eliminar Todos
        </button>
      </div>

      <!-- Lista de backups automáticos -->
      <div v-if="autoBackups.length > 0" class="backups-list">
        <h3>Historial de Backups</h3>
        <div class="backup-item" v-for="backup in autoBackups" :key="backup.id">
          <div class="backup-item-info">
            <div class="backup-icon">{{ backup.auto ? '🔄' : '📥' }}</div>
            <div class="backup-details">
              <strong>{{ backup.dateFormatted }}</strong>
              <small>{{ backup.auto ? 'Automático' : 'Manual' }}</small>
            </div>
          </div>
          <div class="backup-item-actions">
            <button @click="downloadBackup(backup.id)" class="btn-icon" title="Descargar">
              ⬇️
            </button>
            <button @click="deleteBackup(backup.id)" class="btn-icon btn-icon-danger" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-else class="no-backups">
        <p>📭 No hay backups automáticos guardados</p>
        <small>El sistema creará backups automáticos a las 7:00 PM si hay cambios</small>
      </div>
    </div>

    <!-- Sección de Información -->
    <div class="info-section">
      <h3>ℹ️ Información</h3>
      <ul>
        <li>El backup incluye todos los datos almacenados localmente</li>
        <li>Puedes usar el archivo JSON en cualquier dispositivo</li>
        <li>La importación puede fusionar o reemplazar datos existentes</li>
        <li>Se recomienda hacer backups periódicos</li>
      </ul>
    </div>

    <!-- Toast de notificación -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAutoBackup } from '@/composables/useAutoBackup';
import JSZip from 'jszip';

// Composable de backup automático
const {
  autoBackups,
  hasChanges,
  lastBackupDate,
  downloadBackup,
  deleteBackup,
  deleteAllBackups,
  forceBackup
} = useAutoBackup();

const stats = ref({
  productos: 0,
  usuarios: 0,
  visitas: 0,
  historial: 0,
  agenda: 0,
  cobros: 0
});

const showExportOptions = ref(false);
const exportOptions = ref({
  productos: true,
  usuarios: true,
  visitas: true,
  historial: true,
  agenda: true,
  cobros: true
});

const importOptions = ref({
  merge: false,
  backup: true
});

const lastExport = ref('');
const importPreview = ref(null);
const fileInput = ref(null);
const pendingImportData = ref(null);

const toast = ref({
  show: false,
  message: '',
  type: 'success'
});

// Mapeo de claves de localStorage
const STORAGE_KEYS = {
  productos: 'ListaProductos',
  usuarios: 'app_users',
  visitas: 'VisitasDiarias',
  historial: 'farmacia_historial',
  agenda: 'farmacia_agenda',
  cobros: 'farmacia_cobros',
  currentUser: 'currentUser',
  cart: 'shoppingCart'
};

// Cargar estadísticas
const loadStats = () => {
  stats.value.productos = JSON.parse(localStorage.getItem(STORAGE_KEYS.productos) || '[]').length;
  stats.value.usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.usuarios) || '[]').length;
  stats.value.visitas = JSON.parse(localStorage.getItem(STORAGE_KEYS.visitas) || '[]').length;
  stats.value.historial = JSON.parse(localStorage.getItem(STORAGE_KEYS.historial) || '[]').length;
  stats.value.agenda = JSON.parse(localStorage.getItem(STORAGE_KEYS.agenda) || '[]').length;
  stats.value.cobros = JSON.parse(localStorage.getItem(STORAGE_KEYS.cobros) || '[]').length;
};

// Exportar todos los datos
const exportAllData = () => {
  const backupData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      productos: JSON.parse(localStorage.getItem(STORAGE_KEYS.productos) || '[]'),
      usuarios: JSON.parse(localStorage.getItem(STORAGE_KEYS.usuarios) || '[]'),
      visitas: JSON.parse(localStorage.getItem(STORAGE_KEYS.visitas) || '[]'),
      historial: JSON.parse(localStorage.getItem(STORAGE_KEYS.historial) || '[]'),
      agenda: JSON.parse(localStorage.getItem(STORAGE_KEYS.agenda) || '[]'),
      cobros: JSON.parse(localStorage.getItem(STORAGE_KEYS.cobros) || '[]'),
      currentUser: JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null'),
      cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]')
    }
  };

  downloadJSON(backupData, `farmacia-backup-${formatDate(new Date())}.json`);
  lastExport.value = new Date().toLocaleString();
  showToast('✅ Backup exportado exitosamente', 'success');
};

// Exportar datos seleccionados
const exportSelectedData = () => {
  showExportOptions.value = !showExportOptions.value;

  if (!showExportOptions.value) {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    Object.keys(exportOptions.value).forEach(key => {
      if (exportOptions.value[key]) {
        backupData.data[key] = JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) || '[]');
      }
    });

    downloadJSON(backupData, `farmacia-backup-partial-${formatDate(new Date())}.json`);
    lastExport.value = new Date().toLocaleString();
    showToast('✅ Backup parcial exportado', 'success');
  }
};

// Descargar JSON (mejorado para móviles)
// Descargar JSON comprimido en ZIP
const downloadJSON = async (data, filename) => {
  try {
    const zip = new JSZip();
    const jsonString = JSON.stringify(data, null, 2);

    // Agregar archivo JSON al ZIP
    zip.file(filename, jsonString);

    // Generar el archivo ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFilename = filename.replace('.json', '.zip');

    // Detectar si es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Opción 1: Intentar usar Web Share API con el ZIP
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([zipBlob], zipFilename, { type: 'application/zip' })] })) {
        try {
          const file = new File([zipBlob], zipFilename, { type: 'application/zip' });
          await navigator.share({
            files: [file],
            title: 'Backup de Farmacia (ZIP)',
            text: 'Archivo de respaldo comprimido'
          });
          showToast('✅ Archivo ZIP compartido exitosamente', 'success');
          return;
        } catch (error) {
          console.log('Share API failed, trying download');
        }
      }
    }

    // Descarga tradicional del ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    showToast('✅ Backup comprimido descargado (.zip)', 'success');

  } catch (error) {
    console.error('Error generando ZIP:', error);
    showToast('❌ Error al comprimir el archivo', 'error');

    // Fallback: descargar JSON normal si falla el ZIP
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Manejar selección de archivo
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    readFile(file);
  }
};

// Leer archivo (JSON o ZIP)
const readFile = async (file) => {
  try {
    let jsonContent = '';

    // Si es un archivo ZIP
    if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // Buscar el primer archivo JSON dentro del ZIP
        const jsonFileName = Object.keys(zipContent.files).find(name => name.endsWith('.json'));

        if (jsonFileName) {
          jsonContent = await zipContent.file(jsonFileName).async('string');
          showToast('📦 Archivo ZIP descomprimido correctamente', 'success');
        } else {
          showToast('❌ El archivo ZIP no contiene ningún archivo JSON', 'error');
          return;
        }
      } catch (error) {
        console.error('Error leyendo ZIP:', error);
        showToast('❌ Error al leer el archivo ZIP', 'error');
        return;
      }
    } else {
      // Leer como texto normal (JSON)
      jsonContent = await file.text();
    }

// Parsear el contenido JSON
    try {
      const data = JSON.parse(jsonContent);
      if (data.data) {
        importPreview.value = data.data;
        pendingImportData.value = data;
      } else {
        showToast('❌ Formato de datos inválido', 'error');
      }
    } catch (error) {
      showToast('❌ Error al parsear el JSON', 'error');
    }

  } catch (error) {
    console.error('Error general:', error);
    showToast('❌ Error al procesar el archivo', 'error');
  }
};

// Confirmar importación
const confirmImport = () => {
  if (!pendingImportData.value) return;

  // Crear backup automático si está habilitado
  if (importOptions.value.backup) {
    exportAllData();
  }

  const importData = pendingImportData.value.data;

  Object.keys(importData).forEach(key => {
    const storageKey = STORAGE_KEYS[key];
    if (!storageKey) return;

    if (importOptions.value.merge && Array.isArray(importData[key])) {
      // Fusionar datos
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const merged = [...existing, ...importData[key]];
      // Eliminar duplicados por id si existe
      const unique = merged.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );
      localStorage.setItem(storageKey, JSON.stringify(unique));
    } else {
      // Sobrescribir datos
      localStorage.setItem(storageKey, JSON.stringify(importData[key]));
    }
  });

  loadStats();
  cancelImport();
  showToast('✅ Datos importados exitosamente. Recarga la página para ver los cambios.', 'success');
};

// Cancelar importación
const cancelImport = () => {
  importPreview.value = null;
  pendingImportData.value = null;
  fileInput.value.value = '';
};

// Formatear clave
const formatKey = (key) => {
  const labels = {
    productos: 'Productos',
    usuarios: 'Usuarios',
    visitas: 'Visitas',
    historial: 'Historial',
    agenda: 'Agenda',
    cobros: 'Cobros',
    currentUser: 'Usuario Actual',
    cart: 'Carrito'
  };
  return labels[key] || key;
};

// Formatear fecha
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Toast de notificación
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

// Computed property para formatear la fecha del último backup
const formatLastBackupDate = computed(() => {
  if (!lastBackupDate.value) return '';
  const date = new Date(lastBackupDate.value);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.backup-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.backup-header {
  text-align: center;
  margin-bottom: 3rem;
}

.backup-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
}

.stat-info p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.action-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #7f8c8d;
  margin: 0;
}

.export-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
  color: white;
}

.icon {
  font-size: 1.2rem;
}

.export-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.last-export {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #d4edda;
  color: #155724;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.import-zone {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  background: #f8f9fa;
}

.import-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.import-text {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.import-hint {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.btn-select-file {
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-select-file:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-select-file:active {
  transform: translateY(0);
}

/* Auto Backup Section */
.auto-backup-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px solid #e7f1ff;
}

.changes-alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fff3cd 0%, #fef5d4 100%);
  border-left: 4px solid #ffc107;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.alert-icon {
  font-size: 2rem;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  color: #856404;
  margin-bottom: 0.25rem;
}

.alert-content p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

.btn-alert {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #333;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-alert:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}

.backup-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #64748b;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: #2c3e50;
}

.backup-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.backups-list {
  margin-top: 1.5rem;
}

.backups-list h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition: all 0.3s;
}

.backup-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.backup-item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.backup-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.backup-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.backup-details strong {
  color: #2c3e50;
  font-size: 0.95rem;
}

.backup-details small {
  color: #64748b;
  font-size: 0.85rem;
}

.backup-item-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
}

.btn-icon:hover {
  background: #e7f1ff;
  border-color: #667eea;
  transform: scale(1.1);
}

.btn-icon-danger:hover {
  background: #fee;
  border-color: #f45c43;
}

.no-backups {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-backups p {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.no-backups small {
  font-size: 0.9rem;
}

.import-options {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.import-preview {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0f4ff;
  border-radius: 8px;
  border: 2px solid #667eea;
}

.import-preview h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.preview-item {
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
}

.preview-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.info-section {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1.5rem;
  border-radius: 8px;
}

.info-section h3 {
  color: #856404;
  margin-bottom: 1rem;
}

.info-section ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #856404;
}

.info-section li {
  margin-bottom: 0.5rem;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.toast.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.toast.error {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .backup-container {
    padding: 1rem;
  }

  .backup-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
  }

  .stat-info h3 {
    font-size: 1.5rem;
  }

  .action-section {
    padding: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }

  .export-options {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .import-zone {
    padding: 2rem 1rem;
  }

  .import-icon {
    font-size: 3rem;
  }

  .btn-select-file {
    width: 100%;
    padding: 1.25rem;
    font-size: 1.1rem;
  }

  .preview-actions {
    flex-direction: column;
  }

  .preview-actions .btn {
    width: 100%;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    text-align: center;
  }

  .export-checkboxes {
    grid-template-columns: 1fr;
  }

  .preview-stats {
    grid-template-columns: 1fr;
  }

  .changes-alert {
    flex-direction: column;
    text-align: center;
  }

  .btn-alert {
    width: 100%;
  }

  .backup-info {
    grid-template-columns: 1fr;
  }

  .backup-actions {
    flex-direction: column;
  }

  .backup-item {
    flex-direction: column;
    gap: 1rem;
  }

  .backup-item-info {
    width: 100%;
  }

  .backup-item-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
