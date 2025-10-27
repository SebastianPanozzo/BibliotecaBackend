// Validadores para el sistema de biblioteca

const validateLibro = (data) => {
  const errors = [];

  if (!data.titulo || data.titulo.trim() === "") {
    errors.push("El título es obligatorio");
  }

  if (!data.autor || data.autor.trim() === "") {
    errors.push("El autor es obligatorio");
  }

  if (!data.isbn || data.isbn.trim() === "") {
    errors.push("El ISBN es obligatorio");
  }

  // Validar formato ISBN (básico)
  const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
  if (data.isbn && !isbnRegex.test(data.isbn.replace(/[- ]/g, ""))) {
    errors.push("Formato de ISBN inválido");
  }

  const estadosValidos = ["DISPONIBLE", "PRESTADO"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push("Estado inválido. Debe ser DISPONIBLE o PRESTADO");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateSocio = (data) => {
  const errors = [];

  if (!data.nombre || data.nombre.trim() === "") {
    errors.push("El nombre es obligatorio");
  }

  if (!data.dni || data.dni.trim() === "") {
    errors.push("El DNI/documento es obligatorio");
  }

  // Validar formato de DNI (solo números)
  if (data.dni && !/^\d+$/.test(data.dni)) {
    errors.push("El DNI debe contener solo números");
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Formato de email inválido");
  }

  if (data.telefono && !/^[\d\s\-\+\(\)]+$/.test(data.telefono)) {
    errors.push("Formato de teléfono inválido");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePrestamo = (data) => {
  const errors = [];

  if (!data.idLibro) {
    errors.push("El ID del libro es obligatorio");
  }

  if (!data.idSocio) {
    errors.push("El ID del socio es obligatorio");
  }

  if (!data.fechaDevolucion) {
    errors.push("La fecha de devolución es obligatoria");
  }

  // Validar que la fecha de devolución sea futura
  if (data.fechaDevolucion) {
    const fechaDevolucion = new Date(data.fechaDevolucion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaDevolucion < hoy) {
      errors.push("La fecha de devolución debe ser futura");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateMulta = (data) => {
  const errors = [];

  if (!data.idPrestamo) {
    errors.push("El ID del préstamo es obligatorio");
  }

  if (!data.idSocio) {
    errors.push("El ID del socio es obligatorio");
  }

  if (!data.monto || data.monto <= 0) {
    errors.push("El monto debe ser mayor a 0");
  }

  if (!data.descripcion || data.descripcion.trim() === "") {
    errors.push("La descripción es obligatoria");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateLibro,
  validateSocio,
  validatePrestamo,
  validateMulta
};