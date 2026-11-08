// Controlador de reservas de usuario.
import { fechaHoy, parsearId } from '../domain/reglas.js';
import { ErrorDominio } from '../domain/Errores.js';
import { construirVistaReserva } from '../presentation/reservasVM.js';

export function crearReservasController({ servicioReservas }) {
  // Pinta el formulario con la disponibilidad de la fecha/turno indicados
  function pintarFormulario(res, status, valores, errores = {}) {
    const disponibles = servicioReservas.equiposDisponibles(valores.fecha, valores.turno);
    res.status(status).render('nueva-reserva', construirVistaReserva({ valores, errores, equiposDisponibles: disponibles }));
  }

  return {
    mostrarFormulario(req, res) {
      const valores = {
        equipoId: String(req.query.equipoId ?? ''),
        fecha: String(req.query.fecha ?? fechaHoy()),
        turno: String(req.query.turno ?? 'manana'),
      };
      pintarFormulario(res, 200, valores);
    },

    crear(req, res) {
      const { equipoId = '', fecha = '', turno = '' } = req.body ?? {};
      const valores = { equipoId: String(equipoId), fecha: String(fecha), turno: String(turno) };
      try {
        // El usuario sale de la SESIÓN (req.usuario), nunca del formulario
        servicioReservas.crear(req.usuario.id, valores);
        req.session.flash = { tipo: 'ok', texto: 'Reserva creada correctamente' };
        res.redirect(303, '/mis-reservas'); // PRG
      } catch (err) {
        if (!(err instanceof ErrorDominio)) throw err;
        const errores = err.errores ?? { general: err.message };
        pintarFormulario(res, err.status, valores, errores);
      }
    },

    misReservas(req, res) {
      const reservas = servicioReservas.listarDeUsuario(req.usuario.id);
      res.render('mis-reservas', { titulo: 'Mis reservas', reservas });
    },

    cancelar(req, res) {
      // El servicio comprueba que la reserva es del usuario (propiedad)
      servicioReservas.cancelar(parsearId(req.params.id), req.usuario);
      req.session.flash = { tipo: 'ok', texto: 'Reserva cancelada' };
      res.redirect(303, '/mis-reservas');
    },
  };
}
