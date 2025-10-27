// Funciones auxiliares para el sistema de biblioteca

/**
 * Genera un número de socio único
 * Formato: SOC-YYYYMMDD-XXXXX (donde X son números aleatorios)
 */
const generarNumeroSocio = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  
  return `SOC-${year}${month}${day}-${random}`;
};

/**
 * Calcula la fecha de devolución (días desde hoy)
 * @param {number} dias - Número de días para la devolución (por defecto 14)
 */
const calcularFechaDevolucion = (dias = 14) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
};

/**
 * Calcula el monto de multa por retraso
 * @param {Date} fechaDevolucionOriginal - Fecha en que debía devolverse
 * @param {number} multaPorDia - Monto de multa por día (por defecto 50)
 */
const calcularMontoRetraso = (fechaDevolucionOriginal, multaPorDia = 50) => {
  const fechaDevolucion = new Date(fechaDevolucionOriginal);
  const hoy = new Date();
  
  // Si no hay retraso, retorna 0
  if (hoy <= fechaDevolucion) {
    return 0;
  }
  
  // Calcular días de retraso
  const diferenciaTiempo = hoy.getTime() - fechaDevolucion.getTime();
  const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
  
  return diasRetraso * multaPorDia;
};

/**
 * Formatea una fecha a string legible
 * @param {Date} fecha - Fecha a formatear
 */
const formatearFecha = (fecha) => {
  if (!fecha) return null;
  
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const anio = f.getFullYear();
  
  return `${dia}/${mes}/${anio}`;
};

/**
 * Verifica si una fecha está vencida
 * @param {Date} fecha - Fecha a verificar
 */
const esFechaVencida = (fecha) => {
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return f < hoy;
};

/**
 * Normaliza un string (quita espacios extras, convierte a mayúsculas)
 * @param {string} str - String a normalizar
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str.trim().toUpperCase();
};

/**
 * Genera un número de acceso único para el libro
 * Formato: LIB-XXXXX
 */
const generarNumeroAcceso = () => {
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `LIB-${random}`;
};

module.exports = {
  generarNumeroSocio,
  calcularFechaDevolucion,
  calcularMontoRetraso,
  formatearFecha,
  esFechaVencida,
  normalizeString,
  generarNumeroAcceso
};