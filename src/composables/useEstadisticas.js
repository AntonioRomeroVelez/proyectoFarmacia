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

      const total = pedido.productos?.reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;
      
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
      pedido.productos?.forEach(p => {
        if (!productosCantidad[p.nombre]) {
          productosCantidad[p.nombre] = 0;
        }
        productosCantidad[p.nombre] += p.cantidad;
      });
    });

    const productosArray = Object.entries(productosCantidad)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

    return {
      labels: productosArray.map(p => p.nombre),
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
      if (cobro.tipo === 'Abono') {
        totalAbonos += cantidad;
        countAbonos++;
      } else if (cobro.tipo === 'Cancelación') {
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

    const totalVentas = historial.reduce((sum, pedido) => {
      const total = pedido.productos?.reduce((s, p) => s + (p.precio * p.cantidad), 0) || 0;
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

  return {
    getEstadisticasVentas,
    getTopProductos,
    getEstadisticasCobros,
    getEstadisticasVisitas,
    getKPIs
  };
}
