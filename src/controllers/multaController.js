const multaService = require("../services/multaService");

class MultaController {
  /**
   * Registrar una nueva multa
   * POST /api/multas
   */
  async registrarMulta(req, res, next) {
    try {
      const multa = await multaService.registrarMulta(req.body);
      
      res.status(201).json({
        success: true,
        message: "Multa registrada exitosamente",
        data: multa
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todas las multas
   * GET /api/multas
   */
  async obtenerMultas(req, res, next) {
    try {
      const filtros = {
        estadoMulta: req.query.estadoMulta,
        idSocio: req.query.idSocio
      };

      const multas = await multaService.obtenerMultas(filtros);
      
      res.status(200).json({
        success: true,
        count: multas.length,
        data: multas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener una multa por ID
   * GET /api/multas/:id
   */
  async obtenerMultaPorId(req, res, next) {
    try {
      const multa = await multaService.obtenerMultaPorId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: multa
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener multas de un socio
   * GET /api/multas/socio/:idSocio
   */
  async obtenerMultasPorSocio(req, res, next) {
    try {
      const multas = await multaService.obtenerMultasPorSocio(req.params.idSocio);
      
      res.status(200).json({
        success: true,
        count: multas.length,
        data: multas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar pago de multa
   * PUT /api/multas/:id/pagar
   */
  async registrarPago(req, res, next) {
    try {
      const multa = await multaService.registrarPago(req.params.id);
      
      res.status(200).json({
        success: true,
        message: "Pago registrado exitosamente",
        data: multa
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar multa
   * PUT /api/multas/:id/cancelar
   */
  async cancelarMulta(req, res, next) {
    try {
      const motivo = req.body.motivo;
      const multa = await multaService.cancelarMulta(req.params.id, motivo);
      
      res.status(200).json({
        success: true,
        message: "Multa cancelada exitosamente",
        data: multa
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener total adeudado por un socio
   * GET /api/multas/socio/:idSocio/total
   */
  async obtenerTotalAdeudado(req, res, next) {
    try {
      const resultado = await multaService.obtenerTotalAdeudado(req.params.idSocio);
      
      res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de multas
   * GET /api/multas/estadisticas
   */
  async obtenerEstadisticas(req, res, next) {
    try {
      const estadisticas = await multaService.obtenerEstadisticas();
      
      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MultaController();