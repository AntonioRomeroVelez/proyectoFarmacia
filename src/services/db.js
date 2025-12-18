import { openDB } from 'idb';

const DB_NAME = 'farmaciaDB';
const DB_VERSION = 4;

export const dbRequest = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Create products store
    if (!db.objectStoreNames.contains('productos')) {
      db.createObjectStore('productos', { keyPath: 'ID' });
    }

    // Create cobros store
    if (!db.objectStoreNames.contains('cobros')) {
      db.createObjectStore('cobros', { keyPath: 'id' });
    }
    
    // Create historial store
    if (!db.objectStoreNames.contains('historial')) {
      db.createObjectStore('historial', { keyPath: 'id' });
    }
    
    // Create clientes store
    if (!db.objectStoreNames.contains('clientes')) {
      db.createObjectStore('clientes', { keyPath: 'id' });
    }

    // Create usuarios store
    if (!db.objectStoreNames.contains('usuarios')) {
      db.createObjectStore('usuarios', { keyPath: 'id' }); // Assuming users have ID or email? Check useUsuarios.
    }
    
    // Create visitas store
    if (!db.objectStoreNames.contains('visitas')) {
      db.createObjectStore('visitas', { keyPath: 'id', autoIncrement: true }); // Visitas lack IDs in LS usually, autoIncrement safest or add IDs during migration.
    }
    
    // Create agenda store
    if (!db.objectStoreNames.contains('agenda')) {
      db.createObjectStore('agenda', { keyPath: 'id' });
    }

    // Create config store for flags
    if (!db.objectStoreNames.contains('config')) {
      db.createObjectStore('config', { keyPath: 'key' });
    }

    // Create backups store (V4)
    if (!db.objectStoreNames.contains('backups')) {
      db.createObjectStore('backups', { keyPath: 'id' });
    }
  },
});

export const dbService = {
  // Get all items from a store
  async getAll(storeName) {
    const db = await dbRequest;
    return db.getAll(storeName);
  },

  // Get single item
  async get(storeName, key) {
    const db = await dbRequest;
    return db.get(storeName, key);
  },

  // Add item (fails if key exists)
  async add(storeName, value) {
    const db = await dbRequest;
    return db.add(storeName, value);
  },

  // Add or update item
  async put(storeName, value) {
    const db = await dbRequest;
    return db.put(storeName, value);
  },

  // Update existing item (alias for put)
  async update(storeName, value) {
    const db = await dbRequest;
    return db.put(storeName, value);
  },

  // Delete item
  async delete(storeName, key) {
    const db = await dbRequest;
    return db.delete(storeName, key);
  },

  // Clear all items from a store
  async clear(storeName) {
    const db = await dbRequest;
    return db.clear(storeName);
  },

  // Bulk add (for migration)
  async bulkPut(storeName, items) {
    const db = await dbRequest;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    await tx.done;
  },

  // Migrate from LocalStorage
  async migrateFromLocalStorage() {
    const db = await dbRequest;
    
    // Check if migration V3 was already done
    const migrationV3Flag = await db.get('config', 'migration_v3_done');
    if (migrationV3Flag?.value) {
      console.log('Migration V3 already done.');
      return;
    }

    console.log('Starting migration V3 from LocalStorage...');

    // Helper for safe JSON parse
    const safeParse = (key) => {
       const v = localStorage.getItem(key);
       if (!v) return [];
       try { return JSON.parse(v); } catch(e) { return []; }
    };

    // Migrate Products
    const productos = safeParse('ListaProductos');
    if (productos.length) await this.bulkPut('productos', productos);

    // Migrate Cobros
    const cobros = safeParse('farmacia_cobros');
    if (cobros.length) await this.bulkPut('cobros', cobros);
    
    // Migrate Historial
    const docs = safeParse('farmacia_historial_documentos');
    const legacyHist = safeParse('farmacia_historial');
    let historyItems = [...docs];
    
    // Merge legacy if needed
    const existingIds = new Set(historyItems.map(h => h.id));
    legacyHist.forEach(item => {
      if (!item.id) item.id = `legacy_${Date.now()}_${Math.random()}`;
      if (!existingIds.has(item.id)) historyItems.push(item);
    });
    if (historyItems.length) await this.bulkPut('historial', historyItems);

    // Migrate Clientes
    const clientes = safeParse('farmacia_clientes');
    if (clientes.length) await this.bulkPut('clientes', clientes);

    // Migrate Usuarios
    const usuarios = safeParse('app_users');
    // Ensure users have 'id'. useUsuarios seems to imply they do or use email/username?
    // Let's check logic later but for now safeguard ID.
    const usuariosWithId = usuarios.map(u => ({ ...u, id: u.id || u.email || u.username || `user_${Date.now()}_${Math.random()}` }));
    if (usuariosWithId.length) await this.bulkPut('usuarios', usuariosWithId);
    
    // Migrate Visitas
    const visitas = safeParse('VisitasDiarias');
    // Visitas usually don't have IDs in previous code (Step 616 showed just pushing object).
    // We need to add IDs.
    const visitasWithId = visitas.map((v, i) => ({ ...v, id: v.id || `visita_${Date.now()}_${i}` }));
    if (visitasWithId.length) await this.bulkPut('visitas', visitasWithId);

    // Migrate Agenda
    const agenda = safeParse('farmacia_agenda');
    if (agenda.length) await this.bulkPut('agenda', agenda);

    // Mark migration as done
    await db.put('config', { key: 'migration_done', value: true });
    await db.put('config', { key: 'migration_v2_done', value: true });
    await db.put('config', { key: 'migration_v3_done', value: true });
    // Migrate Backups to IndexedDB (V4)
    const migrationV4Flag = await db.get('config', 'migration_v4_done');
    if (!migrationV4Flag?.value) {
      console.log('Starting migration V4 (Backups) from LocalStorage...');
      const backups = safeParse('farmacia_auto_backups');
      if (backups.length) {
        await this.bulkPut('backups', backups);
        // After successful migration, we could clear LS, 
        // but it's safer to let the user see it works first or do it in useAutoBackup.
      }
      await db.put('config', { key: 'migration_v4_done', value: true });
      console.log('Migration V4 completed.');
    }

    console.log('All migrations completed.');

    // Explicitly cleanup legacy localStorage after all migrations are done
    this.cleanupLegacyLocalStorage();
  },

  // Cleanup legacy localStorage keys after migration
  cleanupLegacyLocalStorage() {
    const legacyKeys = [
      'ListaProductos',
      'farmacia_cobros',
      'farmacia_historial_documentos',
      'farmacia_historial',
      'farmacia_clientes',
      'app_users',
      'VisitasDiarias',
      'farmacia_agenda',
      'farmacia_auto_backups'
    ];

    console.log('Cleaning up legacy LocalStorage keys...');
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`- Removed ${key}`);
      }
    });
    console.log('Cleanup completed.');
  }


};
