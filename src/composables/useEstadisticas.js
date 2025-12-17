import { ref, computed } from 'vue';
import { dbService } from '@/services/db';

export function useEstadisticas() {

  // Helpers internos para cargar datos
  const getProductos = async () => {
    try {
      return await dbService.getAll('productos');
    } catch (error) {
      console.error('Error loading productos stats:', error);
      return [];
    }
  };

  const getVisitas = async () => {
    try {
      return await dbService.getAll('visitas');
    } catch (error) {
      console.error('Error loading visitas stats:', error);
      return [];
    }
  };

  const getCobros = async () => {
    try {
      return await dbService.getAll('cobros');
    } catch (error) {
      console.error('Error loading cobros stats:', error);
      return [];
    }
  };

  const getHistorial = async () => {
    try {
      return await dbService.getAll('historial');
    } catch (error) {
      console.error('Error loading historial stats:', error);
      return [];
    }
  };

  // Filtrar por período
  const filtrarPorPeriodo = (items, periodo, campoFecha = 'fecha') => {
    const hoy = new Date();
    let fechaInicio;

    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'trimestre':
        fechaInicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'año':
        fechaInicio = new Date(hoy.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return items;
    }

    return items.filter(item => {
      // Handle createdAt vs fecha vs date
      // Historial uses 'createdAt' or 'date'? Earlier analysis said 'createdAt'.
      // Visitas uses 'fecha'. Cobros uses 'fecha' (from useCobros filter).
      // Let's be robust
      const dateStr = item[campoFecha] || item.createdAt || item.date;
      if (!dateStr) return false;
      const fechaItem = new Date(dateStr);
      return fechaItem >= fechaInicio && fechaItem <= hoy;
    });
  };

  // Estadísticas de ventas
  const getEstadisticasVentas = async (periodo = 'mes') => {
    const rawHistorial = await getHistorial();
    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt'); // Historial uses createdAt mostly

    // Agrupar por día
    const ventasPorDia = {};
    historial.forEach(pedido => {
      // Robust date parsing
      const dateStr = pedido.createdAt || pedido.date;
      if (!dateStr) return;
      const fecha = dateStr.split('T')[0];

      // El historial guarda items (no productos) con PrecioFarmacia y quantity
      // También puede tener totals.total precalculado
      let total = 0;
      if (pedido.totals?.total) {
        total = Number(pedido.totals.total) || 0;
      } else if (pedido.items && Array.isArray(pedido.items)) {
        total = pedido.items.reduce((sum, p) => {
          const precio = Number(p.PrecioFarmacia || p.precio || 0);
          const cantidad = Number(p.quantity || p.cantidad || 0);
          return sum + (precio * cantidad);
        }, 0);
      }

      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = 0;
      }
      ventasPorDia[fecha] += total;
    });

    // Convertir a arrays para gráficos
    const fechas = Object.keys(ventasPorDia).sort();
    const valores = fechas.map(f => ventasPorDia[f]);

    return {
      labels: fechas.map(f => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
      data: valores,
      total: valores.reduce((a, b) => a + b, 0)
    };
  };

  // Top productos más vendidos
  const getTopProductos = async (periodo = 'mes', limit = 10) => {
    const rawHistorial = await getHistorial();
    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt');

    const productosCantidad = {};
    historial.forEach(pedido => {
      // El historial guarda items (no productos) con NombreProducto y quantity
      const items = pedido.items || pedido.productos || [];
      items.forEach(p => {
        const nombre = p.NombreProducto || p.nombre || 'Sin nombre';
        const cantidad = Number(p.quantity || p.cantidad || 1);
        if (!productosCantidad[nombre]) {
          productosCantidad[nombre] = 0;
        }
        productosCantidad[nombre] += cantidad;
      });
    });

    const productosArray = Object.entries(productosCantidad)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

    // Truncar nombres largos para mejor visualización en el gráfico
    const truncarNombre = (nombre, maxLen = 12) => {
      if (nombre.length <= maxLen) return nombre;
      return nombre.substring(0, maxLen) + '...';
    };

    return {
      labels: productosArray.map(p => truncarNombre(p.nombre)),
      data: productosArray.map(p => p.cantidad)
    };
  };

  // Estadísticas de cobros
  const getEstadisticasCobros = async (periodo = 'mes') => {
    const rawCobros = await getCobros();
    // Cobros usually have 'fecha'
    const cobros = filtrarPorPeriodo(rawCobros, periodo, 'fecha');

    let totalAbonos = 0;
    let totalCancelaciones = 0;
    let countAbonos = 0;
    let countCancelaciones = 0;

    cobros.forEach(cobro => {
      const cantidad = Number(cobro.cantidad) || 0;
      const tipo = (cobro.tipo || '').toLowerCase();

      if (tipo === 'abono') {
        totalAbonos += cantidad;
        countAbonos++;
      } else if (tipo.includes('cancelación') || tipo.includes('cancelacion')) {
        // Incluye "Cancelación", "Cancelación Total", "Cancelación Parcial", etc.
        totalCancelaciones += cantidad;
        countCancelaciones++;
      }
    });

    return {
      labels: ['Abonos', 'Cancelaciones'],
      data: [totalAbonos, totalCancelaciones],
      counts: [countAbonos, countCancelaciones],
      total: totalAbonos + totalCancelaciones
    };
  };

  // Estadísticas de visitas
  const getEstadisticasVisitas = async (periodo = 'mes') => {
    const rawVisitas = await getVisitas();
    const visitas = filtrarPorPeriodo(rawVisitas, periodo, 'fecha');

    // Agrupar por día
    const visitasPorDia = {};
    visitas.forEach(visita => {
      const fecha = visita.fecha.split('T')[0];
      if (!visitasPorDia[fecha]) {
        visitasPorDia[fecha] = 0;
      }
      visitasPorDia[fecha]++;
    });

    const fechas = Object.keys(visitasPorDia).sort();
    const valores = fechas.map(f => visitasPorDia[f]);

    return {
      labels: fechas.map(f => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
      data: valores,
      total: visitas.length
    };
  };

  // KPIs generales
  const getKPIs = async (periodo = 'mes') => {
    // Parallel fetch
    const [rawHistorial, rawCobros, rawVisitas] = await Promise.all([
      getHistorial(),
      getCobros(),
      getVisitas()
    ]);

    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt');
    const cobros = filtrarPorPeriodo(rawCobros, periodo, 'fecha');
    const visitas = filtrarPorPeriodo(rawVisitas, periodo, 'fecha');

    // Calcular total ventas usando la estructura correcta del historial
    const totalVentas = historial.reduce((sum, pedido) => {
      let total = 0;
      if (pedido.totals?.total) {
        total = Number(pedido.totals.total) || 0;
      } else if (pedido.items && Array.isArray(pedido.items)) {
        total = pedido.items.reduce((s, p) => {
          const precio = Number(p.PrecioFarmacia || p.precio || 0);
          const cantidad = Number(p.quantity || p.cantidad || 0);
          return s + (precio * cantidad);
        }, 0);
      }
      return sum + total;
    }, 0);

    const totalCobrado = cobros.reduce((sum, cobro) => sum + (Number(cobro.cantidad) || 0), 0);

    const promedioVenta = historial.length > 0 ? totalVentas / historial.length : 0;

    return {
      totalVentas,
      totalCobrado,
      totalPedidos: historial.length,
      totalVisitas: visitas.length,
      promedioVenta,
      tasaConversion: visitas.length > 0 ? (historial.length / visitas.length * 100) : 0
    };
  };

  // Clientes con saldo pendiente (deudores)
  const getSaldosPendientes = async () => {
    const [rawHistorial, rawCobros] = await Promise.all([
      getHistorial(),
      getCobros()
    ]);

    const clientsMap = {};

    // Helper para normalizar claves
    const normalizeKey = (name) => (name || 'Cliente General').trim().toLowerCase();

    // 1. Procesar Ventas (Solo Pedidos)
    rawHistorial.forEach(pedido => {
      const tipo = (pedido.type || pedido.tipo || '').trim().toLowerCase();
      // FILTRO ESTRICTO: Solo 'pedido'
      if (tipo !== 'pedido') return;

      const docTotal = Number(pedido.totals?.total || 0);
      let total = docTotal;

      if (total === 0 && pedido.items && Array.isArray(pedido.items)) {
        total = pedido.items.reduce((sum, p) => {
          const precio = Number(p.PrecioFarmacia || p.precio || 0);
          const cantidad = Number(p.quantity || p.cantidad || 0);
          return sum + (precio * cantidad);
        }, 0);
      }

      if (total === 0) return;

      const originalName = pedido.clientName || pedido.cliente || 'Cliente General';
      const clientKey = normalizeKey(originalName);

      if (!clientsMap[clientKey]) {
        clientsMap[clientKey] = {
          name: originalName, // Display Name
          ventas: 0,
          cobros: 0
        };
      }
      clientsMap[clientKey].ventas += total;
    });

    // 2. Procesar Cobros
    rawCobros.forEach(cobro => {
      // Solo Abonos y Cancelaciones cuentan
      const tipo = (cobro.tipo || '').toLowerCase();
      if (!['abono', 'cancelación total', 'cancelacion total'].includes(tipo) && !tipo.includes('cancelac')) return;

      const originalName = cobro.cliente || 'Cliente General';
      const clientKey = normalizeKey(originalName);
      const cantidad = Number(cobro.cantidad) || 0;

      if (!clientsMap[clientKey]) {
        clientsMap[clientKey] = {
          name: originalName,
          ventas: 0,
          cobros: 0
        };
      }
      clientsMap[clientKey].cobros += cantidad;
    });

    // 3. Convertir a array y filtrar solo saldos pendientes reales
    return Object.values(clientsMap)
      .map(c => ({
        cliente: c.name,
        ventas: c.ventas,
        cobros: c.cobros,
        saldo: c.ventas - c.cobros
      }))
      .filter(c => c.saldo > 0.01) // Solo mostrar clientes con deuda positiva
      .sort((a, b) => b.saldo - a.saldo);
  };

  return {
    getEstadisticasVentas,
    getTopProductos,
    getEstadisticasCobros,
    getEstadisticasVisitas,
    getKPIs,
    getSaldosPendientes
  };
}
