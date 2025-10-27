const socioService = require("../services/socioService");

class SocioController {
  /**
   * Registrar un nuevo socio
   * POST /api/socios
   */
  async registrarSocio(req, res, next) {
    try {
      const socio = await socioService.registrarSocio(req.body);
      
      res.status(201).json({
        success: true,
        message: "Socio registrado exitosamente",
        data: socio
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los socios
   * GET /api/socios
   */
  async obtenerSocios(req, res, next) {
    try {
      const filtros = {};
      
      if (req.query.activo !== undefined) {
        filtros.activo = req.query.activo === 'true';
      }

      const socios = await socioService.obtenerSocios(filtros);
      
      res.status(200).json({
        success: true,
        count: socios.length,
        data: socios
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un socio por ID
   * GET /api/socios/:id
   */
  async obtenerSocioPorId(req, res, next) {
    try {
      const socio = await socioService.obtenerSocioPorId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: socio
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar socio por DNI
   * GET /api/socios/dni/:dni
   */
  async buscarPorDNI(req, res, next) {
    try {
      const socio = await socioService.buscarPorDNI(req.params.dni);
      
      if (!socio) {
        return res.status(404).json({
          success: false,
          message: "No se encontró socio con ese DNI"
        });
      }

      res.status(200).json({
        success: true,
        data: socio
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar socio por número de socio
   * GET /api/socios/numero/:numeroSocio
   */
  async buscarPorNumeroSocio(req, res, next) {
    try {
      const socio = await socioService.buscarPorNumeroSocio(req.params.numeroSocio);
      
      if (!socio) {
        return res.status(404).json({
          success: false,
          message: "No se encontró socio con ese número"
        });
      }

      res.status(200).json({
        success: true,
        data: socio
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un socio
   * PUT /api/socios/:id
   */
  async actualizarSocio(req, res, next) {
    try {
      const socio = await socioService.actualizarSocio(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: "Socio actualizado exitosamente",
        data: socio
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar un socio
   * PUT /api/socios/:id/desactivar
   */
  async desactivarSocio(req, res, next) {
    try {
      const resultado = await socioService.desactivarSocio(req.params.id);
      
      res.status(200).json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar un socio
   * DELETE /api/socios/:id
   */
  async eliminarSocio(req, res, next) {
    try {
      const resultado = await socioService.eliminarSocio(req.params.id);
      
      res.status(200).json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener préstamos de un socio
   * GET /api/socios/:id/prestamos
   */
  async obtenerPrestamosSocio(req, res, next) {
    try {
      const prestamos = await socioService.obtenerPrestamosSocio(req.params.id);
      
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
   * Obtener multas de un socio
   * GET /api/socios/:id/multas
   */
  async obtenerMultasSocio(req, res, next) {
    try {
      const multas = await socioService.obtenerMultasSocio(req.params.id);
      
      res.status(200).json({
        success: true,
        count: multas.length,
        data: multas
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocioController();