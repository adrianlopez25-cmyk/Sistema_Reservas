import type { DatosNuevaReserva, EstadoReserva, Reserva, Turno } from "./modelos.js";

// Interfaz = el "contrato" que debe cumplir cualquier repositorio de reservas
// (en memoria, base de datos, etc.). El servicio solo conoce esta interfaz.
export interface RepositorioReservas {
  listar(): Reserva[];
  buscarPorId(id: number): Reserva | undefined;
  existeActiva(equipoId: number, fecha: string, turno: Turno): boolean;
  crear(datos: DatosNuevaReserva): Reserva;
  actualizarEstado(id: number, estado: EstadoReserva): Reserva | undefined;
}
