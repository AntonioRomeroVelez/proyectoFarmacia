import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'farmacia_historial_documentos';

// Estado compartido (Singleton)
const documents = ref([]);
const isLoaded = ref(false);

export function useHistorial() {
  const toast = useToast();

  // Cargar documentos al iniciar (solo si no se ha cargado)
  const loadDocuments = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        documents.value = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing historial from localStorage', e);
        documents.value = [];
      }
    }
    isLoaded.value = true;
  };

  // Guardar un nuevo documento
  const saveDocument = (docData) => {
    const newDoc = {
      id: Date.now().toString(), // ID único basado en timestamp
      createdAt: new Date().toISOString(),
      ...docData
    };
    
    documents.value.unshift(newDoc); // Agregar al principio
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents.value));
    toast.success('Documento guardado en historial');
    return newDoc;
  };

  // Eliminar un documento por ID
  const deleteDocument = (id) => {
    documents.value = documents.value.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents.value));
    toast.info('Documento eliminado del historial');
  };

  // Eliminar todos los documentos
  const clearAllDocuments = () => {
    documents.value = [];
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Historial vaciado correctamente');
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
