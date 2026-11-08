// Modelo de vista (view model) del formulario de reservas.
// Convierte datos del servicio en exactamente lo que necesita la vista nueva-reserva.ejs.
import { TURNOS, fechaHoy } from '../domain/reglas.js';
import { etiquetaTurno } from './helpers.js';

export function construirVistaReserva({ valores, errores, equiposDisponibles }) {
  return {
    titulo: 'Nueva reserva',
    valores, // { equipoId, fecha, turno } -> se conservan tras un error
    errores,
    hoy: fechaHoy(),
    turnos: TURNOS.map((t) => ({ valor: t, etiqueta: etiquetaTurno(t) })),
    // Solo los equipos disponibles para la fecha y turno elegidos
    equipos: equiposDisponibles.map((e) => ({
      id: e.id,
      texto: `${e.codigo} - ${e.nombre}`,
      seleccionado: String(e.id) === String(valores.equipoId),
    })),
  };
}
