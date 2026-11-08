import { describe, expect, it } from 'vitest';
import { ADMIN, ANA, iniciarSesion, nuevaApp, obtenerToken } from './helpers.js';

describe('Administración', () => {
  // Prueba 5
  it('rechaza con 403 una operación de administrador hecha por un usuario ordinario', async () => {
    const { agente } = nuevaApp();
    await iniciarSesion(agente, ANA.email, ANA.password);
    const token = await obtenerToken(agente, '/perfil'); // token CSRF válido

    const res = await agente
      .post('/admin/equipos/1/estado')
      .type('form')
      .send({ _csrf: token, estado: 'fuera_de_servicio' });
    expect(res.status).toBe(403);
    expect((await agente.get('/admin/equipos')).status).toBe(403);
  });

  // Prueba 9
  it('rechaza un cambio de estado sin token CSRF válido', async () => {
    const { agente } = nuevaApp();
    await iniciarSesion(agente, ADMIN.email, ADMIN.password);

    const sinToken = await agente.post('/admin/equipos/1/estado').type('form').send({ estado: 'fuera_de_servicio' });
    expect(sinToken.status).toBe(403);
    const tokenFalso = await agente
      .post('/admin/equipos/1/estado')
      .type('form')
      .send({ _csrf: 'token-inventado', estado: 'fuera_de_servicio' });
    expect(tokenFalso.status).toBe(403);
    expect((await agente.get('/equipos/1')).text).not.toContain('Fuera de servicio');

    // Con el token correcto sí funciona
    const token = await obtenerToken(agente, '/admin/equipos');
    const ok = await agente.post('/admin/equipos/1/estado').type('form').send({ _csrf: token, estado: 'fuera_de_servicio' });
    expect(ok.status).toBe(303);
    expect((await agente.get('/equipos/1')).text).toContain('Fuera de servicio');
  });
});
