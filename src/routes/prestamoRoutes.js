const express = require("express");
const router = express.Router();
const prestamoController = require("../controllers/prestamoController");

/**
 * @route   POST /api/prestamos
 * @desc    Registrar un nuevo préstamo
 * @access  Public (debería ser protegida en producción)
 */
router.post("/", prestamoController.registrarPrestamo);

/**
 * @route   GET /api/prestamos
 * @desc    Obtener todos los préstamos (con filtros opcionales: estadoPrestamo, idSocio, idLibro)
 * @access  Public
 */
router.get("/", prestamoController.obtenerPrestamos);

/**
 * @route   GET /api/prestamos/activos
 * @desc    Obtener préstamos activos
 * @access  Public
 */
router.get("/activos", prestamoController.obtenerPrestamosActivos);

/**
 * @route   GET /api/prestamos/vencidos
 * @desc    Obtener préstamos vencidos
 * @access  Public
 */
router.get("/vencidos", prestamoController.obtenerPrestamosVencidos);

/**
 * @route   GET /api/prestamos/:id
 * @desc    Obtener un préstamo por ID
 * @access  Public
 */
router.get("/:id", prestamoController.obtenerPrestamoPorId);

/**
 * @route   PUT /api/prestamos/:id/devolver
 * @desc    Registrar devolución de un libro
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id/devolver", prestamoController.registrarDevolucion);

/**
 * @route   PUT /api/prestamos/:id/renovar
 * @desc    Renovar un préstamo
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id/renovar", prestamoController.renovarPrestamo);

module.exports = router;