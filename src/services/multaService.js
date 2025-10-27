const { db } = require("../config/firebase");
const { validateMulta } = require("../utils/validators");
const { AppError } = require("../middlewares/errorHandler");
const socioService = require("./socioService");

class MultaService {
  constructor() {
    this.collection = db.collection("multas");
  }

  /**
   * Convierte timestamps de Firestore a fechas ISO
   */
  convertirFechas(multa) {
    const convertirFecha = (fecha) => {
      if (!fecha) return null;
      // Si es un Timestamp de Firestore
      if (fecha._seconds !== undefined) {
        return new Date(fecha._seconds * 1000).toISOString();
      }
      // Si ya es un objeto Date
      if (fecha instanceof Date) {
        return fecha.toISOString();
      }
      // Si es un objeto con toDate() (Firestore Timestamp)
      if (fecha.toDate && typeof fecha.toDate === 'function') {
        return fecha.toDate().toISOString();
      }
      return fecha;
    };

    return {
      ...multa,
      fechaMulta: convertirFecha(multa.fechaMulta),
      fechaPago: convertirFecha(multa.fechaPago),
      fechaCreacion: convertirFecha(multa.fechaCreacion),
      fechaActualizacion: convertirFecha(multa.fechaActualizacion)
    };
  }

  /**
   * Poblar datos de socio y préstamo
   */
  async poblarDatos(multa) {
    try {
      // Primero convertir las fechas
      const multaConFechas = this.convertirFechas(multa);

      const socio = await socioService.obtenerSocioPorId(multaConFechas.idSocio).catch(() => null);
      
      let prestamo = null;
      if (multaConFechas.idPrestamo) {
        const prestamoDoc = await db.collection("prestamos").doc(multaConFechas.idPrestamo).get();
        if (prestamoDoc.exists) {
          prestamo = { id: prestamoDoc.id, ...prestamoDoc.data() };
          
          // Convertir fechas del préstamo
          if (prestamo.fechaPrestamo) {
            prestamo.fechaPrestamo = this.convertirFechas({ fechaMulta: prestamo.fechaPrestamo }).fechaMulta;
          }
          if (prestamo.fechaDevolucion) {
            prestamo.fechaDevolucion = this.convertirFechas({ fechaMulta: prestamo.fechaDevolucion }).fechaMulta;
          }
          if (prestamo.fechaDevolucionReal) {
            prestamo.fechaDevolucionReal = this.convertirFechas({ fechaMulta: prestamo.fechaDevolucionReal }).fechaMulta;
          }
          
          // Poblar libro en el préstamo
          if (prestamo.idLibro) {
            const libroDoc = await db.collection("libros").doc(prestamo.idLibro).get();
            if (libroDoc.exists) {
              prestamo.libro = { id: libroDoc.id, ...libroDoc.data() };
            }
          }
        }
      }

      return {
        ...multaConFechas,
        socio: socio || { nombre: 'Socio no encontrado', numeroSocio: '-', dni: '-' },
        prestamo: prestamo
      };
    } catch (error) {
      console.error('Error al poblar datos de multa:', error);
      return this.convertirFechas(multa);
    }
  }

  /**
   * Registrar una nueva multa
   */
  async registrarMulta(data) {
    // Validar datos
    const validation = validateMulta(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Verificar que el socio existe
    await socioService.obtenerSocioPorId(data.idSocio);

    // Verificar que el préstamo existe (si se proporciona)
    if (data.idPrestamo) {
      const prestamoDoc = await db.collection("prestamos").doc(data.idPrestamo).get();
      if (!prestamoDoc.exists) {
        throw new AppError("Préstamo no encontrado", 404);
      }
    }

    // Crear objeto de multa
    const multa = {
      idPrestamo: data.idPrestamo || null,
      idSocio: data.idSocio,
      monto: parseFloat(data.monto),
      tipoMulta: data.tipoMulta || 'OTROS',
      descripcion: data.descripcion.trim(),
      estadoMulta: "PENDIENTE",
      fechaMulta: new Date(),
      fechaPago: null,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Guardar en Firestore
    const docRef = await this.collection.add(multa);
    
    const multaCreada = {
      id: docRef.id,
      ...multa
    };

    // Poblar datos antes de retornar (esto convertirá las fechas)
    return await this.poblarDatos(multaCreada);
  }

  /**
   * Obtener todas las multas con filtros opcionales
   */
  async obtenerMultas(filtros = {}) {
    let query = this.collection;

    // Aplicar filtros
    if (filtros.estadoMulta) {
      query = query.where("estadoMulta", "==", filtros.estadoMulta);
    }

    if (filtros.idSocio) {
      query = query.where("idSocio", "==", filtros.idSocio);
    }

    const snapshot = await query.get();
    
    const multas = [];
    for (const doc of snapshot.docs) {
      const multaData = doc.data();
      const multaConDatos = await this.poblarDatos({
        id: doc.id,
        ...multaData
      });
      multas.push(multaConDatos);
    }

    return multas;
  }

  /**
   * Obtener una multa por ID
   */
  async obtenerMultaPorId(id) {
    const doc = await this.collection.doc(id).get();
    
    if (!doc.exists) {
      throw new AppError("Multa no encontrada", 404);
    }

    const multa = {
      id: doc.id,
      ...doc.data()
    };

    // Poblar datos antes de retornar (esto convertirá las fechas)
    return await this.poblarDatos(multa);
  }

  /**
   * Obtener multas de un socio específico
   */
  async obtenerMultasPorSocio(idSocio) {
    // Verificar que el socio existe
    await socioService.obtenerSocioPorId(idSocio);

    return this.obtenerMultas({ idSocio });
  }

  /**
   * Registrar pago de una multa
   */
  async registrarPago(id) {
    const multa = await this.obtenerMultaPorId(id);

    // Verificar que la multa esté pendiente
    if (multa.estadoMulta !== "PENDIENTE") {
      throw new AppError("La multa ya fue pagada o cancelada", 400);
    }

    // Actualizar la multa
    await this.collection.doc(id).update({
      estadoMulta: "PAGADA",
      fechaPago: new Date(),
      fechaActualizacion: new Date()
    });

    return this.obtenerMultaPorId(id);
  }

  /**
   * Cancelar una multa
   */
  async cancelarMulta(id, motivo = "") {
    const multa = await this.obtenerMultaPorId(id);

    // Verificar que la multa esté pendiente
    if (multa.estadoMulta !== "PENDIENTE") {
      throw new AppError("Solo se pueden cancelar multas pendientes", 400);
    }

    // Actualizar la multa
    const descripcionActualizada = multa.descripcion + 
      (motivo ? ` | CANCELADA - Motivo: ${motivo}` : " | CANCELADA");

    await this.collection.doc(id).update({
      estadoMulta: "CANCELADA",
      descripcion: descripcionActualizada,
      fechaActualizacion: new Date()
    });

    return this.obtenerMultaPorId(id);
  }

  /**
   * Obtener total adeudado por un socio
   */
  async obtenerTotalAdeudado(idSocio) {
    // Verificar que el socio existe
    await socioService.obtenerSocioPorId(idSocio);

    const multasPendientes = await this.obtenerMultas({ 
      idSocio, 
      estadoMulta: "PENDIENTE" 
    });

    const totalAdeudado = multasPendientes.reduce((total, multa) => {
      return total + (multa.monto || 0);
    }, 0);

    return {
      idSocio,
      totalMultasPendientes: multasPendientes.length,
      totalAdeudado: totalAdeudado,
      multas: multasPendientes
    };
  }

  /**
   * Obtener estadísticas generales de multas
   */
  async obtenerEstadisticas() {
    const todasLasMultas = await this.collection.get();

    const estadisticas = {
      total: 0,
      multasPendientes: 0,
      multasPagadas: 0,
      multasCanceladas: 0,
      montoPendiente: 0,
      montoRecaudado: 0
    };

    todasLasMultas.forEach(doc => {
      const multa = doc.data();
      estadisticas.total++;
      
      const monto = parseFloat(multa.monto) || 0;
      
      switch (multa.estadoMulta) {
        case "PENDIENTE":
          estadisticas.multasPendientes++;
          estadisticas.montoPendiente += monto;
          break;
        case "PAGADA":
          estadisticas.multasPagadas++;
          estadisticas.montoRecaudado += monto;
          break;
        case "CANCELADA":
          estadisticas.multasCanceladas++;
          break;
      }
    });

    // Redondear a 2 decimales
    estadisticas.montoPendiente = Math.round(estadisticas.montoPendiente * 100) / 100;
    estadisticas.montoRecaudado = Math.round(estadisticas.montoRecaudado * 100) / 100;

    return estadisticas;
  }
}

module.exports = new MultaService();