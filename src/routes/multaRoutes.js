const express = require("express");
const router = express.Router();
const multaController = require("../controllers/multaController");

/**
 * @route   POST /api/multas
 * @desc    Registrar una nueva multa
 * @access  Public (debería ser protegida en producción)
 */
router.post("/", multaController.registrarMulta);

/**
 * @route   GET /api/multas
 * @desc    Obtener todas las multas (con filtros opcionales: estadoMulta, idSocio)
 * @access  Public
 */
router.get("/", multaController.obtenerMultas);

/**
 * @route   GET /api/multas/estadisticas
 * @desc    Obtener estadísticas de multas
 * @access  Public
 */
router.get("/estadisticas", multaController.obtenerEstadisticas);

/**
 * @route   GET /api/multas/socio/:idSocio
 * @desc    Obtener multas de un socio
 * @access  Public
 */
router.get("/socio/:idSocio", multaController.obtenerMultasPorSocio);

/**
 * @route   GET /api/multas/socio/:idSocio/total
 * @desc    Obtener total adeudado por un socio
 * @access  Public
 */
router.get("/socio/:idSocio/total", multaController.obtenerTotalAdeudado);

/**
 * @route   GET /api/multas/:id
 * @desc    Obtener una multa por ID
 * @access  Public
 */
router.get("/:id", multaController.obtenerMultaPorId);

/**
 * @route   PUT /api/multas/:id/pagar
 * @desc    Registrar pago de multa
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id/pagar", multaController.registrarPago);

/**
 * @route   PUT /api/multas/:id/cancelar
 * @desc    Cancelar una multa
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id/cancelar", multaController.cancelarMulta);

module.exports = router;