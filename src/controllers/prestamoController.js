const prestamoService = require("../services/prestamoService");

class PrestamoController {
  /**
   * Registrar un nuevo préstamo
   * POST /api/prestamos
   */
  async registrarPrestamo(req, res, next) {
    try {
      const prestamo = await prestamoService.registrarPrestamo(req.body);
      
      res.status(201).json({
        success: true,
        message: "Préstamo registrado exitosamente",
        data: prestamo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los préstamos
   * GET /api/prestamos
   */
  async obtenerPrestamos(req, res, next) {
    try {
      const filtros = {
        estadoPrestamo: req.query.estadoPrestamo,
        idSocio: req.query.idSocio,
        idLibro: req.query.idLibro
      };

      const prestamos = await prestamoService.obtenerPrestamos(filtros);
      
      res.status(200).json({
        success: true,
        count: prestamos.length,
        data: prestamos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un préstamo por ID
   * GET /api/prestamos/:id
   */
  async obtenerPrestamoPorId(req, res, next) {
    try {
      const prestamo = await prestamoService.obtenerPrestamoPorId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: prestamo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar devolución de un libro
   * PUT /api/prestamos/:id/devolver
   */
  async registrarDevolucion(req, res, next) {
    try {
      const estadoLibro = req.body.estadoLibro || "BUENO";
      const resultado = await prestamoService.registrarDevolucion(req.params.id, estadoLibro);
      
      res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.prestamo,
        multas: resultado.multas || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener préstamos activos
   * GET /api/prestamos/activos
   */
  async obtenerPrestamosActivos(req, res, next) {
    try {
      const prestamos = await prestamoService.obtenerPrestamosActivos();
      
      res.status(200).json({
        success: true,
        count: prestamos.length,
        data: prestamos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener préstamos vencidos
   * GET /api/prestamos/vencidos
   */
  async obtenerPrestamosVencidos(req, res, next) {
    try {
      const prestamos = await prestamoService.obtenerPrestamosVencidos();
      
      res.status(200).json({
        success: true,
        count: prestamos.length,
        data: prestamos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renovar préstamo
   * PUT /api/prestamos/:id/renovar
   */
  async renovarPrestamo(req, res, next) {
    try {
      const diasExtension = req.body.diasExtension || 7;
      const prestamo = await prestamoService.renovarPrestamo(req.params.id, diasExtension);
      
      res.status(200).json({
        success: true,
        message: "Préstamo renovado exitosamente",
        data: prestamo
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PrestamoController();