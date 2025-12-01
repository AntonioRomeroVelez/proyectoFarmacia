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

  const exportCobros = (cobrosData) => {
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

      // Fecha de generación
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
      pdf.text(`Total de registros: ${cobrosData.length}`, 14, 30);

      // Tabla
      autoTable(pdf, {
        head: [['Fecha', 'Cliente', 'Cantidad', 'Tipo', 'Método', 'Nº Factura', 'Nº Recibo', 'Observaciones']],
        body: datos.map(d => Object.values(d)),
        startY: 35,
        theme: 'grid',
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
        },
        columnStyles: {
          2: { halign: 'right', fontStyle: 'bold' }, // Cantidad
          7: { cellWidth: 50 } // Observaciones
        },
      });

      // Resumen de totales
      const finalY = pdf.lastAutoTable.finalY || 40;

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');

      const startX = 200;
      pdf.text('Resumen:', startX, finalY + 10);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Abonos (${cobrosData.filter(c => c.tipo === 'Abono').length}):`, startX, finalY + 16);
      pdf.text(`$${totalAbonos.toFixed(2)}`, startX + 60, finalY + 16, { align: 'right' });

      pdf.text(`Cancelaciones (${cobrosData.filter(c => c.tipo === 'Cancelación Total').length}):`, startX, finalY + 22);
      pdf.text(`$${totalCancelaciones.toFixed(2)}`, startX + 60, finalY + 22, { align: 'right' });

      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('Total General:', startX, finalY + 28);
      pdf.text(`$${totalGeneral.toFixed(2)}`, startX + 60, finalY + 28, { align: 'right' });

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

  return {
    downloadPDF,
    generatePDFFromData,
    exportCobros,
  };
};
