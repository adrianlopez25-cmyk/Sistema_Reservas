// Utilidades compartidas por los tests (no es un test en sí).
import request from 'supertest';
import { crearApp } from '../src/app.js';

// Crea una app NUEVA (con datos de prueba controlados) y un agente que guarda cookies
export function nuevaApp() {
  const app = crearApp();
  return { app, agente: request.agent(app) };
}

// Pide una página con formulario y extrae el token CSRF del HTML
export async function obtenerToken(agente, ruta = '/login') {
  const res = await agente.get(ruta);
  const coincidencia = res.text.match(/name="_csrf" value="([^"]+)"/);
  return coincidencia[1];
}

export async function iniciarSesion(agente, email, password) {
  const token = await obtenerToken(agente, '/login');
  return agente.post('/login').type('form').send({ _csrf: token, email, password });
}

export const ANA = { email: 'ana@example.com', password: 'Ana12345' };
export const LUIS = { email: 'luis@example.com', password: 'Luis12345' };
export const ADMIN = { email: 'admin@example.com', password: 'Admin1234' };
