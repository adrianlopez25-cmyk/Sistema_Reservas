// Controlador de administración (las rutas ya están protegidas por requiereRol('admin')).
import { parsearId } from '../domain/reglas.js';
import { renderizarConError } from '../presentation/helpers.js';

export function crearAdminController({ servicioEquipos, servicioReservas }) {
  function pintarEquipos(res, status, errores = {}, valores = {}) {
    res.status(status).render('admin-equipos', {
      titulo: 'Administrar equipos',
      equipos: servicioEquipos.listar(),
      errores,
      valores,
    });
  }

  return {
    equipos(req, res) {
      pintarEquipos(res, 200);
    },

    crearEquipo(req, res) {
      const { codigo, nombre, tipo, estado } = req.body ?? {};
      try {
        servicioEquipos.crear({ codigo, nombre, tipo, estado });
        req.session.flash = { tipo: 'ok', texto: 'Equipo añadido' };
        res.redirect(303, '/admin/equipos');
      } catch (err) {
        renderizarConError(res, 'admin-equipos', err, {
          titulo: 'Administrar equipos',
          equipos: servicioEquipos.listar(),
          valores: { codigo, nombre, tipo, estado },
        });
      }
    },

    cambiarEstado(req, res) {
      servicioEquipos.cambiarEstado(parsearId(req.params.id), req.body?.estado);
      req.session.flash = { tipo: 'ok', texto: 'Estado del equipo actualizado' };
      res.redirect(303, '/admin/equipos');
    },

    reservas(req, res) {
      res.render('admin-reservas', { titulo: 'Todas las reservas', reservas: servicioReservas.listarTodas() });
    },

    cancelarReserva(req, res) {
      servicioReservas.cancelar(parsearId(req.params.id), req.usuario); // admin: sin comprobar propiedad
      req.session.flash = { tipo: 'ok', texto: 'Reserva cancelada' };
      res.redirect(303, '/admin/reservas');
    },
  };
}
