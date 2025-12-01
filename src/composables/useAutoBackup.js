import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';

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

  // Claves de localStorage a monitorear
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

  // Calcular hash simple de los datos
  const calculateDataHash = () => {
    const allData = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      allData[key] = localStorage.getItem(storageKey) || '';
    });
    return JSON.stringify(allData).length + Object.keys(allData).join('');
  };

  // Verificar si hay cambios en los datos
  const checkForChanges = () => {
    const currentHash = calculateDataHash();
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

  // Crear backup automático
  const createAutoBackup = () => {
    const now = new Date();
    const userName = getCurrentUser();
    
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
      version: '1.0',
      auto: true,
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

    // Guardar backup en localStorage
    const existingBackups = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || '[]');
    existingBackups.push(backupData);
    
    // Mantener solo los últimos 7 backups
    const recentBackups = existingBackups.slice(-7);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(recentBackups));
    
    // Actualizar hash de datos
    const newHash = calculateDataHash();
    localStorage.setItem(DATA_HASH_KEY, newHash);
    
    // Actualizar última fecha de backup
    localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
    lastBackupDate.value = now.toISOString();
    hasChanges.value = false;
    
    // Recargar lista de backups
    loadAutoBackups();
    
    toast.success('✅ Backup automático creado exitosamente');
    
    return backupData;
  };

  // Verificar si es hora de hacer backup (7 PM)
  const checkBackupTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Verificar si es la hora de backup (7 PM, con ventana de 5 minutos)
    if (currentHour === BACKUP_HOUR && currentMinute < 5) {
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
      const today = new Date().toDateString();
      
      // Verificar si ya se hizo backup hoy
      if (!lastBackup || new Date(lastBackup).toDateString() !== today) {
        // Verificar si hay cambios
        if (checkForChanges()) {
          console.log('🔄 Ejecutando backup automático a las 7 PM...');
          createAutoBackup();
        }
      }
    }
  };

  // Cargar backups automáticos guardados
  const loadAutoBackups = () => {
    const backups = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || '[]');
    autoBackups.value = backups.sort((a, b) => b.timestamp - a.timestamp);
    
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    lastBackupDate.value = lastBackup;
  };

  // Descargar un backup específico
  const downloadBackup = (backupId) => {
    const backup = autoBackups.value.find(b => b.id === backupId);
    if (!backup) {
      toast.error('❌ Backup no encontrado');
      return;
    }

    // Formato: farmacia-backup-fecha-usuario.json
    const datePart = backup.dateFormatted.split(',')[0].replace(/\//g, '-');
    const userName = backup.userName || 'Usuario';
    const filename = `farmacia-backup-${datePart}-${userName}.json`;
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('✅ Backup descargado');
  };

  // Eliminar un backup
  const deleteBackup = (backupId) => {
    const backups = autoBackups.value.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
    autoBackups.value = backups;
    toast.success('🗑️ Backup eliminado');
  };

  // Eliminar todos los backups
  const deleteAllBackups = () => {
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    autoBackups.value = [];
    toast.success('🗑️ Todos los backups eliminados');
  };

  // Forzar backup manual
  const forceBackup = () => {
    createAutoBackup();
  };

  // Iniciar monitoreo
  const startMonitoring = () => {
    getCurrentUser();
    loadAutoBackups();
    checkForChanges();
    
    // Verificar cada 1 minuto si es hora de hacer backup
    checkInterval = setInterval(() => {
      checkBackupTime();
      checkForChanges();
    }, 60000); // 60 segundos
    
    // Verificar inmediatamente al iniciar
    checkBackupTime();
  };

  // Detener monitoreo
  const stopMonitoring = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  // Lifecycle hooks
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
