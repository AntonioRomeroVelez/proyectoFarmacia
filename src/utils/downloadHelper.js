import alertify from "alertifyjs";

/**
 * Abre un archivo (PDF, Excel, etc.) en el dispositivo.
 * En dispositivos móviles utiliza Web Share API si está disponible para abrir con la app nativa (WPS, Excel, Acrobat, etc.).
 * En escritorio/navegador abre una nueva pestaña con el archivo Blob o intenta la apertura según el tipo.
 *
 * @param {Blob} blob El objeto Blob del archivo.
 * @param {string} filename Nombre del archivo con su extensión.
 */
export const openDownloadedFile = async (blob, filename) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Asegurar el MIME type correcto
  let mimeType = blob.type;
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (filename.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (filename.toLowerCase().endsWith('.xlsx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (filename.toLowerCase().endsWith('.xls')) {
      mimeType = 'application/vnd.ms-excel';
    }
  }

  const fileBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
  const file = new File([fileBlob], filename, { type: mimeType });

  // 1. En móviles con soporte Share API para archivos: despliega el menú nativo "Abrir con..."
  if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Apertura cancelada por el usuario.');
        return;
      }
      console.warn('Share API falló o fue cancelado, intentando apertura directa:', err);
    }
  }

  // 2. Abrir en nueva pestaña / ventana del navegador (especialmente útil para PDF)
  try {
    const fileUrl = URL.createObjectURL(fileBlob);
    const win = window.open(fileUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Si el bloqueador de popups detuvo window.open, forzamos mediante un tag <a>
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // Revocar la URL de Blob después de 2 minutos
    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 120000);
  } catch (error) {
    console.error('Error al intentar abrir el archivo:', error);
  }
};

/**
 * Guarda un archivo en el dispositivo y muestra la opción de abrirlo inmediatamente.
 *
 * @param {Blob} blob El objeto Blob del archivo.
 * @param {string} filename El nombre del archivo con su extensión.
 * @param {object} [toast] Instancia de toast para mostrar notificaciones.
 */
export const saveOrShareFile = async (blob, filename, toast = null) => {
  // 1. Descarga automática a la carpeta de descargas del dispositivo
  try {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 1000);

    if (toast) {
      toast.success(`📥 Descargado: ${filename}`);
    }
  } catch (error) {
    console.error('Error en la descarga del archivo:', error);
    if (toast) {
      toast.error('❌ Error al descargar el archivo');
    }
    return;
  }

  // 2. Mostrar cuadro de diálogo para dar la opción de abrir el PDF o Excel descargado
  // const lowerName = filename.toLowerCase();
  // const isPdf = lowerName.endsWith('.pdf');
  // const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

  // const fileIcon = isPdf ? '📄' : (isExcel ? '📊' : '📁');
  // const fileTypeLabel = isPdf ? 'PDF' : (isExcel ? 'Excel' : 'archivo');

  // try {
  //   alertify.confirm(
  //     `📥 ${fileTypeLabel} Descargado`,
  //     `<div style="text-align: center; padding: 10px 0;">
  //        <div style="font-size: 2.5rem; margin-bottom: 8px;">${fileIcon}</div>
  //        <div style="font-weight: bold; font-size: 1.05rem; word-break: break-word; color: #1e293b; margin-bottom: 6px;">${filename}</div>
  //        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">El archivo se ha descargado correctamente en tu dispositivo.</p>
  //        <p style="margin-bottom: 0; font-weight: 600; color: #0f172a;">¿Deseas abrir el ${fileTypeLabel} ahora?</p>
  //      </div>`,
  //     async () => {
  //       await openDownloadedFile(blob, filename);
  //     },
  //     () => {
  //       // Usuario eligió "Cerrar" o no abrir
  //     }
  //   ).set({
  //     labels: {
  //       ok: `${fileIcon} Abrir ${fileTypeLabel}`,
  //       cancel: 'Cerrar'
  //     },
  //     closable: true,
  //     movable: false,
  //     transition: 'fade'
  //   });
  // } catch (dialogError) {
  //   console.warn('No se pudo mostrar el diálogo de confirmación:', dialogError);
  // }
};

