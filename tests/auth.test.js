import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { ANA, iniciarSesion, nuevaApp, obtenerToken } from './helpers.js';

describe('Autenticación', () => {
  // Prueba 1
  it('registra a un usuario válido con rol usuario', async () => {
    const { agente } = nuevaApp();
    const token = await obtenerToken(agente, '/registro');
    const res = await agente
      .post('/registro')
      .type('form')
      .send({ _csrf: token, nombre: 'Marta Ruiz', email: 'marta@example.com', password: 'Marta12345' });
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/login');

    // Puede iniciar sesión y su rol es "usuario"
    const login = await iniciarSesion(agente, 'marta@example.com', 'Marta12345');
    expect(login.status).toBe(303);
    const perfil = await agente.get('/perfil');
    expect(perfil.status).toBe(200);
    expect(perfil.text).toContain('marta@example.com');
    expect(perfil.text).toContain('usuario');
  });

  // Prueba 2
  it('rechaza credenciales incorrectas con 401 sin revelar si el correo existe', async () => {
    const { agente } = nuevaApp();
    const conCorreoReal = await iniciarSesion(agente, ANA.email, 'contraseña-mala');
    const conCorreoFalso = await iniciarSesion(agente, 'noexiste@example.com', 'contraseña-mala');
    expect(conCorreoReal.status).toBe(401);
    expect(conCorreoFalso.status).toBe(401);
    expect(conCorreoReal.text).toContain('Correo o contraseña incorrectos');
    expect(conCorreoFalso.text).toContain('Correo o contraseña incorrectos');
  });

  // Prueba 3
  it('redirige al login si se accede a una ruta privada sin autenticar', async () => {
    const { agente } = nuevaApp();
    const res = await agente.get('/perfil');
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/login');
  });

  // Prueba 4
  it('permite acceder a una ruta privada con sesión', async () => {
    const { agente } = nuevaApp();
    await iniciarSesion(agente, ANA.email, ANA.password);
    const res = await agente.get('/perfil');
    expect(res.status).toBe(200);
    expect(res.text).toContain(ANA.email);
  });

  // Prueba 10
  it('invalida la sesión después del logout', async () => {
    const app = crearApp();
    const agente = request.agent(app);
    const login = await iniciarSesion(agente, ANA.email, ANA.password);
    const cookieAntigua = login.headers['set-cookie'][0].split(';')[0]; // "sid=..."

    expect((await agente.get('/perfil')).status).toBe(200);

    const token = await obtenerToken(agente, '/perfil');
    const logout = await agente.post('/logout').type('form').send({ _csrf: token });
    expect(logout.status).toBe(303);

    // Con el agente (cookie borrada) ya no hay acceso
    expect((await agente.get('/perfil')).status).toBe(303);

    // Aunque alguien reutilice la cookie antigua, el servidor la ha destruido
    const reutilizada = await request(app).get('/perfil').set('Cookie', cookieAntigua);
    expect(reutilizada.status).toBe(303);
    expect(reutilizada.headers.location).toBe('/login');
  });
});
