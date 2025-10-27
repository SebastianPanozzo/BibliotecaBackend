const libroService = require("../services/libroService");

class LibroController {
  /**
   * Crear un nuevo libro
   * POST /api/libros
   */
  async crearLibro(req, res, next) {
    try {
      const libro = await libroService.crearLibro(req.body);
      
      res.status(201).json({
        success: true,
        message: "Libro creado exitosamente",
        data: libro
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los libros
   * GET /api/libros
   */
  async obtenerLibros(req, res, next) {
    try {
      const filtros = {
        estado: req.query.estado,
        autor: req.query.autor
      };

      const libros = await libroService.obtenerLibros(filtros);
      
      res.status(200).json({
        success: true,
        count: libros.length,
        data: libros
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un libro por ID
   * GET /api/libros/:id
   */
  async obtenerLibroPorId(req, res, next) {
    try {
      const libro = await libroService.obtenerLibroPorId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: libro
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar libro por ISBN
   * GET /api/libros/isbn/:isbn
   */
  async buscarPorISBN(req, res, next) {
    try {
      const libro = await libroService.buscarPorISBN(req.params.isbn);
      
      if (!libro) {
        return res.status(404).json({
          success: false,
          message: "No se encontró libro con ese ISBN"
        });
      }

      res.status(200).json({
        success: true,
        data: libro
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un libro
   * PUT /api/libros/:id
   */
  async actualizarLibro(req, res, next) {
    try {
      const libro = await libroService.actualizarLibro(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: "Libro actualizado exitosamente",
        data: libro
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar un libro
   * DELETE /api/libros/:id
   */
  async eliminarLibro(req, res, next) {
    try {
      const resultado = await libroService.eliminarLibro(req.params.id);
      
      res.status(200).json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener libros disponibles
   * GET /api/libros/disponibles
   */
  async obtenerLibrosDisponibles(req, res, next) {
    try {
      const libros = await libroService.obtenerLibrosDisponibles();
      
      res.status(200).json({
        success: true,
        count: libros.length,
        data: libros
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar disponibilidad de un libro
   * GET /api/libros/:id/disponible
   */
  async verificarDisponibilidad(req, res, next) {
    try {
      const disponible = await libroService.estaDisponible(req.params.id);
      const libro = await libroService.obtenerLibroPorId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: {
          idLibro: req.params.id,
          titulo: libro.titulo,
          disponible: disponible,
          estado: libro.estado
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LibroController();