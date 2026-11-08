import type { DatosNuevaReserva, EstadoReserva, Reserva, Turno } from "./modelos.js";
import type { RepositorioReservas } from "./RepositorioReservas.js";

// Implementación del contrato usando un Map (clave: id de la reserva).
export class RepositorioReservasMemoria implements RepositorioReservas {
  private readonly reservas = new Map<number, Reserva>();
  private siguienteId = 1;

  listar(): Reserva[] {
    return Array.from(this.reservas.values());
  }

  buscarPorId(id: number): Reserva | undefined {
    return this.reservas.get(id);
  }

  existeActiva(equipoId: number, fecha: string, turno: Turno): boolean {
    return this.listar().some(
      (r) => r.equipoId === equipoId && r.fecha === fecha && r.turno === turno && r.estado === "activa"
    );
  }

  crear(datos: DatosNuevaReserva): Reserva {
    const reserva: Reserva = { id: this.siguienteId, ...datos, estado: "activa" };
    this.reservas.set(reserva.id, reserva);
    this.siguienteId += 1;
    return reserva;
  }

  actualizarEstado(id: number, estado: EstadoReserva): Reserva | undefined {
    const reserva = this.reservas.get(id);
    if (reserva === undefined) return undefined;
    reserva.estado = estado;
    return reserva;
  }
}
