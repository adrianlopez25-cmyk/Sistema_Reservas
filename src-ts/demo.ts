// Demo ejecutable del núcleo TypeScript:  npm run build:ts  &&  npm run demo:ts
import { ErrorDominio } from "./ErrorDominio.js";
import { RepositorioReservasMemoria } from "./RepositorioReservasMemoria.js";
import { ServicioReservas } from "./ServicioReservas.js";

const servicio = new ServicioReservas(new RepositorioReservasMemoria());

const primera = servicio.crear({ equipoId: 1, usuarioId: 2, fecha: "2030-01-15", turno: "manana" });
console.log("Reserva creada:", primera);

try {
  servicio.crear({ equipoId: 1, usuarioId: 3, fecha: "2030-01-15", turno: "manana" });
} catch (error) {
  if (error instanceof ErrorDominio) console.log(`Error esperado (${error.codigo}): ${error.message}`);
}

console.log("Cancelada:", servicio.cancelar(primera.id, 2));
console.log("Reservas del usuario 2:", servicio.listarDeUsuario(2));
