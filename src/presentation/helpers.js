// Utilidades de presentación (formatos para las vistas y envoltorios de sesión).
import { ErrorDominio } from '../domain/Errores.js';

export function etiquetaTurno(turno) {
  return turno === 'manana' ? 'Mañana' : turno === 'tarde' ? 'Tarde' : turno;
}

export function etiquetaEstado(estado) {
  const etiquetas = {
    operativo: 'Operativo',
    fuera_de_servicio: 'Fuera de servicio',
    activa: 'Activa',
    cancelada: 'Cancelada',
  };
  return etiquetas[estado] ?? estado;
}

export function etiquetaTipo(tipo) {
  return tipo === 'portatil' ? 'Portátil' : tipo === 'sobremesa' ? 'Sobremesa' : tipo;
}

// Vuelve a pintar un formulario con los errores de un ErrorDominio (y su código HTTP).
// Si el error NO es de dominio, lo relanza para que lo trate el errorHandler.
export function renderizarConError(res, vista, err, datos) {
  if (!(err instanceof ErrorDominio)) throw err;
  const errores = err.errores ?? { general: err.message };
  return res.status(err.status).render(vista, { ...datos, errores });
}

// Envoltorios con promesas para los métodos de express-session (que usan callbacks)
export const regenerarSesion = (req) =>
  new Promise((ok, fallo) => req.session.regenerate((e) => (e ? fallo(e) : ok())));
export const guardarSesion = (req) =>
  new Promise((ok, fallo) => req.session.save((e) => (e ? fallo(e) : ok())));
export const destruirSesion = (req) =>
  new Promise((ok, fallo) => req.session.destroy((e) => (e ? fallo(e) : ok())));
