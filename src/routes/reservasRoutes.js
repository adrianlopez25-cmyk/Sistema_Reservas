import { Router } from 'express';
import { requiereAuth } from '../middleware/authMiddleware.js';

export function crearReservasRoutes(controlador) {
  const router = Router();
  router.get('/reservas/nueva', requiereAuth, controlador.mostrarFormulario);
  router.post('/reservas', requiereAuth, controlador.crear);
  router.get('/mis-reservas', requiereAuth, controlador.misReservas);
  router.post('/reservas/:id/cancelar', requiereAuth, controlador.cancelar);
  return router;
}
