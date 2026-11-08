// Tipos del núcleo de reservas. Los "tipos unión" limitan los valores posibles:
// el compilador avisa si escribes un turno o un rol que no existe.
export type Rol = "usuario" | "admin";
export type Turno = "manana" | "tarde";
export type EstadoReserva = "activa" | "cancelada";
export type EstadoEquipo = "operativo" | "fuera_de_servicio";
export type TipoEquipo = "sobremesa" | "portatil";

export interface Equipo {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoEquipo;
  estado: EstadoEquipo;
}

export interface Reserva {
  id: number;
  equipoId: number;
  usuarioId: number;
  fecha: string; // formato AAAA-MM-DD
  turno: Turno;
  estado: EstadoReserva;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

// Lo necesario para crear una reserva (el id y el estado los pone el repositorio)
export interface DatosNuevaReserva {
  equipoId: number;
  usuarioId: number;
  fecha: string;
  turno: Turno;
}
