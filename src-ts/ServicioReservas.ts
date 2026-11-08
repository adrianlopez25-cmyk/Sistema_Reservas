import { ErrorDominio } from "./ErrorDominio.js";
import type { DatosNuevaReserva, Reserva } from "./modelos.js";
import type { RepositorioReservas } from "./RepositorioReservas.js";

export class ServicioReservas {
  // Inyección de dependencias: el repositorio llega por el constructor,
  // el servicio no lo crea él mismo (así se puede cambiar o simular en pruebas).
  constructor(private readonly repositorio: RepositorioReservas) {}

  crear(datos: DatosNuevaReserva): Reserva {
    if (this.repositorio.existeActiva(datos.equipoId, datos.fecha, datos.turno)) {
      throw new ErrorDominio("El equipo ya está reservado en ese turno", "RESERVA_DUPLICADA");
    }
    return this.repositorio.crear(datos);
  }

  listarDeUsuario(usuarioId: number): Reserva[] {
    return this.repositorio.listar().filter((r) => r.usuarioId === usuarioId);
  }

  cancelar(reservaId: number, usuarioId: number): Reserva {
    const reserva = this.repositorio.buscarPorId(reservaId);
    if (reserva === undefined) {
      throw new ErrorDominio("La reserva no existe", "NO_ENCONTRADA");
    }
    if (reserva.usuarioId !== usuarioId) {
      throw new ErrorDominio("La reserva pertenece a otro usuario", "SIN_PERMISOS");
    }
    if (reserva.estado === "cancelada") {
      throw new ErrorDominio("La reserva ya estaba cancelada", "YA_CANCELADA");
    }
    const actualizada = this.repositorio.actualizarEstado(reservaId, "cancelada");
    if (actualizada === undefined) {
      throw new ErrorDominio("La reserva no existe", "NO_ENCONTRADA");
    }
    return actualizada;
  }
}
