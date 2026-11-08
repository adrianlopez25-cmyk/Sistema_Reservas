// Servicio de reservas: aquí viven las reglas de disponibilidad, conflictos y cancelaciones.
import {
  estaReservado,
  fechaHoy,
  obtenerEquiposDisponibles,
  validarFechaTurno,
  validarReserva,
} from '../domain/reglas.js';
import { ErrorConflicto, ErrorNoEncontrado, ErrorPermisos, ErrorValidacion } from '../domain/Errores.js';

export class ServicioReservas {
  constructor(repoReservas, repoEquipos, repoUsuarios) {
    this.repoReservas = repoReservas;
    this.repoEquipos = repoEquipos;
    this.repoUsuarios = repoUsuarios;
  }

  // Equipos libres para una fecha y turno (lista vacía si fecha/turno no son válidos)
  equiposDisponibles(fecha, turno, hoy = fechaHoy()) {
    const errores = validarFechaTurno(fecha, turno, hoy);
    if (Object.keys(errores).length > 0) return [];
    return obtenerEquiposDisponibles(this.repoEquipos.todos(), this.repoReservas.todas(), fecha, turno);
  }

  // usuarioId viene de la SESIÓN (lo decide el controlador), nunca del formulario
  crear(usuarioId, datos, hoy = fechaHoy()) {
    const { valido, errores, valores } = validarReserva(datos, hoy);
    if (!valido) throw new ErrorValidacion(errores);

    const equipo = this.repoEquipos.buscarPorId(valores.equipoId);
    if (!equipo) throw new ErrorNoEncontrado('El equipo solicitado no existe');
    if (equipo.estado !== 'operativo') {
      throw new ErrorValidacion({ equipoId: 'El equipo no está operativo' });
    }
    if (estaReservado(valores.equipoId, valores.fecha, valores.turno, this.repoReservas.todas())) {
      throw new ErrorConflicto('Ese equipo ya está reservado para esa fecha y turno');
    }

    return this.repoReservas.crear({
      equipoId: valores.equipoId,
      usuarioId,
      fecha: valores.fecha,
      turno: valores.turno,
      estado: 'activa',
    });
  }

  listarDeUsuario(usuarioId, hoy = fechaHoy()) {
    return this.repoReservas
      .buscarPorUsuario(usuarioId)
      .map((r) => this.enriquecer(r, hoy))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  listarTodas(hoy = fechaHoy()) {
    return this.repoReservas
      .todas()
      .map((r) => this.enriquecer(r, hoy))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // solicitante = { id, rol } del usuario autenticado
  cancelar(reservaId, solicitante, hoy = fechaHoy()) {
    const reserva = this.repoReservas.buscarPorId(reservaId);
    if (!reserva) throw new ErrorNoEncontrado('La reserva no existe');

    const esAdmin = solicitante.rol === 'admin';

    // Comprobación de PROPIEDAD: un usuario solo cancela sus reservas
    if (!esAdmin && reserva.usuarioId !== solicitante.id) {
      throw new ErrorPermisos('No puedes cancelar una reserva que no es tuya');
    }
    if (reserva.estado !== 'activa') {
      throw new ErrorConflicto('La reserva ya estaba cancelada');
    }
    if (!esAdmin && reserva.fecha < hoy) {
      throw new ErrorValidacion({ general: 'No se puede cancelar una reserva cuya fecha ya ha pasado' });
    }

    return this.repoReservas.cambiarEstado(reservaId, 'cancelada');
  }

  // Añade nombre del equipo/usuario y si se puede cancelar (para mostrarlo en las vistas)
  enriquecer(reserva, hoy) {
    const equipo = this.repoEquipos.buscarPorId(reserva.equipoId);
    const usuario = this.repoUsuarios.buscarPorId(reserva.usuarioId);
    return {
      ...reserva,
      equipoNombre: equipo ? `${equipo.codigo} - ${equipo.nombre}` : 'Equipo desconocido',
      usuarioNombre: usuario ? usuario.nombre : 'Usuario desconocido',
      cancelable: reserva.estado === 'activa' && reserva.fecha >= hoy,
    };
  }
}
