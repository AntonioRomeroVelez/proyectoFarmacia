import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { useToast } from "vue-toastification";

export const useExcelHandler = () => {
  const toast = useToast();

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          resolve(jsonData);
        } catch (error) {
          toast.error("Error al leer el archivo Excel");
          reject(error);
        }
      };

      reader.onerror = () => {
        toast.error("Error al leer el archivo");
        reject(new Error("Error reading file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Keep exportToExcel for simple exports if needed, or just for compatibility
  const exportToExcel = (data, filename = "datos.xlsx") => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      XLSX.writeFile(workbook, filename);
      toast.success("Archivo Excel exportado correctamente");
    } catch (error) {
      toast.error("Error al exportar el archivo Excel");
      throw error;
    }
  };

  // Deprecated: exportCartToExcel (using exportCustomExcel instead)
  const exportCartToExcel = (cartData, filename = "carrito.xlsx") => {
    exportToExcel(cartData.items, filename); // Fallback
  };

  const exportCustomExcel = async (metadata, tableData, filename = "export.xlsx") => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte");

      // --- 1. Metadata Section ---
      let currentRow = 1;
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          const row = worksheet.getRow(currentRow);
          row.getCell(1).value = key;
          row.getCell(2).value = value;

          // Style metadata keys
          row.getCell(1).font = { bold: true };

          currentRow++;
        });
        currentRow++; // Empty row after metadata
      }

      // --- 2. Table Headers ---
      if (tableData.length > 0) {
        const headers = Object.keys(tableData[0]);
        const headerRow = worksheet.getRow(currentRow);

        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;

          // Style Headers
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" }, // Blue
          };
          cell.font = {
            color: { argb: "FFFFFFFF" }, // White
            bold: true,
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        currentRow++;

        // --- 3. Table Data ---
        tableData.forEach((item) => {
          const row = worksheet.getRow(currentRow);
          row.height = 55; // EL ALTO DE CADA CELDA DEL EXCEL
          headers.forEach((header, index) => {
            const cell = row.getCell(index + 1);
            cell.value = item[header];

            // Style Data Cells
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
              wrapText: true,
            };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
          currentRow++;
        });

        // Auto-adjust column widths
        // Configurar anchos de columnas
        worksheet.columns.forEach((column, index) => {
          const header = headers[index];

          // Si la columna es "Lote", asignar ancho de 30
          if (header === "Lote") {
            column.width = 30;
          } else {
            // Auto-ajustar ancho para otras columnas
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
          }
        });
      }

      // --- 4. Download ---
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      // Create download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Archivo Excel generado con éxito");
    } catch (error) {
      console.error("Error exporting custom excel:", error);
      toast.error("Error al generar el Excel");
    }
  };

  const exportarCobrosExcel = async (cobros) => {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Cobros_${fecha}.xlsx`;

      const tableData = cobros.map(cobro => ({
        'Fecha': cobro.fecha,
        'Cliente': cobro.cliente,
        'Cantidad': `$${Number(cobro.cantidad).toFixed(2)}`,
        'Tipo': cobro.tipo,
        'Método de Pago': cobro.metodoPago,
        'Nº Factura': cobro.numeroFactura || '-',
        'Nº Recibo': cobro.numeroRecibo || '-',
        'Observaciones': cobro.observaciones || ''
      }));

      const total = cobros.reduce((sum, c) => sum + parseFloat(c.cantidad || 0), 0);

      const metadata = {
        'Reporte': 'Registro de Cobros',
        'Fecha de Exportación': fecha,
        'Total de Cobros': cobros.length,
        'Monto Total': `$${total.toFixed(2)}`
      };

      await exportCustomExcel(metadata, tableData, filename);
    } catch (error) {
      console.error('Error exporting cobros:', error);
      toast.error('Error al exportar cobros');
    }
  };

  return {
    readExcelFile,
    exportToExcel,
    exportCartToExcel,
    exportCustomExcel,
    exportarCobrosExcel
  };
};

