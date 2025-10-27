const { db } = require("../config/firebase");
const { validatePrestamo } = require("../utils/validators");
const { calcularFechaDevolucion, calcularMontoRetraso, esFechaVencida } = require("../utils/helpers");
const { AppError } = require("../middlewares/errorHandler");
const libroService = require("./libroService");
const socioService = require("./socioService");
const multaService = require("./multaService");

class PrestamoService {
  constructor() {
    this.collection = db.collection("prestamos");
  }

  /**
   * Convierte Timestamp de Firestore a Date
   */
  convertirTimestamp(data) {
    const converted = { ...data };
    const camposFecha = ['fechaPrestamo', 'fechaDevolucion', 'fechaDevolucionReal', 'fechaCreacion', 'fechaActualizacion'];
    
    camposFecha.forEach(campo => {
      if (converted[campo] && converted[campo].toDate) {
        converted[campo] = converted[campo].toDate();
      }
    });
    
    return converted;
  }

  /**
   * Poblar datos de libro y socio
   */
  async poblarDatos(prestamo) {
    try {
      const [libro, socio] = await Promise.all([
        libroService.obtenerLibroPorId(prestamo.idLibro).catch(() => null),
        socioService.obtenerSocioPorId(prestamo.idSocio).catch(() => null)
      ]);

      return {
        ...prestamo,
        libro: libro || { titulo: 'Libro no encontrado', autor: '-', isbn: '-' },
        socio: socio || { nombre: 'Socio no encontrado', numeroSocio: '-', dni: '-' }
      };
    } catch (error) {
      console.error('Error al poblar datos:', error);
      return prestamo;
    }
  }

  /**
   * Registrar un nuevo préstamo
   */
  async registrarPrestamo(data) {
    // Validar datos
    const validation = validatePrestamo(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Verificar que el libro existe y está disponible
    const libro = await libroService.obtenerLibroPorId(data.idLibro);
    if (libro.estado !== "DISPONIBLE") {
      throw new AppError("El libro no está disponible para préstamo", 400);
    }

    // Verificar que el socio existe y está activo
    const socio = await socioService.obtenerSocioPorId(data.idSocio);
    if (!socio.activo) {
      throw new AppError("El socio no está activo", 400);
    }

    // Verificar que el socio no tenga multas pendientes
    const multasPendientes = await db.collection("multas")
      .where("idSocio", "==", data.idSocio)
      .where("estadoMulta", "==", "PENDIENTE")
      .get();

    if (!multasPendientes.empty) {
      throw new AppError("El socio tiene multas pendientes. Debe pagarlas antes de realizar un nuevo préstamo", 400);
    }

    // Crear objeto del préstamo
    const fechaDevolucion = data.fechaDevolucion 
      ? new Date(data.fechaDevolucion) 
      : calcularFechaDevolucion(14);

    const prestamo = {
      idLibro: data.idLibro,
      idSocio: data.idSocio,
      fechaPrestamo: new Date(),
      fechaDevolucion: fechaDevolucion,
      fechaDevolucionReal: null,
      estadoPrestamo: "ACTIVO",
      observaciones: data.observaciones?.trim() || null,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Guardar en Firestore
    const docRef = await this.collection.add(prestamo);

    // Actualizar estado del libro a PRESTADO
    await libroService.cambiarEstado(data.idLibro, "PRESTADO");
    
    const prestamoCreado = {
      id: docRef.id,
      ...prestamo
    };

    // Poblar con datos de libro y socio
    return await this.poblarDatos(prestamoCreado);
  }

  /**
   * Obtener todos los préstamos con filtros opcionales
   */
  async obtenerPrestamos(filtros = {}) {
    let query = this.collection;

    // Aplicar filtros
    if (filtros.estadoPrestamo) {
      query = query.where("estadoPrestamo", "==", filtros.estadoPrestamo);
    }

    if (filtros.idSocio) {
      query = query.where("idSocio", "==", filtros.idSocio);
    }

    if (filtros.idLibro) {
      query = query.where("idLibro", "==", filtros.idLibro);
    }

    const snapshot = await query.get();
    
    const prestamos = [];
    for (const doc of snapshot.docs) {
      const prestamoData = this.convertirTimestamp(doc.data());
      const prestamoConDatos = await this.poblarDatos({
        id: doc.id,
        ...prestamoData
      });
      prestamos.push(prestamoConDatos);
    }

    return prestamos;
  }

  /**
   * Obtener un préstamo por ID
   */
  async obtenerPrestamoPorId(id) {
    const doc = await this.collection.doc(id).get();
    
    if (!doc.exists) {
      throw new AppError("Préstamo no encontrado", 404);
    }

    const prestamoData = this.convertirTimestamp(doc.data());
    const prestamo = {
      id: doc.id,
      ...prestamoData
    };

    // Poblar con datos de libro y socio
    return await this.poblarDatos(prestamo);
  }

  /**
/**
   * Registrar devolución de un libro
   */
  async registrarDevolucion(id, estadoLibro = "BUENO") {
    try {
      const prestamo = await this.obtenerPrestamoPorId(id);

      // Verificar que el préstamo esté activo
      if (prestamo.estadoPrestamo !== "ACTIVO" && prestamo.estadoPrestamo !== "VENCIDO") {
        throw new AppError("El préstamo ya fue devuelto o cancelado", 400);
      }

      const fechaDevolucionReal = new Date();
      const fechaDevolucionOriginal = prestamo.fechaDevolucion instanceof Date 
        ? prestamo.fechaDevolucion 
        : new Date(prestamo.fechaDevolucion);

      // Actualizar el préstamo
      await this.collection.doc(id).update({
        fechaDevolucionReal: fechaDevolucionReal,
        estadoPrestamo: "DEVUELTO",
        fechaActualizacion: new Date()
      });

      // Actualizar estado del libro a DISPONIBLE
      await libroService.cambiarEstado(prestamo.idLibro, "DISPONIBLE");

      let multasGeneradas = [];

      // Verificar si hubo retraso
      if (esFechaVencida(fechaDevolucionOriginal)) {
        const montoRetraso = calcularMontoRetraso(fechaDevolucionOriginal);
        
        if (montoRetraso > 0) {
          const multaRetraso = await multaService.registrarMulta({
            idPrestamo: id,
            idSocio: prestamo.idSocio,
            monto: montoRetraso,
            tipoMulta: "RETRASO",
            descripcion: `Multa por devolución tardía del libro "${prestamo.libro?.titulo || 'sin título'}"`
          });

          multasGeneradas.push(multaRetraso);
        }
      }

      // Verificar estado del libro - NORMALIZAR a mayúsculas
      const estadoNormalizado = estadoLibro.toUpperCase();
      
      if (estadoNormalizado === "DAÑADO" || estadoNormalizado === "DANADO") {
        const multaDaño = await multaService.registrarMulta({
          idPrestamo: id,
          idSocio: prestamo.idSocio,
          monto: 200,
          tipoMulta: "DANO",
          descripcion: `Multa por devolución del libro "${prestamo.libro?.titulo || 'sin título'}" en mal estado`
        });

        multasGeneradas.push(multaDaño);
      }

      const prestamoActualizado = await this.obtenerPrestamoPorId(id);

      return {
        message: "Devolución registrada exitosamente",
        prestamo: prestamoActualizado,
        multas: multasGeneradas
      };
    } catch (error) {
      console.error('Error en registrarDevolucion:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos activos
   */
  async obtenerPrestamosActivos() {
    return this.obtenerPrestamos({ estadoPrestamo: "ACTIVO" });
  }

  /**
   * Obtener préstamos vencidos
   */
  async obtenerPrestamosVencidos() {
    const prestamosActivos = await this.obtenerPrestamosActivos();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const prestamosVencidos = [];

    for (const prestamo of prestamosActivos) {
      const fechaDevolucion = prestamo.fechaDevolucion instanceof Date 
        ? prestamo.fechaDevolucion 
        : new Date(prestamo.fechaDevolucion);
      
      if (fechaDevolucion < hoy) {
        // Actualizar estado a VENCIDO
        await this.collection.doc(prestamo.id).update({
          estadoPrestamo: "VENCIDO",
          fechaActualizacion: new Date()
        });
        
        prestamo.estadoPrestamo = "VENCIDO";
        prestamosVencidos.push(prestamo);
      }
    }

    return prestamosVencidos;
  }

  /**
   * Renovar un préstamo
   */
  async renovarPrestamo(id, diasExtension = 7) {
    const prestamo = await this.obtenerPrestamoPorId(id);

    // Verificar que el préstamo esté activo
    if (prestamo.estadoPrestamo !== "ACTIVO") {
      throw new AppError("Solo se pueden renovar préstamos activos", 400);
    }

    // Verificar que el socio no tenga multas pendientes
    const multasPendientes = await db.collection("multas")
      .where("idSocio", "==", prestamo.idSocio)
      .where("estadoMulta", "==", "PENDIENTE")
      .get();

    if (!multasPendientes.empty) {
      throw new AppError("No se puede renovar el préstamo. El socio tiene multas pendientes", 400);
    }

    // Calcular nueva fecha de devolución
    const fechaDevolucionActual = prestamo.fechaDevolucion instanceof Date 
      ? prestamo.fechaDevolucion 
      : new Date(prestamo.fechaDevolucion);
    
    const nuevaFechaDevolucion = new Date(fechaDevolucionActual);
    nuevaFechaDevolucion.setDate(nuevaFechaDevolucion.getDate() + diasExtension);

    // Actualizar el préstamo
    await this.collection.doc(id).update({
      fechaDevolucion: nuevaFechaDevolucion,
      fechaActualizacion: new Date()
    });

    return this.obtenerPrestamoPorId(id);
  }
}

module.exports = new PrestamoService();