// Limitación de intentos de inicio de sesión con express-rate-limit.
import rateLimit from 'express-rate-limit';
import { ErrorDemasiadasPeticiones } from '../domain/Errores.js';

export function crearLimitadorLogin(maxIntentos) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // ventana de 15 minutos
    limit: maxIntentos, // intentos permitidos por IP en la ventana
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ErrorDemasiadasPeticiones()), // -> 429 vía errorHandler
  });
}
