// Controlador de autenticación: recibe datos HTTP, llama al servicio y decide la respuesta.
import { destruirSesion, guardarSesion, regenerarSesion, renderizarConError } from '../presentation/helpers.js';

export function crearAuthController({ servicioUsuarios }) {
  return {
    mostrarRegistro(req, res) {
      res.render('registro', { titulo: 'Registro', errores: {}, valores: {} });
    },

    async registrar(req, res) {
      const { nombre, email, password } = req.body ?? {};
      try {
        await servicioUsuarios.registrar({ nombre, email, password });
        req.session.flash = { tipo: 'ok', texto: 'Registro correcto. Ya puedes iniciar sesión.' };
        res.redirect(303, '/login'); // PRG
      } catch (err) {
        // No devolvemos la contraseña al formulario
        renderizarConError(res, 'registro', err, { titulo: 'Registro', valores: { nombre, email } });
      }
    },

    mostrarLogin(req, res) {
      res.render('login', { titulo: 'Iniciar sesión', errores: {}, valores: {} });
    },

    async login(req, res) {
      const { email, password } = req.body ?? {};
      try {
        const usuario = await servicioUsuarios.autenticar(email, password);
        await regenerarSesion(req); // nuevo id de sesión: evita "session fixation"
        req.session.userId = usuario.id; // lo ÚNICO que guardamos como identidad
        req.session.flash = { tipo: 'ok', texto: `Bienvenido/a, ${usuario.nombre}` };
        await guardarSesion(req);
        res.redirect(303, '/perfil');
      } catch (err) {
        renderizarConError(res, 'login', err, { titulo: 'Iniciar sesión', valores: { email } });
      }
    },

    async logout(req, res) {
      await destruirSesion(req); // borra la sesión en el servidor
      res.clearCookie('sid'); // y la cookie en el navegador
      res.redirect(303, '/login');
    },

    perfil(req, res) {
      res.render('perfil', { titulo: 'Mi perfil' });
    },
  };
}
