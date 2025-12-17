import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService, dbRequest } from '@/services/db';

// Estado compartido (Singleton)
const documents = ref([]);
const isLoaded = ref(false);

export function useHistorial() {
  const toast = useToast();

  // Cargar documentos al iniciar (solo si no se ha cargado)
  const loadDocuments = async () => {
    try {
      const stored = await dbService.getAll('historial');
      // Sort by date desc (if not already sorted by DB key)
      // Assuming keys or simple sort.
      documents.value = stored.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      isLoaded.value = true;
    } catch (e) {
      console.error('Error loading historial from DB:', e);
      toast.error('Error al cargar historial');
    }
  };

  // Guardar un nuevo documento
  const saveDocument = async (docData, silent = false) => {
    const newDoc = {
      id: Date.now().toString(), // ID único basado en timestamp
      createdAt: new Date().toISOString(),
      ...docData
    };

    // Deep clone to avoid proxy issues
    const docToSave = JSON.parse(JSON.stringify(newDoc));

    try {
      await dbService.put('historial', docToSave);
      documents.value.unshift(docToSave); // Agregar al principio
      if (!silent) toast.success('Documento guardado en historial');
      return docToSave;
    } catch (e) {
      console.error('Error saving document:', e);
      if (!silent) toast.error('Error al guardar documento');
      throw e;
    }
  };

  // Eliminar un documento por ID
  const deleteDocument = async (id) => {
    try {
      await dbService.delete('historial', id);
      documents.value = documents.value.filter(doc => doc.id !== id);
      toast.info('Documento eliminado del historial');
    } catch (e) {
      console.error('Error deleting document:', e);
      toast.error('Error al eliminar documento');
    }
  };

  // Eliminar todos los documentos
  const clearAllDocuments = async () => {
    try {
      const db = await dbRequest;
      const tx = db.transaction('historial', 'readwrite');
      await tx.objectStore('historial').clear();
      await tx.done;

      documents.value = [];
      toast.info('Historial vaciado correctamente');
    } catch (e) {
      console.error('Error clearing historial:', e);
      toast.error('Error al vaciar historial');
    }
  };

  // Inicializar carga si es la primera vez que se usa
  if (!isLoaded.value) {
    loadDocuments();
  }

  return {
    documents,
    saveDocument,
    deleteDocument,
    clearAllDocuments,
    loadDocuments // Exportar por si se necesita recargar manualmente
  };
}
