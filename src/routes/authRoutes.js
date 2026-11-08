// Rutas: solo definen método HTTP + URL + middleware. La lógica está en los controladores.
import { Router } from 'express';
import { requiereAuth } from '../middleware/authMiddleware.js';

export function crearAuthRoutes(controlador, limitadorLogin) {
  const router = Router();
  router.get('/registro', controlador.mostrarRegistro);
  router.post('/registro', controlador.registrar);
  router.get('/login', controlador.mostrarLogin);
  router.post('/login', limitadorLogin, controlador.login);
  router.post('/logout', controlador.logout);
  router.get('/perfil', requiereAuth, controlador.perfil);
  return router;
}
