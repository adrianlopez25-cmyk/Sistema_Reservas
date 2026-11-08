// Protección CSRF con token guardado en la sesión ("synchronizer token").
// Cada formulario POST incluye <input name="_csrf">; el servidor compara con el de la sesión.
import crypto from 'node:crypto';
import { ErrorPermisos } from '../domain/Errores.js';

// Crea el token si la sesión no lo tiene y lo deja disponible en las vistas
export function prepararCsrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function sonIguales(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Se aplica a todas las peticiones POST (incluido /login, /registro y /logout)
export function verificarCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  const esperado = req.session.csrfToken;
  const recibido = req.body?._csrf;
  if (!esperado || typeof recibido !== 'string' || !sonIguales(esperado, recibido)) {
    return next(new ErrorPermisos('Token CSRF inválido o ausente'));
  }
  next();
}
