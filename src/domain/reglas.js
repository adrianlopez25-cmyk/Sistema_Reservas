// Reglas de negocio PURAS: no dependen de req, res, Express ni EJS.
// Reciben datos y devuelven resultados, por eso son fáciles de probar y modificar.

export const TURNOS = ['manana', 'tarde'];
export const TIPOS_EQUIPO = ['sobremesa', 'portatil'];
export const ESTADOS_EQUIPO = ['operativo', 'fuera_de_servicio'];

// ---------- Utilidades ----------

// Fecha de hoy en formato YYYY-MM-DD (hora local)
export function fechaHoy(ahora = new Date()) {
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Convierte un texto en id entero positivo; si no es válido devuelve null
export function parsearId(valor) {
  const texto = String(valor ?? '').trim();
  return /^[1-9]\d*$/.test(texto) ? Number(texto) : null;
}

// Comprueba formato YYYY-MM-DD y que la fecha exista (no vale 2027-02-31)
function esFechaReal(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const f = new Date(anio, mes - 1, dia);
  return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia;
}

// ---------- Disponibilidad ----------

// ¿Hay una reserva ACTIVA para ese equipo, fecha y turno? (las canceladas no cuentan)
export function estaReservado(equipoId, fecha, turno, reservas) {
  return reservas.some(
    (r) => r.equipoId === equipoId && r.fecha === fecha && r.turno === turno && r.estado === 'activa'
  );
}

// Equipos operativos y no reservados en esa fecha y turno
export function obtenerEquiposDisponibles(equipos, reservas, fecha, turno) {
  return equipos.filter(
    (e) => e.estado === 'operativo' && !estaReservado(e.id, fecha, turno, reservas)
  );
}

// ---------- Validaciones ----------
// Todas devuelven { valido, errores, valores }:
//   errores -> { campo: 'mensaje' }
//   valores -> datos ya limpiados y convertidos

export function validarFechaTurno(fecha, turno, hoy = fechaHoy()) {
  const errores = {};
  if (!esFechaReal(fecha)) {
    errores.fecha = 'La fecha no es válida (formato AAAA-MM-DD)';
  } else if (fecha < hoy) {
    errores.fecha = 'La fecha no puede ser anterior a hoy';
  }
  if (!TURNOS.includes(turno)) {
    errores.turno = 'El turno debe ser mañana o tarde';
  }
  return errores;
}

export function validarReserva(datos, hoy = fechaHoy()) {
  const equipoId = parsearId(datos?.equipoId);
  const fecha = String(datos?.fecha ?? '').trim();
  const turno = String(datos?.turno ?? '').trim();

  const errores = validarFechaTurno(fecha, turno, hoy);
  if (equipoId === null) {
    errores.equipoId = 'Selecciona un equipo válido';
  }
  return { valido: Object.keys(errores).length === 0, errores, valores: { equipoId, fecha, turno } };
}

export function validarRegistro(datos) {
  const nombre = String(datos?.nombre ?? '').trim();
  const email = String(datos?.email ?? '').trim().toLowerCase();
  const password = String(datos?.password ?? '');
  const errores = {};

  if (nombre.length < 2 || nombre.length > 50) errores.nombre = 'El nombre debe tener entre 2 y 50 caracteres';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) errores.email = 'El correo no es válido';
  if (password.length < 8 || password.length > 72) errores.password = 'La contraseña debe tener entre 8 y 72 caracteres';

  return { valido: Object.keys(errores).length === 0, errores, valores: { nombre, email, password } };
}

export function validarEquipo(datos) {
  const codigo = String(datos?.codigo ?? '').trim();
  const nombre = String(datos?.nombre ?? '').trim();
  const tipo = String(datos?.tipo ?? '').trim();
  const estado = String(datos?.estado ?? 'operativo').trim() || 'operativo';
  const errores = {};

  if (codigo.length < 2 || codigo.length > 20) errores.codigo = 'El código debe tener entre 2 y 20 caracteres';
  if (nombre.length < 2 || nombre.length > 60) errores.nombre = 'El nombre debe tener entre 2 y 60 caracteres';
  if (!TIPOS_EQUIPO.includes(tipo)) errores.tipo = 'El tipo debe ser portátil o sobremesa';
  if (!ESTADOS_EQUIPO.includes(estado)) errores.estado = 'El estado no es válido';

  return { valido: Object.keys(errores).length === 0, errores, valores: { codigo, nombre, tipo, estado } };
}
