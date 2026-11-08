// Middleware reutilizable de autenticación y autorización.
import { ErrorPermisos } from '../domain/Errores.js';

// Lee el id guardado en la sesión y carga el usuario REAL desde el repositorio.
// La identidad nunca sale de una cookie de preferencias ni de un campo del formulario.
export function cargarUsuario(servicioUsuarios) {
  return (req, res, next) => {
    const id = req.session.userId;
    req.usuario = id ? servicioUsuarios.obtenerPorId(id) ?? null : null;
    if (id && !req.usuario) delete req.session.userId; // el usuario ya no existe
    res.locals.usuario = req.usuario; // disponible en todas las vistas EJS
    next();
  };
}

// Exige estar autenticado. Si no, 303 al login.
export function requiereAuth(req, res, next) {
  if (!req.usuario) return res.redirect(303, '/login');
  next();
}

// Exige uno de los roles indicados: anónimo -> 303 login; sin permisos -> 403
export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.redirect(303, '/login');
    if (!roles.includes(req.usuario.rol)) return next(new ErrorPermisos());
    next();
  };
}
