import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useToast } from "vue-toastification";

export const usePDFGenerator = () => {
  const toast = useToast();

  const downloadPDF = async (elementId, filename = "documento.pdf") => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento no encontrado");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      toast.success("PDF generado correctamente");
    } catch (error) {
      toast.error("Error al generar el PDF");
      throw error;
    }
  };

  const generatePDFFromData = (data, filename = "reporte.pdf", options = {}) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No hay datos para generar el PDF");
        return;
      }

      // Obtener encabezados (columnas) del primer elemento
      const headers = Object.keys(data[0]);

      // Determinar orientación y tamaño de fuente basado en número de columnas
      const isLandscape = headers.length > 8;
      const orientation = isLandscape ? "l" : "p";
      const pdf = new jsPDF(orientation, "mm", "a4");

      // Ajustar estilos según orientación
      const baseFontSize = isLandscape ? 8 : 9;
      const cellPadding = isLandscape ? 2 : 3;

      // Configurar título principal (Tipo de Documento)
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.text(
        options.title || "Reporte",
        pdf.internal.pageSize.getWidth() / 2,
        15,
        { align: "center" }
      );

      // Subtítulo (Título personalizado)
      if (options.subtitle) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, "normal");
        pdf.text(options.subtitle, pdf.internal.pageSize.getWidth() / 2, 22, { align: "center" });
      }

      let startY = 32;

      // Renderizar datos del encabezado si existen
      if (options.headerData) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");

        // Columna Izquierda
        pdf.text("Cliente:", 14, 32);
        pdf.text("Ciudad:", 14, 37);

        // Columna Derecha
        pdf.text("Fecha:", 120, 32);
        pdf.text("Vendedor:", 120, 37);

        pdf.setFont(undefined, "normal");

        // Valores Izquierda
        pdf.text(options.headerData.cliente || "-", 35, 32);
        pdf.text(options.headerData.ciudad || "-", 35, 37);

        // Valores Derecha
        pdf.text(options.headerData.fecha || "-", 145, 32);
        pdf.text(options.headerData.vendedor || "-", 145, 37);

        startY = 45; // Ajustar inicio de la tabla
      } else {
        // Fallback para compatibilidad anterior
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        const fechaTexto = options.date || `Generado: ${new Date().toLocaleString("es-ES")}`;
        pdf.text(fechaTexto, 14, options.subtitle ? 30 : 25);
        startY = options.subtitle ? 35 : 32;
      }

      // Mapeo de nombres de columnas a etiquetas legibles
      const columnLabels = {
        Codigo: "Código",
        Marca: "Marca",
        Producto: "Producto",
        NombreProducto: "Nombre",
        Presentacion: "Presentación",
        PrincipioActivo: "Principio Activo",
        Precio: "Precio",
        PrecioFarmacia: "Precio Farm.",
        PVP: "PVP",
        IVA: "IVA %",
        Descuento: "Desc. %",
        "Descuento %": "Descuento %",
        Promocion: "Promoción",
        quantity: "Cantidad",
        Subtotal: "Subtotal",
        "Cantidad a recibir": "Cant. Recibir",
        Bonificacion: "Bonificación",
        P_Unitario: "P. Unitario",
        P_Total: "P. Total"
      };

      // Crear array de encabezados con etiquetas
      const tableHeaders = headers.map(
        (key) => columnLabels[key] || key
      );

      // Crear array de datos (filas)
      const tableData = data.map((item) => {
        return headers.map((key) => {
          const value = item[key];

          // Formatear valores numéricos
          if (key === "PrecioFarmacia" || key === "PVP" || key === "Subtotal" || key === "PrecioTotal" || key === "TotalConIVA" || key === "TotalSinIVA") {
            return value != null ? `$${Number(value).toFixed(2)}` : "";
          }
          if (key === "IVA" || key === "Descuento") {
            return value != null ? `${value}%` : "";
          }

          return value != null ? String(value) : "";
        });
      });

      // Generar la tabla con autoTable
      autoTable(pdf, {
        head: [tableHeaders],
        body: tableData,
        startY: startY,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
          fontSize: baseFontSize,
          overflow: "linebreak",
          minCellHeight: 10,
        },
        styles: {
          fontSize: baseFontSize,
          cellPadding: cellPadding,
          valign: "middle",
          overflow: "linebreak",
        },
        columnStyles: {
          // Configurar ancho específico para "Desc. en + 2 uni"
          ...Object.fromEntries(
            headers.map((header, index) => {
              if (header === "Desc. en + 2 uni") {
                return [index, { cellWidth: 17, halign: 'center' }];
              }
              return [index, {}];
            })
          ),
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 32, left: 10, right: 10 },
      });

      // Pie de página con total de productos
      let finalY = pdf.lastAutoTable?.finalY || 40;
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text(`Total de productos: ${data.length}`, 14, finalY + 10);

      // Renderizar tabla de resumen de totales si existe
      if (options.totals) {
        const totalsData = [
          ["Subtotal:", `$${Number(options.totals.subtotal).toFixed(2)}`],
          ["Base 0%:", `$${Number(options.totals.base0).toFixed(2)}`],
          ["Base 15%:", `$${Number(options.totals.base15).toFixed(2)}`],
          ["IVA 15%:", `$${Number(options.totals.iva).toFixed(2)}`],
          ["Total:", `$${Number(options.totals.total).toFixed(2)}`],
        ];

        autoTable(pdf, {
          body: totalsData,
          startY: finalY + 15,
          theme: "plain",
          styles: {
            fontSize: 10,
            cellPadding: 2,
          },
          columnStyles: {
            0: { fontStyle: "bold", halign: "right", cellWidth: 140 }, // Etiqueta alineada a la derecha
            1: { halign: "right", cellWidth: 40 }, // Valor alineado a la derecha
          },
          margin: { right: 10 },
        });
      }

      // Guardar el PDF
      pdf.save(filename);
      console.log("PDF guardado:", filename);
      toast.success(`✅ PDF generado: ${filename}`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("❌ Error al generar el PDF");
      throw error;
    }
  };

  const exportCobros = (cobrosData, filtros = {}) => {
    try {
      if (!cobrosData || cobrosData.length === 0) {
        toast.error("No hay datos para exportar");
        return;
      }

      // Preparar datos para el PDF
      const datos = cobrosData.map(cobro => ({
        Fecha: cobro.fecha,
        Cliente: cobro.cliente,
        Cantidad: `$${Number(cobro.cantidad).toFixed(2)}`,
        Tipo: cobro.tipo,
        'Método': cobro.metodoPago,
        'Nº Factura': cobro.numeroFactura || '-',
        'Nº Recibo': cobro.numeroRecibo || '-',
        Observaciones: cobro.observaciones || '-'
      }));

      // Calcular totales
      const totalGeneral = cobrosData.reduce((sum, cobro) => sum + Number(cobro.cantidad), 0);
      const totalAbonos = cobrosData
        .filter(c => c.tipo === 'Abono')
        .reduce((sum, cobro) => sum + Number(cobro.cantidad), 0);
      const totalCancelaciones = cobrosData
        .filter(c => c.tipo === 'Cancelación Total')
        .reduce((sum, cobro) => sum + Number(cobro.cantidad), 0);

      // Crear PDF con totales
      const pdf = new jsPDF('l', 'mm', 'a4');

      // Título
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Registro de Cobros', pdf.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      // Fecha de generación + Filtros aplicados
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      let headerY = 25;
      pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, headerY);
      headerY += 5;
      pdf.text(`Total de registros: ${cobrosData.length}`, 14, headerY);

      // Mostrar filtros si existen
      headerY += 5;
      let filterText = [];
      if (filtros.fechaInicio || filtros.fechaFin) {
        filterText.push(`Rango: ${filtros.fechaInicio || 'Inicio'} al ${filtros.fechaFin || 'Hoy'}`);
      }
      if (filtros.tipo) {
        filterText.push(`Tipo: ${filtros.tipo}`);
      }
      if (filtros.metodoPago) {
        filterText.push(`Método: ${filtros.metodoPago}`);
      }

      if (filterText.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text(`Filtros: ${filterText.join(' | ')}`, 14, headerY);
        pdf.setFont(undefined, 'normal');
        headerY += 5;
      }

      // Tabla
      autoTable(pdf, {
        head: [['Fecha', 'Cliente', 'Cantidad', 'Tipo', 'Método', 'Nº Factura', 'Nº Recibo', 'Observaciones']],
        body: datos.map(d => Object.values(d)),
        startY: headerY + 5,
        theme: 'grid',
        margin: { left: 10, right: 10 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak', // Ensure text wraps
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Fecha
          1: { cellWidth: 45 }, // Cliente
          2: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }, // Cantidad
          3: { cellWidth: 25 }, // Tipo
          4: { cellWidth: 25 }, // Método
          5: { cellWidth: 25 }, // Factura
          6: { cellWidth: 25 }, // Recibo
          7: { cellWidth: 'auto' } // Observaciones (takes remaining space)
        },
      });

      // Resumen de totales (Tabla Estilizada)
      const finalY = pdf.lastAutoTable.finalY + 10;

      // Datos para la tabla de resumen
      const resumenData = [
        ['Abonos:', `$${totalAbonos.toFixed(2)}`],
        ['Cancelaciones:', `$${totalCancelaciones.toFixed(2)}`],
        ['TOTAL GENERAL:', `$${totalGeneral.toFixed(2)}`]
      ];

      autoTable(pdf, {
        body: resumenData,
        startY: finalY,
        theme: 'grid',
        tableWidth: 80,
        margin: { left: pdf.internal.pageSize.getWidth() - 90 }, // Alinear a la derecha
        styles: {
          fontSize: 10,
          cellPadding: 3,
          valign: 'middle'
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] },
          1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          // Resaltar la fila de TOTAL GENERAL
          if (data.row.index === 2) {
            data.cell.styles.fillColor = [41, 128, 185];
            data.cell.styles.textColor = 255;
            data.cell.styles.fontSize = 11;
          }
        }
      });

      // Generar nombre de archivo
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Cobros-${fecha}.pdf`;

      pdf.save(filename);
      toast.success(`✅ PDF generado: ${filename}`);
    } catch (error) {
      console.error('Error al generar PDF de cobros:', error);
      toast.error('❌ Error al generar el PDF');
      throw error;
    }
  };

  const exportCobrosImagenes = (cobrosData, action = 'save') => {
    try {
      if (!cobrosData || cobrosData.length === 0) {
        toast.error("No hay datos para exportar");
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Aplanar la lista de imágenes para procesar
      const itemsParaPDF = [];
      cobrosData.forEach(cobro => {
        const imagenes = cobro.imagenes && cobro.imagenes.length > 0
          ? cobro.imagenes
          : (cobro.imagen ? [cobro.imagen] : []);

        imagenes.forEach(img => {
          itemsParaPDF.push({
            ...cobro,
            imagenActual: img
          });
        });
      });

      if (itemsParaPDF.length === 0) {
        toast.warning("No hay imágenes para exportar");
        return;
      }

      // Cada imagen en su propia página, centrada al 75%
      itemsParaPDF.forEach((item, index) => {
        // Agregar nueva página excepto para la primera
        if (index > 0) {
          pdf.addPage();
        }

        try {
          // Obtener propiedades de la imagen para calcular aspect ratio
          const imgProps = pdf.getImageProperties(item.imagenActual);
          const imgRatio = imgProps.width / imgProps.height;

          // Calcular dimensiones al 75% de la página
          const maxWidth = pageWidth * 0.75;
          const maxHeight = pageHeight * 0.75;

          // Calcular dimensiones finales manteniendo aspect ratio
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / imgRatio;

          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgRatio;
          }

          // Calcular posición para centrar la imagen en la página
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          pdf.addImage(
            item.imagenActual,
            'JPEG',
            x,
            y,
            finalWidth,
            finalHeight,
            undefined,
            'MEDIUM'
          );
        } catch (error) {
          console.error('Error al agregar imagen:', error);
          pdf.setFontSize(12);
          pdf.setTextColor(255, 0, 0);
          pdf.text('Error al cargar imagen', pageWidth / 2, pageHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      });

      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Cobros-Imagenes-${fecha}.pdf`;

      if (action === 'save') {
        pdf.save(filename);
        toast.success(`✅ PDF guardado: ${filename}`);
      } else if (action === 'print') {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(blobUrl);
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
        toast.success('🖨️ Preparando impresión...');
      }
    } catch (error) {
      console.error('Error al generar PDF de imágenes:', error);
      toast.error('❌ Error al generar el PDF de imágenes');
      throw error;
    }
  };

  // Export images from pre-selected list (from ImageSelectionModal)
  const exportCobrosImagenesFromSelection = (selectedImages, action = 'save') => {
    try {
      if (!selectedImages || selectedImages.length === 0) {
        toast.error("No hay imágenes seleccionadas para exportar");
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Each image on its own page, centered at 75%
      selectedImages.forEach((item, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        try {
          const imgProps = pdf.getImageProperties(item.image);
          const imgRatio = imgProps.width / imgProps.height;

          const maxWidth = pageWidth * 0.75;
          const maxHeight = pageHeight * 0.75;

          let finalWidth = maxWidth;
          let finalHeight = maxWidth / imgRatio;

          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgRatio;
          }

          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          pdf.addImage(
            item.image,
            'JPEG',
            x,
            y,
            finalWidth,
            finalHeight,
            undefined,
            'MEDIUM'
          );
        } catch (error) {
          console.error('Error al agregar imagen:', error);
          pdf.setFontSize(12);
          pdf.setTextColor(255, 0, 0);
          pdf.text('Error al cargar imagen', pageWidth / 2, pageHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      });

      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Cobros-Imagenes-${fecha}.pdf`;

      if (action === 'save') {
        pdf.save(filename);
        toast.success(`✅ PDF guardado: ${filename}`);
      } else if (action === 'print') {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(blobUrl);
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
        toast.success('🖨️ Preparando impresión...');
      }
    } catch (error) {
      console.error('Error al generar PDF de imágenes:', error);
      toast.error('❌ Error al generar el PDF de imágenes');
      throw error;
    }
  };

  return {
    downloadPDF,
    generatePDFFromData,
    exportCobros,
    exportCobrosImagenes,
    exportCobrosImagenesFromSelection,
  };
};
