const { db } = require("../config/firebase");
const { validateSocio } = require("../utils/validators");
const { generarNumeroSocio } = require("../utils/helpers");
const { AppError } = require("../middlewares/errorHandler");

class SocioService {
  constructor() {
    this.collection = db.collection("socios");
    this.prestamosCollection = db.collection("prestamos");
    this.multasCollection = db.collection("multas");
  }

  /**
   * Registrar un nuevo socio
   */
  async registrarSocio(data) {
    // Validar datos
    const validation = validateSocio(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Verificar si ya existe un socio con el mismo DNI
    const socioExistente = await this.buscarPorDNI(data.dni);
    if (socioExistente) {
      throw new AppError("Ya existe un socio registrado con ese DNI", 400);
    }

    // Generar número de socio único
    let numeroSocio;
    let existeNumero = true;
    
    while (existeNumero) {
      numeroSocio = generarNumeroSocio();
      const snapshot = await this.collection
        .where("numeroSocio", "==", numeroSocio)
        .limit(1)
        .get();
      existeNumero = !snapshot.empty;
    }

    // Crear objeto del socio
    const socio = {
      nombre: data.nombre.trim(),
      dni: data.dni.trim(),
      numeroSocio: numeroSocio,
      email: data.email?.trim() || null,
      telefono: data.telefono?.trim() || null,
      direccion: data.direccion?.trim() || null,
      fechaNacimiento: data.fechaNacimiento || null, // AGREGADO
      activo: true,
      fechaInscripcion: new Date(), // CAMBIADO de fechaRegistro
      fechaActualizacion: new Date()
    };

    // Guardar en Firestore
    const docRef = await this.collection.add(socio);
    
    return {
      id: docRef.id,
      ...socio
    };
  }

  /**
   * Obtener todos los socios con filtros opcionales
   */
  async obtenerSocios(filtros = {}) {
    let query = this.collection;

    // Aplicar filtro de activo
    if (filtros.activo !== undefined) {
      query = query.where("activo", "==", filtros.activo);
    }

    const snapshot = await query.get();
    
    const socios = [];
    snapshot.forEach(doc => {
      socios.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return socios;
  }

  /**
   * Obtener un socio por ID
   */
  async obtenerSocioPorId(id) {
    const doc = await this.collection.doc(id).get();
    
    if (!doc.exists) {
      throw new AppError("Socio no encontrado", 404);
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Buscar socio por DNI
   */
  async buscarPorDNI(dni) {
    const snapshot = await this.collection
      .where("dni", "==", dni.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Buscar socio por número de socio
   */
  async buscarPorNumeroSocio(numeroSocio) {
    const snapshot = await this.collection
      .where("numeroSocio", "==", numeroSocio.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Actualizar un socio
   */
  async actualizarSocio(id, data) {
    // Verificar que el socio existe
    await this.obtenerSocioPorId(id);

    // Validar datos
    const validation = validateSocio(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Si se actualiza el DNI, verificar que no esté duplicado
    if (data.dni) {
      const socioExistente = await this.buscarPorDNI(data.dni);
      if (socioExistente && socioExistente.id !== id) {
        throw new AppError("Ya existe un socio con ese DNI", 400);
      }
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      ...(data.nombre && { nombre: data.nombre.trim() }),
      ...(data.dni && { dni: data.dni.trim() }),
      ...(data.email !== undefined && { email: data.email?.trim() || null }),
      ...(data.telefono !== undefined && { telefono: data.telefono?.trim() || null }),
      ...(data.direccion !== undefined && { direccion: data.direccion?.trim() || null }),
      ...(data.fechaNacimiento !== undefined && { fechaNacimiento: data.fechaNacimiento || null }), // AGREGADO
      fechaActualizacion: new Date()
    };

    // Actualizar en Firestore
    await this.collection.doc(id).update(datosActualizacion);

    return this.obtenerSocioPorId(id);
  }

  /**
   * Desactivar un socio
   */
  async desactivarSocio(id) {
    // Verificar que el socio existe
    await this.obtenerSocioPorId(id);

    // Verificar que no tenga préstamos activos
    const prestamosActivos = await this.prestamosCollection
      .where("idSocio", "==", id)
      .where("estadoPrestamo", "==", "ACTIVO")
      .get();

    if (!prestamosActivos.empty) {
      throw new AppError("No se puede desactivar un socio con préstamos activos", 400);
    }

    // Verificar que no tenga multas pendientes
    const multasPendientes = await this.multasCollection
      .where("idSocio", "==", id)
      .where("estadoMulta", "==", "PENDIENTE")
      .get();

    if (!multasPendientes.empty) {
      throw new AppError("No se puede desactivar un socio con multas pendientes", 400);
    }

    // Desactivar socio
    await this.collection.doc(id).update({
      activo: false,
      fechaActualizacion: new Date()
    });

    return this.obtenerSocioPorId(id);
  }

  /**
   * Eliminar un socio (solo si no tiene historial)
   */
  async eliminarSocio(id) {
    // Verificar que el socio existe
    await this.obtenerSocioPorId(id);

    // Verificar que no tenga préstamos
    const prestamos = await this.prestamosCollection
      .where("idSocio", "==", id)
      .limit(1)
      .get();

    if (!prestamos.empty) {
      throw new AppError("No se puede eliminar un socio con historial de préstamos", 400);
    }

    // Verificar que no tenga multas
    const multas = await this.multasCollection
      .where("idSocio", "==", id)
      .limit(1)
      .get();

    if (!multas.empty) {
      throw new AppError("No se puede eliminar un socio con historial de multas", 400);
    }

    // Eliminar de Firestore
    await this.collection.doc(id).delete();

    return {
      message: "Socio eliminado exitosamente"
    };
  }

  /**
   * Obtener préstamos de un socio
   */
  async obtenerPrestamosSocio(idSocio) {
    // Verificar que el socio existe
    await this.obtenerSocioPorId(idSocio);

    const snapshot = await this.prestamosCollection
      .where("idSocio", "==", idSocio)
      .get();

    const prestamos = [];
    snapshot.forEach(doc => {
      prestamos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return prestamos;
  }

  /**
   * Obtener multas de un socio
   */
  async obtenerMultasSocio(idSocio) {
    // Verificar que el socio existe
    await this.obtenerSocioPorId(idSocio);

    const snapshot = await this.multasCollection
      .where("idSocio", "==", idSocio)
      .get();

    const multas = [];
    snapshot.forEach(doc => {
      multas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return multas;
  }
}

module.exports = new SocioService();