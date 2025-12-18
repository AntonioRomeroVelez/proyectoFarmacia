import { ref, computed } from 'vue';
import { dbService } from '@/services/db';
import { useHistorial } from '@/composables/useHistorial';
import { useCobros } from '@/composables/useCobros';
import { useVisitas } from '@/composables/useVisitas';

export function useEstadisticas() {
  const { documents } = useHistorial();
  const { cobros: rawCobroList } = useCobros();
  const { visitas: rawVisitaList } = useVisitas();

  // Helpers internos para obtener datos reactivos
  const getHistorial = () => documents.value;
  const getCobros = () => rawCobroList.value;
  const getVisitas = () => rawVisitaList.value;

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
      const dateStr = item[campoFecha] || item.createdAt || item.date;
      if (!dateStr) return false;
      const fechaItem = new Date(dateStr);
      return fechaItem >= fechaInicio && fechaItem <= hoy;
    });
  };

  // Helper para calcular total de un documento de forma robusta
  const calcularTotalDoc = (doc) => {
    let total = Number(doc.totals?.total || 0);
    if (total === 0 && doc.items && Array.isArray(doc.items)) {
      total = doc.items.reduce((sum, p) => {
        const precio = Number(p.PrecioFarmacia || p.precio || 0);
        const cantidad = Number(p.quantity || p.cantidad || 0);
        return sum + (precio * cantidad);
      }, 0);
    }
    return total;
  };

  // Estadísticas de ventas
  const getEstadisticasVentas = (periodo = 'mes') => {
    const rawHistorial = getHistorial();
    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt');

    const ventasPorDia = {};
    historial.forEach(pedido => {
      const tipo = (pedido.type || pedido.tipo || '').trim().toLowerCase();
      if (tipo !== 'pedido') return;

      const dateStr = pedido.createdAt || pedido.date;
      if (!dateStr) return;
      const fecha = dateStr.split('T')[0];
      const total = calcularTotalDoc(pedido);

      if (!ventasPorDia[fecha]) ventasPorDia[fecha] = 0;
      ventasPorDia[fecha] += total;
    });

    const fechas = Object.keys(ventasPorDia).sort();
    const valores = fechas.map(f => ventasPorDia[f]);

    return {
      labels: fechas.map(f => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
      data: valores,
      total: valores.reduce((a, b) => a + b, 0)
    };
  };

  // Top productos más vendidos
  const getTopProductos = (periodo = 'mes', limit = 10) => {
    const rawHistorial = getHistorial();
    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt');

    const productosCantidad = {};
    historial.forEach(pedido => {
      const tipo = (pedido.type || pedido.tipo || '').trim().toLowerCase();
      if (tipo !== 'pedido') return;

      const items = pedido.items || pedido.productos || [];
      items.forEach(p => {
        const nombre = p.NombreProducto || p.nombre || 'Sin nombre';
        const cantidad = Number(p.quantity || p.cantidad || 1);
        if (!productosCantidad[nombre]) productosCantidad[nombre] = 0;
        productosCantidad[nombre] += cantidad;
      });
    });

    const productosArray = Object.entries(productosCantidad)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

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
  const getEstadisticasCobros = (periodo = 'mes') => {
    const rawCobros = getCobros();
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
      } else if (tipo.includes('cancelac')) {
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
  const getEstadisticasVisitas = (periodo = 'mes') => {
    const rawVisitas = getVisitas();
    const visitas = filtrarPorPeriodo(rawVisitas, periodo, 'fecha');

    const visitasPorDia = {};
    visitas.forEach(visita => {
      const fecha = (visita.fecha || '').split('T')[0];
      if (!fecha) return;
      if (!visitasPorDia[fecha]) visitasPorDia[fecha] = 0;
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
  const getKPIs = (periodo = 'mes') => {
    const rawHistorial = getHistorial();
    const rawCobros = getCobros();
    const rawVisitas = getVisitas();

    const historial = filtrarPorPeriodo(rawHistorial, periodo, 'createdAt');
    const cobros = filtrarPorPeriodo(rawCobros, periodo, 'fecha');
    const visitas = filtrarPorPeriodo(rawVisitas, periodo, 'fecha');

    const ventasRecientes = historial.filter(doc => (doc.type || doc.tipo || '').toLowerCase() === 'pedido');
    const totalVentas = ventasRecientes.reduce((sum, pedido) => sum + calcularTotalDoc(pedido), 0);
    const totalCobrado = cobros.reduce((sum, cobro) => sum + (Number(cobro.cantidad) || 0), 0);
    const promedioVenta = ventasRecientes.length > 0 ? totalVentas / ventasRecientes.length : 0;

    return {
      totalVentas,
      totalCobrado,
      totalPedidos: ventasRecientes.length,
      totalVisitas: visitas.length,
      promedioVenta,
      tasaConversion: visitas.length > 0 ? (ventasRecientes.length / visitas.length * 100) : 0
    };
  };

  // NUEVO: Obtener todos los pedidos individuales con saldo pendiente
  const getPedidosPendientes = () => {
    const rawHistorial = getHistorial();
    const rawCobros = getCobros();

    const pedidosPendientes = [];

    // 1. Filtrar solo pedidos
    const pedidos = rawHistorial.filter(doc => (doc.type || doc.tipo || '').toLowerCase() === 'pedido');

    pedidos.forEach(pedido => {
      const total = calcularTotalDoc(pedido);

      // Encontrar cobros vinculados a este pedido
      const cobrosPedido = rawCobros.filter(c => c.pedidoId === pedido.id &&
        (['abono', 'cancelación total', 'cancelacion total'].includes(c.tipo?.toLowerCase()) || c.tipo?.toLowerCase().includes('cancelac'))
      );

      const totalPagado = cobrosPedido.reduce((sum, c) => sum + (Number(c.cantidad) || 0), 0);
      const saldo = total - totalPagado;

      if (saldo > 0.01) {
        pedidosPendientes.push({
          id: pedido.id,
          fecha: pedido.createdAt || pedido.date,
          cliente: pedido.clientName || pedido.cliente || 'Cliente General',
          total,
          abonado: totalPagado,
          saldo: saldo
        });
      }
    });

    return pedidosPendientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  // Clientes con saldo pendiente (deudores)
  const getSaldosPendientes = (soloDeudores = true) => {
    const pedidosPendientes = getPedidosPendientes();
    const clientsMap = {};

    pedidosPendientes.forEach(p => {
      const key = (p.cliente || 'Cliente General').trim().toLowerCase();
      if (!clientsMap[key]) {
        clientsMap[key] = {
          cliente: p.cliente,
          ventas: 0,
          abonos: 0,
          saldo: 0
        };
      }
      clientsMap[key].ventas += p.total;
      clientsMap[key].abonos += p.abonado;
      clientsMap[key].saldo += p.saldo;
    });

    const result = Object.values(clientsMap).sort((a, b) => b.saldo - a.saldo);
    return soloDeudores ? result.filter(c => c.saldo > 0.01) : result;
  };

  const getResumenGeneral = () => {
    const clients = getSaldosPendientes(false);
    const totals = clients.reduce((acc, c) => {
      acc.ventas += c.ventas;
      acc.abonos += c.abonos;
      acc.saldos += c.saldo;
      return acc;
    }, { ventas: 0, abonos: 0, saldos: 0 });

    return {
      totalVentas: totals.ventas,
      totalAbonos: totals.abonos,
      totalSaldos: totals.saldos,
      totalGeneral: totals.ventas
    };
  };

  const getEstadoCuenta = (clienteNombre) => {
    const rawHistorial = getHistorial();
    const rawCobros = getCobros();
    const target = (clienteNombre || '').trim().toLowerCase();
    const movimientos = [];

    rawHistorial.forEach(doc => {
      if ((doc.clientName || doc.cliente || '').trim().toLowerCase() === target &&
        ['pedido', 'proforma'].includes((doc.type || doc.tipo || '').toLowerCase())) {
        movimientos.push({
          id: doc.id,
          fecha: doc.createdAt || doc.date,
          tipo: doc.type || doc.tipo || 'Pedido',
          referencia: doc.id.substring(0, 8),
          debe: calcularTotalDoc(doc),
          haber: 0,
          saldo: 0
        });
      }
    });

    rawCobros.forEach(cobro => {
      if ((cobro.cliente || '').trim().toLowerCase() === target) {
        movimientos.push({
          id: cobro.id,
          fecha: cobro.fecha,
          tipo: 'Cobro (' + cobro.metodoPago + ')',
          referencia: cobro.numeroRecibo || cobro.id.substring(0, 8),
          debe: 0,
          haber: Number(cobro.cantidad || 0),
          saldo: 0
        });
      }
    });

    movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    let saldoAcumulado = 0;
    movimientos.forEach(m => {
      saldoAcumulado += (m.debe - m.haber);
      m.saldo = saldoAcumulado;
    });

    return movimientos;
  };

  const getComparativaAnual = () => {
    const rawHistorial = getHistorial();
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const añoAnterior = añoActual - 1;
    const ventasActual = new Array(12).fill(0);
    const ventasAnterior = new Array(12).fill(0);

    rawHistorial.forEach(doc => {
      if ((doc.type || doc.tipo || '').toLowerCase() !== 'pedido') return;
      const fecha = new Date(doc.createdAt || doc.date);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const total = calcularTotalDoc(doc);
      if (año === añoActual) ventasActual[mes] += total;
      else if (año === añoAnterior) ventasAnterior[mes] += total;
    });

    return {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      actual: ventasActual,
      anterior: ventasAnterior
    };
  };

  return {
    getEstadisticasVentas,
    getTopProductos,
    getEstadisticasCobros,
    getEstadisticasVisitas,
    getKPIs,
    getSaldosPendientes,
    getPedidosPendientes,
    getEstadoCuenta,
    getComparativaAnual,
    getResumenGeneral
  };
}
