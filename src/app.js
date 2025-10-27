const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorHandler");

// Importar rutas
const libroRoutes = require("./routes/libroRoutes");
const socioRoutes = require("./routes/socioRoutes");
const prestamoRoutes = require("./routes/prestamoRoutes");
const multaRoutes = require("./routes/multaRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "📚 API Sistema de Biblioteca",
    version: "1.0.0",
    endpoints: {
      libros: "/api/libros",
      socios: "/api/socios",
      prestamos: "/api/prestamos",
      multas: "/api/multas"
    }
  });
});

// Rutas
app.use("/api/libros", libroRoutes);
app.use("/api/socios", socioRoutes);
app.use("/api/prestamos", prestamoRoutes);
app.use("/api/multas", multaRoutes);

// Manejo de errores
app.use(errorHandler);

module.exports = app;