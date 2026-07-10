/**
 * Guarda un archivo en dispositivos móviles y escritorio.
 *
 * Comportamiento en MÓVIL:
 *   1. Primero intenta usar navigator.share con SOLO el archivo (sin texto adicional).
 *      Esto en Android/iOS muestra directamente el diálogo nativo "Abrir con..."
 *      permitiendo elegir la app instalada (Excel, WPS, visor PDF, etc.)
 *   2. Si el share falla o no es compatible, usa el enlace de descarga tradicional,
 *      que en Chrome Android sigue mostrando la notificación de descarga con botón "Abrir".
 *
 * Comportamiento en ESCRITORIO:
 *   - Siempre usa la descarga tradicional (ventana/barra de descarga del navegador).
 *
 * @param {Blob} blob El objeto Blob del archivo.
 * @param {string} filename El nombre del archivo con su extensión.
 * @param {object} [toast] Instancia de toast para mostrar notificaciones.
 */
export const saveOrShareFile = async (blob, filename, toast = null) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // En móvil, intentar "Abrir con" / share nativo para acceso inmediato
  if (isMobile && navigator.share) {
    try {
      const file = new File([blob], filename, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Compartir SOLO el archivo, sin título ni texto extra.
        // Esto provoca que Android/iOS muestren directamente las apps con las que abrir el archivo.
        await navigator.share({ files: [file] });

        if (toast) {
          toast.success(`✅ Archivo listo: ${filename}`);
        }
        return;
      }
    } catch (error) {
      // El usuario cerró el diálogo: no descargar automáticamente
      if (error.name === 'AbortError') {
        console.log('El usuario canceló el diálogo de apertura.');
        return;
      }
      // Otro error: caer al método de descarga clásico
      console.warn('navigator.share no disponible, usando descarga clásica:', error);
    }
  }

  // Descarga clásica (escritorio o fallback móvil)
  // En Chrome Android en modo PWA, esto mostrará la notificación inferior "Descargado - Abrir"
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    if (toast) {
      toast.success(`📥 Descargado: ${filename}`);
    }
  } catch (error) {
    console.error('Error en la descarga del archivo:', error);
    if (toast) {
      toast.error('❌ Error al descargar el archivo');
    }
  }
};
