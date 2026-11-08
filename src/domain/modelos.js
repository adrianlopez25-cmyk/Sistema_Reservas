// Datos iniciales (semilla) que existen al arrancar el servidor.
import bcrypt from 'bcrypt';

export function equiposIniciales() {
  return [
    { id: 1, codigo: 'PC-001', nombre: 'Ordenador aula 1', tipo: 'sobremesa', estado: 'operativo' },
    { id: 2, codigo: 'PORT-001', nombre: 'Portátil Lenovo', tipo: 'portatil', estado: 'operativo' },
    { id: 3, codigo: 'PC-002', nombre: 'Ordenador aula 2', tipo: 'sobremesa', estado: 'fuera_de_servicio' },
  ];
}

export function reservasIniciales() {
  return [
    { id: 1, equipoId: 1, usuarioId: 2, fecha: '2027-01-15', turno: 'manana', estado: 'activa' },
    { id: 2, equipoId: 2, usuarioId: 3, fecha: '2027-01-16', turno: 'tarde', estado: 'activa' },
    { id: 3, equipoId: 1, usuarioId: 2, fecha: '2027-01-20', turno: 'tarde', estado: 'cancelada' },
  ];
}

// Contraseñas de DEMO (solo para pruebas locales). Se guardan siempre como hash bcrypt.
const usuariosDemo = [
  { id: 1, nombre: 'Administrador', email: 'admin@example.com', password: 'Admin1234', rol: 'admin' },
  { id: 2, nombre: 'Ana García', email: 'ana@example.com', password: 'Ana12345', rol: 'usuario' },
  { id: 3, nombre: 'Luis Pérez', email: 'luis@example.com', password: 'Luis12345', rol: 'usuario' },
];

export function usuariosIniciales(rondas) {
  const usuarios = [];
  for (const u of usuariosDemo) {
    usuarios.push({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      passwordHash: bcrypt.hashSync(u.password, rondas),
      rol: u.rol,
    });
  }
  return usuarios;
}
