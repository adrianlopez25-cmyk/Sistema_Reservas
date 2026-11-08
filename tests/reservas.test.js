import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { ANA, LUIS, iniciarSesion, obtenerToken } from './helpers.js';

const FECHA = '2030-05-20';

async function reservar(agente, datos) {
  const token = await obtenerToken(agente, `/reservas/nueva?fecha=${FECHA}&turno=${datos.turno}`);
  return agente.post('/reservas').type('form').send({ _csrf: token, fecha: FECHA, ...datos });
}

describe('Reservas', () => {
  // Prueba 6
  it('crea una reserva válida de un equipo disponible (PRG con 303)', async () => {
    const agente = request.agent(crearApp());
    await iniciarSesion(agente, ANA.email, ANA.password);

    const res = await reservar(agente, { equipoId: 2, turno: 'tarde' });
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/mis-reservas');

    const lista = await agente.get('/mis-reservas');
    expect(lista.text).toContain('PORT-001');
    expect(lista.text).toContain(FECHA);
    expect(lista.text).toContain('Reserva creada correctamente'); // mensaje de un solo uso
    const otra = await agente.get('/mis-reservas');
    expect(otra.text).not.toContain('Reserva creada correctamente');
  });

  // Prueba 7
  it('rechaza una reserva duplicada para el mismo equipo, fecha y turno con 409', async () => {
    const app = crearApp();
    const ana = request.agent(app);
    const luis = request.agent(app);
    await iniciarSesion(ana, ANA.email, ANA.password);
    await iniciarSesion(luis, LUIS.email, LUIS.password);

    expect((await reservar(ana, { equipoId: 2, turno: 'tarde' })).status).toBe(303);
    const duplicada = await reservar(luis, { equipoId: 2, turno: 'tarde' });
    expect(duplicada.status).toBe(409);
    expect(duplicada.text).toContain('ya está reservado');
  });

  // Prueba 8
  it('rechaza la cancelación de una reserva ajena con 403', async () => {
    const app = crearApp();
    const luis = request.agent(app);
    await iniciarSesion(luis, LUIS.email, LUIS.password);

    // La reserva 1 pertenece a Ana (usuario 2)
    const token = await obtenerToken(luis, '/mis-reservas');
    const res = await luis.post('/reservas/1/cancelar').type('form').send({ _csrf: token });
    expect(res.status).toBe(403);

    // Y sigue activa para Ana
    const ana = request.agent(app);
    await iniciarSesion(ana, ANA.email, ANA.password);
    const lista = await ana.get('/mis-reservas');
    expect(lista.text).toContain('Activa');
  });
});
