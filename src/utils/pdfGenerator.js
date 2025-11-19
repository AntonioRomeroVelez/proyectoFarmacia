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

      const pdf = new jsPDF();
      
      // Debug: Verificar si autoTable está disponible
      console.log("autoTable disponible:", typeof pdf.autoTable);
      console.log("autoTable import:", autoTable);
      console.log("Datos a procesar:", data);

      // Configurar título
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text(
        options.title || "Reporte de Productos",
        pdf.internal.pageSize.getWidth() / 2,
        15,
        { align: "center" }
      );

      // Subtítulo (Cliente)
      if (options.subtitle) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, "normal");
        pdf.text(options.subtitle, 14, 25);
      }

      // Fecha
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      const fechaTexto = options.date || `Generado: ${new Date().toLocaleString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      pdf.text(fechaTexto, 14, options.subtitle ? 30 : 25);

      // Obtener encabezados (columnas) del primer elemento
      const headers = Object.keys(data[0]);
      console.log("Encabezados detectados:", headers);

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
          if (key === "PrecioFarmacia" || key === "PVP" || key === "Subtotal") {
            return value != null ? `$${Number(value).toFixed(2)}` : "-";
          }
          if (key === "IVA" || key === "Descuento") {
            return value != null ? `${value}%` : "-";
          }
          
          return value != null ? String(value) : "-";
        });
      });

      console.log("Encabezados de tabla:", tableHeaders);
      console.log("Datos de tabla:", tableData);

      // Generar la tabla con autoTable
      autoTable(pdf, {
        head: [tableHeaders],
        body: tableData,
        startY: options.subtitle ? 35 : 32,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          // Ajustar anchos de columnas específicas
          0: { cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 32, left: 10, right: 10 },
      });

      // Pie de página con total de productos
      const finalY = pdf.lastAutoTable?.finalY || 40;
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text(`Total de productos: ${data.length}`, 14, finalY + 10);

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

  return {
    downloadPDF,
    generatePDFFromData,
  };
};
