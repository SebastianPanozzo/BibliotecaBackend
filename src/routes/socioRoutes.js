const express = require("express");
const router = express.Router();
const socioController = require("../controllers/socioController");

/**
 * @route   POST /api/socios
 * @desc    Registrar un nuevo socio
 * @access  Public (debería ser protegida en producción)
 */
router.post("/", socioController.registrarSocio);

/**
 * @route   GET /api/socios
 * @desc    Obtener todos los socios (con filtro opcional: activo)
 * @access  Public
 */
router.get("/", socioController.obtenerSocios);

/**
 * @route   GET /api/socios/dni/:dni
 * @desc    Buscar socio por DNI
 * @access  Public
 */
router.get("/dni/:dni", socioController.buscarPorDNI);

/**
 * @route   GET /api/socios/numero/:numeroSocio
 * @desc    Buscar socio por número de socio
 * @access  Public
 */
router.get("/numero/:numeroSocio", socioController.buscarPorNumeroSocio);

/**
 * @route   GET /api/socios/:id
 * @desc    Obtener un socio por ID
 * @access  Public
 */
router.get("/:id", socioController.obtenerSocioPorId);

/**
 * @route   GET /api/socios/:id/prestamos
 * @desc    Obtener préstamos de un socio
 * @access  Public
 */
router.get("/:id/prestamos", socioController.obtenerPrestamosSocio);

/**
 * @route   GET /api/socios/:id/multas
 * @desc    Obtener multas de un socio
 * @access  Public
 */
router.get("/:id/multas", socioController.obtenerMultasSocio);

/**
 * @route   PUT /api/socios/:id
 * @desc    Actualizar un socio
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id", socioController.actualizarSocio);

/**
 * @route   PUT /api/socios/:id/desactivar
 * @desc    Desactivar un socio
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id/desactivar", socioController.desactivarSocio);

/**
 * @route   DELETE /api/socios/:id
 * @desc    Eliminar un socio
 * @access  Public (debería ser protegida en producción)
 */
router.delete("/:id", socioController.eliminarSocio);

module.exports = router;