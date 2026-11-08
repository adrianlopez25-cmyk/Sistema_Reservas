import { Router } from 'express';
import { requiereRol } from '../middleware/authMiddleware.js';

export function crearAdminRoutes(controlador) {
  const router = Router();
  router.use(requiereRol('admin')); // TODAS las rutas /admin/* exigen rol admin
  router.get('/equipos', controlador.equipos);
  router.post('/equipos', controlador.crearEquipo);
  router.post('/equipos/:id/estado', controlador.cambiarEstado);
  router.get('/reservas', controlador.reservas);
  router.post('/reservas/:id/cancelar', controlador.cancelarReserva);
  return router;
}
