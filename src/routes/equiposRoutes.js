import { Router } from 'express';

export function crearEquiposRoutes(controlador) {
  const router = Router();
  router.get('/', (req, res) => res.redirect(303, '/equipos'));
  router.get('/equipos', controlador.listar);
  router.get('/equipos/:id', controlador.detalle);
  return router;
}
