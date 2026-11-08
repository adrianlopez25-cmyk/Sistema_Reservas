// app.js: construye y configura la aplicación Express, pero NO arranca el servidor.
// Así los tests (Supertest) pueden usarla sin abrir un puerto.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import { config as configPorDefecto } from './config.js';
import { equiposIniciales, reservasIniciales, usuariosIniciales } from './domain/modelos.js';
import { RepositorioEquipos } from './repositories/RepositorioEquipos.js';
import { RepositorioReservas } from './repositories/RepositorioReservas.js';
import { RepositorioUsuarios } from './repositories/RepositorioUsuarios.js';
import { ServicioEquipos } from './services/ServicioEquipos.js';
import { ServicioReservas } from './services/ServicioReservas.js';
import { ServicioUsuarios } from './services/ServicioUsuarios.js';
import { crearAuthController } from './controllers/authController.js';
import { crearEquiposController } from './controllers/equiposController.js';
import { crearReservasController } from './controllers/reservasController.js';
import { crearAdminController } from './controllers/adminController.js';
import { crearAuthRoutes } from './routes/authRoutes.js';
import { crearEquiposRoutes } from './routes/equiposRoutes.js';
import { crearReservasRoutes } from './routes/reservasRoutes.js';
import { crearAdminRoutes } from './routes/adminRoutes.js';
import { cargarUsuario } from './middleware/authMiddleware.js';
import { prepararCsrf, verificarCsrf } from './middleware/csrfMiddleware.js';
import { crearLimitadorLogin } from './middleware/rateLimiters.js';
import { manejarErrores, rutaNoEncontrada } from './middleware/errorHandler.js';
import { etiquetaEstado, etiquetaTipo, etiquetaTurno } from './presentation/helpers.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function crearApp(config = configPorDefecto) {
  // 1. Repositorios (datos en memoria) -> cada app tiene los suyos, ideal para tests
  const repoEquipos = new RepositorioEquipos(equiposIniciales());
  const repoReservas = new RepositorioReservas(reservasIniciales());
  const repoUsuarios = new RepositorioUsuarios(usuariosIniciales(config.rondasBcrypt));

  // 2. Servicios (reglas de negocio)
  const servicioEquipos = new ServicioEquipos(repoEquipos);
  const servicioReservas = new ServicioReservas(repoReservas, repoEquipos, repoUsuarios);
  const servicioUsuarios = new ServicioUsuarios(repoUsuarios, config.rondasBcrypt);

  // 3. Controladores
  const authController = crearAuthController({ servicioUsuarios });
  const equiposController = crearEquiposController({ servicioEquipos, config });
  const reservasController = crearReservasController({ servicioReservas });
  const adminController = crearAdminController({ servicioEquipos, servicioReservas });

  // 4. Express
  const app = express();
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(raiz, 'views'));

  app.use(express.urlencoded({ extended: false })); // lee formularios HTML
  app.use(cookieParser()); // lee cookies (preferencias)
  app.use(express.static(path.join(raiz, 'public')));

  app.use(
    session({
      name: 'sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // JavaScript del navegador no puede leerla
        secure: config.produccion, // solo por HTTPS en producción
        sameSite: 'lax', // no se envía en peticiones POST de otros sitios
        maxAge: 60 * 60 * 1000, // 1 hora
      },
    })
  );

  app.use(cargarUsuario(servicioUsuarios)); // req.usuario y res.locals.usuario

  // Mensaje flash: se muestra UNA vez y se borra de la sesión
  app.use((req, res, next) => {
    res.locals.flash = req.session.flash ?? null;
    delete req.session.flash;
    next();
  });

  app.use(prepararCsrf); // crea token CSRF
  app.use(verificarCsrf); // comprueba token en todos los POST

  // Funciones de formato disponibles en todas las vistas EJS
  app.locals.etiquetaTurno = etiquetaTurno;
  app.locals.etiquetaEstado = etiquetaEstado;
  app.locals.etiquetaTipo = etiquetaTipo;

  // 5. Rutas
  app.use('/admin', crearAdminRoutes(adminController));
  app.use(crearAuthRoutes(authController, crearLimitadorLogin(config.maxIntentosLogin)));
  app.use(crearEquiposRoutes(equiposController));
  app.use(crearReservasRoutes(reservasController));

  // 6. Errores (siempre al final)
  app.use(rutaNoEncontrada);
  app.use(manejarErrores(config));

  return app;
}
