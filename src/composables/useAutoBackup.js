import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import JSZip from 'jszip';
import { dbService } from '@/services/db';
import { saveOrShareFile } from '@/utils/downloadHelper';

const BACKUP_STORAGE_KEY = 'farmacia_auto_backups';
const LAST_BACKUP_KEY = 'farmacia_last_backup_date';
const DATA_HASH_KEY = 'farmacia_data_hash';
const BACKUP_HOUR = 19; // 7 PM

export function useAutoBackup() {
  const toast = useToast();
  const autoBackups = ref([]);
  const hasChanges = ref(false);
  const lastBackupDate = ref(null);
  const currentUser = ref(null);
  let checkInterval = null;

  // Claves de localStorage que quedan (solo para referencia, el resto va a IDB)
  const LS_KEYS = {
    currentUser: 'currentUser',
    cart: 'shoppingCart'
  };

  // Stores de IDB a respaldar
  const IDB_STORES = ['productos', 'clientes', 'usuarios', 'visitas', 'historial', 'agenda', 'cobros'];

  // Calcular hash acumulando datos de IDB y LS
  const calculateDataHash = async () => {
    let dataString = '';

    // 1. Datos de IndexedDB
    for (const store of IDB_STORES) {
      try {
        const items = await dbService.getAll(store);
        dataString += JSON.stringify(items);
      } catch (e) {
        console.error(`Error hashing store ${store}:`, e);
      }
    }

    // 2. Datos de LocalStorage
    Object.values(LS_KEYS).forEach(key => {
      dataString += localStorage.getItem(key) || '';
    });

    // Simple hash numérico
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer
    }
    return hash.toString();
  };

  // Verificar si hay cambios en los datos
  const checkForChanges = async () => {
    const currentHash = await calculateDataHash();
    const savedHash = localStorage.getItem(DATA_HASH_KEY);
    
    if (savedHash && currentHash !== savedHash) {
      hasChanges.value = true;
    } else {
      hasChanges.value = false;
    }
    
    return currentHash !== savedHash;
  };

  // Obtener usuario actual
  const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        currentUser.value = parsed;
        return parsed.name || 'Usuario';
      } catch (e) {
        return 'Usuario';
      }
    }
    return 'Usuario';
  };

  // Calcular estadísticas del backup
  const calculateBackupStats = (data) => {
    return {
      productos: Array.isArray(data.productos) ? data.productos.length : 0,
      usuarios: Array.isArray(data.usuarios) ? data.usuarios.length : 0,
      visitas: Array.isArray(data.visitas) ? data.visitas.length : 0,
      historial: Array.isArray(data.historial) ? data.historial.length : 0,
      agenda: Array.isArray(data.agenda) ? data.agenda.length : 0, // Corregido key
      cobros: Array.isArray(data.cobros) ? data.cobros.length : 0
    };
  };

  // Crear backup automático
  const createAutoBackup = async (isManual = false) => {
    const now = new Date();
    const userName = getCurrentUser();
    
    // Recolectar datos
    const data = {};

    // 1. Desde IndexedDB
    for (const store of IDB_STORES) {
      try {
        data[store] = await dbService.getAll(store);
      } catch (e) {
        console.error(`Error backup store ${store}:`, e);
        data[store] = [];
      }
    }

    // 2. Desde LocalStorage
    data.currentUser = JSON.parse(localStorage.getItem(LS_KEYS.currentUser) || 'null');
    data.cart = JSON.parse(localStorage.getItem(LS_KEYS.cart) || '[]');

    const stats = calculateBackupStats(data);

    const backupData = {
      id: `backup_${now.getTime()}`,
      date: now.toISOString(),
      timestamp: now.getTime(),
      dateFormatted: now.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      userName: userName,
      version: '3.0',
      auto: !isManual,
      stats: stats,
      data: data
    };

    try {
      // Guardar en IndexedDB
      await dbService.put('backups', backupData);

      // Mantener backups de los últimos 7 días en IndexedDB
      const allBackups = await dbService.getAll('backups');
      const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);

      for (const backup of allBackups) {
        if (backup.timestamp < sevenDaysAgo) {
          await dbService.delete('backups', backup.id);
        }
      }

      // Limpiar localStorage si existía (migración completada)
      if (localStorage.getItem(BACKUP_STORAGE_KEY)) {
        localStorage.removeItem(BACKUP_STORAGE_KEY);
      }

      // Actualizar hash de datos
      const newHash = await calculateDataHash();
      localStorage.setItem(DATA_HASH_KEY, newHash);

      // Actualizar última fecha de backup
      localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
      lastBackupDate.value = now.toISOString();
      hasChanges.value = false;

      // Recargar lista de backups
      loadAutoBackups();

      toast.success(isManual ? '✅ Backup manual creado exitosamente' : '✅ Backup automático creado exitosamente');
      return backupData;

    } catch (e) {
      console.error('Error saving backup to IndexedDB:', e);
      toast.error('❌ Error al guardar el backup en la base de datos.');
      return null;
    }
  };

  // Verificar si es hora de hacer backup (después de las 7 PM)
  const checkBackupTime = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Verificar si es después de las 7 PM (19:00)
    if (currentHour >= BACKUP_HOUR) {
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
      const oneHourAgo = now.getTime() - (60 * 60 * 1000); 
      
      if (!lastBackup || new Date(lastBackup).getTime() < oneHourAgo) {
        // Verificar si hay cambios
        const changed = await checkForChanges();
        if (changed) {
          console.log('🔄 Ejecutando backup automático después de las 7 PM...');
          await createAutoBackup();
        }
      }
    }
  };

  // Cargar backups automáticos guardados
  const loadAutoBackups = async () => {
    try {
      const backups = await dbService.getAll('backups');
      autoBackups.value = backups.sort((a, b) => b.timestamp - a.timestamp);

      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
      lastBackupDate.value = lastBackup;
    } catch (e) {
      console.error('Error loading backups from IndexedDB:', e);
      autoBackups.value = [];
    }
  };

  // Descargar un backup específico
  const downloadBackup = async (backupId) => {
    const backup = autoBackups.value.find(b => b.id === backupId);
    if (!backup) {
      toast.error('❌ Backup no encontrado');
      return;
    }

    try {
      const zip = new JSZip();

      const datePart = backup.dateFormatted.split(',')[0].replace(/\//g, '-').trim();
      const userName = backup.userName || 'Usuario';
      const jsonFilename = `farmacia-backup-${datePart}-${userName}.json`;

      const jsonString = JSON.stringify(backup, null, 2);

      zip.file(jsonFilename, jsonString);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = jsonFilename.replace('.json', '.zip');

      await saveOrShareFile(zipBlob, zipFilename, toast);
    } catch (error) {
      console.error('Error generando ZIP:', error);
      toast.error('❌ Error al generar el archivo ZIP');
    }
  };

  // Eliminar un backup
  const deleteBackup = async (backupId) => {
    try {
      await dbService.delete('backups', backupId);
      autoBackups.value = autoBackups.value.filter(b => b.id !== backupId);
      toast.success('🗑️ Backup eliminado');
    } catch (e) {
      console.error('Error deleting backup:', e);
      toast.error('❌ Error al eliminar el backup');
    }
  };

  // Eliminar todos los backups
  const deleteAllBackups = async () => {
    try {
      const allBackups = await dbService.getAll('backups');
      for (const backup of allBackups) {
        await dbService.delete('backups', backup.id);
      }
      autoBackups.value = [];
      toast.success('🗑️ Todos los backups eliminados');
    } catch (e) {
      console.error('Error deleting all backups:', e);
      toast.error('❌ Error al vaciar el historial');
    }
  };

  // Forzar backup manual
  const forceBackup = async () => {
    await createAutoBackup(true); // true = isManual
  };

  // Iniciar monitoreo
  const startMonitoring = () => {
    getCurrentUser();
    loadAutoBackups();
    checkForChanges(); 

    checkInterval = setInterval(() => {
      checkBackupTime();
      checkForChanges();
    }, 60000); 

    checkBackupTime();
  };

  // Detener monitoreo
  const stopMonitoring = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  onMounted(() => {
    startMonitoring();
  });

  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    autoBackups,
    hasChanges,
    lastBackupDate,
    createAutoBackup,
    downloadBackup,
    deleteBackup,
    deleteAllBackups,
    forceBackup,
    loadAutoBackups,
    checkForChanges
  };
}
