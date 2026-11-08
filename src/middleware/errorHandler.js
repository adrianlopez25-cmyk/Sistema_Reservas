// Tratamiento centralizado de errores: TODOS los errores acaban aquí.
import { ErrorDominio, ErrorNoEncontrado } from '../domain/Errores.js';

// Se pone después de todas las rutas: si nadie respondió, es un 404
export function rutaNoEncontrada(req, res, next) {
  next(new ErrorNoEncontrado('La página que buscas no existe'));
}

export function manejarErrores(config) {
  // Express reconoce un manejador de errores por tener 4 parámetros
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);

    let status = 500;
    let mensaje = 'Error interno del servidor';

    if (err instanceof ErrorDominio) {
      status = err.status;
      mensaje = err.message;
    } else if (err.status >= 400 && err.status < 500) {
      status = err.status; // p. ej. cuerpo de petición mal formado
      mensaje = 'Petición incorrecta';
    } else if (config.nodeEnv !== 'test') {
      console.error(err); // el detalle se queda en el log del servidor, nunca en la web
    }

    res.status(status).render('error', { titulo: `Error ${status}`, status, mensaje });
  };
}
