const express = require("express");
const router = express.Router();
const libroController = require("../controllers/libroController");

/**
 * @route   POST /api/libros
 * @desc    Crear un nuevo libro
 * @access  Public (debería ser protegida en producción)
 */
router.post("/", libroController.crearLibro);

/**
 * @route   GET /api/libros
 * @desc    Obtener todos los libros (con filtros opcionales: estado, autor)
 * @access  Public
 */
router.get("/", libroController.obtenerLibros);

/**
 * @route   GET /api/libros/disponibles
 * @desc    Obtener libros disponibles
 * @access  Public
 */
router.get("/disponibles", libroController.obtenerLibrosDisponibles);

/**
 * @route   GET /api/libros/isbn/:isbn
 * @desc    Buscar libro por ISBN
 * @access  Public
 */
router.get("/isbn/:isbn", libroController.buscarPorISBN);

/**
 * @route   GET /api/libros/:id
 * @desc    Obtener un libro por ID
 * @access  Public
 */
router.get("/:id", libroController.obtenerLibroPorId);

/**
 * @route   GET /api/libros/:id/disponible
 * @desc    Verificar disponibilidad de un libro
 * @access  Public
 */
router.get("/:id/disponible", libroController.verificarDisponibilidad);

/**
 * @route   PUT /api/libros/:id
 * @desc    Actualizar un libro
 * @access  Public (debería ser protegida en producción)
 */
router.put("/:id", libroController.actualizarLibro);

/**
 * @route   DELETE /api/libros/:id
 * @desc    Eliminar un libro
 * @access  Public (debería ser protegida en producción)
 */
router.delete("/:id", libroController.eliminarLibro);

module.exports = router;