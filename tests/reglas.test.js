// Pruebas extra de las funciones puras y del núcleo TypeScript (sin Express).
import { describe, expect, it } from 'vitest';
import { estaReservado, obtenerEquiposDisponibles, validarReserva } from '../src/domain/reglas.js';
import { RepositorioReservasMemoria } from '../src-ts/RepositorioReservasMemoria.ts';
import { ServicioReservas } from '../src-ts/ServicioReservas.ts';

const equipos = [
  { id: 1, estado: 'operativo' },
  { id: 2, estado: 'operativo' },
  { id: 3, estado: 'fuera_de_servicio' },
];
const reservas = [
  { equipoId: 1, fecha: '2030-01-01', turno: 'manana', estado: 'activa' },
  { equipoId: 2, fecha: '2030-01-01', turno: 'manana', estado: 'cancelada' },
];

describe('Funciones puras', () => {
  it('estaReservado ignora las reservas canceladas', () => {
    expect(estaReservado(1, '2030-01-01', 'manana', reservas)).toBe(true);
    expect(estaReservado(2, '2030-01-01', 'manana', reservas)).toBe(false);
  });

  it('obtenerEquiposDisponibles filtra reservados y fuera de servicio', () => {
    const libres = obtenerEquiposDisponibles(equipos, reservas, '2030-01-01', 'manana');
    expect(libres.map((e) => e.id)).toEqual([2]);
    expect(obtenerEquiposDisponibles(equipos, reservas, '2030-01-01', 'tarde').map((e) => e.id)).toEqual([1, 2]);
  });

  it('validarReserva detecta fecha pasada, fecha inexistente, turno e id inválidos', () => {
    expect(validarReserva({ equipoId: '1', fecha: '2030-01-01', turno: 'tarde' }, '2029-12-31').valido).toBe(true);
    expect(validarReserva({ equipoId: '1', fecha: '2020-01-01', turno: 'tarde' }).errores.fecha).toBeDefined();
    expect(validarReserva({ equipoId: '1', fecha: '2030-02-31', turno: 'tarde' }).errores.fecha).toBeDefined();
    expect(validarReserva({ equipoId: 'abc', fecha: '2030-01-01', turno: 'noche' }).errores).toHaveProperty('turno');
    expect(validarReserva({ equipoId: 'abc', fecha: '2030-01-01', turno: 'noche' }).errores).toHaveProperty('equipoId');
  });
});

describe('Núcleo TypeScript', () => {
  it('impide duplicados y permite reservar tras cancelar', () => {
    const servicio = new ServicioReservas(new RepositorioReservasMemoria());
    const r = servicio.crear({ equipoId: 1, usuarioId: 1, fecha: '2030-01-01', turno: 'manana' });
    expect(() => servicio.crear({ equipoId: 1, usuarioId: 2, fecha: '2030-01-01', turno: 'manana' })).toThrow();
    servicio.cancelar(r.id, 1);
    expect(servicio.crear({ equipoId: 1, usuarioId: 2, fecha: '2030-01-01', turno: 'manana' }).id).toBe(2);
  });
});
