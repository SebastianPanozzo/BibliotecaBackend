const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");

/**
 * Middleware para verificar token JWT
 * (Preparado para implementación futura)
 */
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError("Token no proporcionado", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token inválido", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expirado", 401));
    }
    next(error);
  }
};

/**
 * Middleware para verificar roles
 * (Preparado para implementación futura)
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new AppError("Usuario no autenticado", 401));
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError("No tienes permisos para esta acción", 403));
    }

    next();
  };
};

/**
 * Generar token JWT
 * (Preparado para implementación futura)
 */
const generarToken = (payload, expiresIn = "24h") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = {
  verificarToken,
  verificarRol,
  generarToken
};