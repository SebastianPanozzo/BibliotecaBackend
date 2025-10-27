const { db } = require("../config/firebase");
const { validateLibro } = require("../utils/validators");
const { generarNumeroAcceso } = require("../utils/helpers");
const { AppError } = require("../middlewares/errorHandler");

class LibroService {
  constructor() {
    this.collection = db.collection("libros");
  }

  /**
   * Convierte timestamps de Firestore a strings ISO
   */
  convertirFechas(libro) {
    const libroConvertido = { ...libro };
    
    if (libroConvertido.fechaCreacion && libroConvertido.fechaCreacion.toDate) {
      libroConvertido.fechaCreacion = libroConvertido.fechaCreacion.toDate().toISOString();
    }
    
    if (libroConvertido.fechaActualizacion && libroConvertido.fechaActualizacion.toDate) {
      libroConvertido.fechaActualizacion = libroConvertido.fechaActualizacion.toDate().toISOString();
    }
    
    return libroConvertido;
  }

  /**
   * Crear un nuevo libro
   */
  async crearLibro(data) {
    // Validar datos
    const validation = validateLibro(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Verificar si ya existe un libro con el mismo ISBN
    const libroExistente = await this.buscarPorISBN(data.isbn);
    if (libroExistente) {
      throw new AppError("Ya existe un libro con ese ISBN", 400);
    }

    // Generar número de acceso único
    let numeroAcceso;
    let existeNumero = true;
    
    while (existeNumero) {
      numeroAcceso = generarNumeroAcceso();
      const snapshot = await this.collection
        .where("numeroAcceso", "==", numeroAcceso)
        .limit(1)
        .get();
      existeNumero = !snapshot.empty;
    }

    // Crear objeto del libro con todos los campos
    const libro = {
      titulo: data.titulo.trim(),
      autor: data.autor.trim(),
      isbn: data.isbn.trim(),
      numeroAcceso: numeroAcceso,
      estado: "DISPONIBLE",
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Agregar campos opcionales si existen
    if (data.editorial && data.editorial.trim()) {
      libro.editorial = data.editorial.trim();
    }

    if (data.genero && data.genero.trim()) {
      libro.genero = data.genero.trim();
    }

    if (data.anioPublicacion) {
      libro.anioPublicacion = parseInt(data.anioPublicacion);
    }

    if (data.numeroPaginas) {
      libro.numeroPaginas = parseInt(data.numeroPaginas);
    }

    if (data.descripcion && data.descripcion.trim()) {
      libro.descripcion = data.descripcion.trim();
    }

    // Guardar en Firestore
    const docRef = await this.collection.add(libro);
    
    // Obtener el libro recién creado y convertir fechas
    const libroCreado = {
      id: docRef.id,
      ...libro
    };

    return this.convertirFechas(libroCreado);
  }

  /**
   * Obtener todos los libros con filtros opcionales
   */
  async obtenerLibros(filtros = {}) {
    let query = this.collection;

    // Aplicar filtros
    if (filtros.estado) {
      query = query.where("estado", "==", filtros.estado);
    }

    if (filtros.autor) {
      query = query.where("autor", "==", filtros.autor);
    }

    const snapshot = await query.get();
    
    const libros = [];
    snapshot.forEach(doc => {
      const libro = {
        id: doc.id,
        ...doc.data()
      };
      libros.push(this.convertirFechas(libro));
    });

    return libros;
  }

  /**
   * Obtener un libro por ID
   */
  async obtenerLibroPorId(id) {
    const doc = await this.collection.doc(id).get();
    
    if (!doc.exists) {
      throw new AppError("Libro no encontrado", 404);
    }

    const libro = {
      id: doc.id,
      ...doc.data()
    };

    return this.convertirFechas(libro);
  }

  /**
   * Buscar libro por ISBN
   */
  async buscarPorISBN(isbn) {
    const snapshot = await this.collection
      .where("isbn", "==", isbn.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const libro = {
      id: doc.id,
      ...doc.data()
    };

    return this.convertirFechas(libro);
  }

  /**
   * Actualizar un libro
   */
  async actualizarLibro(id, data) {
    // Verificar que el libro existe
    await this.obtenerLibroPorId(id);

    // Validar datos
    const validation = validateLibro(data);
    if (!validation.isValid) {
      throw new AppError("Error de validación", 400, validation.errors);
    }

    // Si se actualiza el ISBN, verificar que no esté duplicado
    if (data.isbn) {
      const libroExistente = await this.buscarPorISBN(data.isbn);
      if (libroExistente && libroExistente.id !== id) {
        throw new AppError("Ya existe un libro con ese ISBN", 400);
      }
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      fechaActualizacion: new Date()
    };

    // Agregar campos obligatorios si existen
    if (data.titulo) {
      datosActualizacion.titulo = data.titulo.trim();
    }

    if (data.autor) {
      datosActualizacion.autor = data.autor.trim();
    }

    if (data.isbn) {
      datosActualizacion.isbn = data.isbn.trim();
    }

    if (data.estado) {
      datosActualizacion.estado = data.estado;
    }

    // Agregar campos opcionales si existen
    if (data.editorial !== undefined) {
      datosActualizacion.editorial = data.editorial ? data.editorial.trim() : null;
    }

    if (data.genero !== undefined) {
      datosActualizacion.genero = data.genero ? data.genero.trim() : null;
    }

    if (data.anioPublicacion !== undefined) {
      datosActualizacion.anioPublicacion = data.anioPublicacion ? parseInt(data.anioPublicacion) : null;
    }

    if (data.numeroPaginas !== undefined) {
      datosActualizacion.numeroPaginas = data.numeroPaginas ? parseInt(data.numeroPaginas) : null;
    }

    if (data.descripcion !== undefined) {
      datosActualizacion.descripcion = data.descripcion ? data.descripcion.trim() : null;
    }

    // Actualizar en Firestore
    await this.collection.doc(id).update(datosActualizacion);

    return this.obtenerLibroPorId(id);
  }

  /**
   * Eliminar un libro
   */
  async eliminarLibro(id) {
    const libro = await this.obtenerLibroPorId(id);

    // Verificar si el libro está prestado
    if (libro.estado === "PRESTADO") {
      throw new AppError("No se puede eliminar un libro que está prestado", 400);
    }

    // Eliminar de Firestore
    await this.collection.doc(id).delete();

    return {
      message: "Libro eliminado exitosamente"
    };
  }

  /**
   * Obtener libros disponibles
   */
  async obtenerLibrosDisponibles() {
    return this.obtenerLibros({ estado: "DISPONIBLE" });
  }

  /**
   * Verificar si un libro está disponible
   */
  async estaDisponible(id) {
    const libro = await this.obtenerLibroPorId(id);
    return libro.estado === "DISPONIBLE";
  }

  /**
   * Cambiar estado del libro
   */
  async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ["DISPONIBLE", "PRESTADO"];
    
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new AppError("Estado inválido", 400);
    }

    await this.collection.doc(id).update({
      estado: nuevoEstado,
      fechaActualizacion: new Date()
    });

    return this.obtenerLibroPorId(id);
  }
}

module.exports = new LibroService();