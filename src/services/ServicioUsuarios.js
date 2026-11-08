// Servicio de usuarios: registro y autenticación con bcrypt.
import bcrypt from 'bcrypt';
import { validarRegistro } from '../domain/reglas.js';
import { ErrorCredenciales, ErrorValidacion } from '../domain/Errores.js';

export class ServicioUsuarios {
  constructor(repoUsuarios, rondasBcrypt) {
    this.repoUsuarios = repoUsuarios;
    this.rondas = rondasBcrypt;
    // Hash falso: se compara cuando el correo no existe, para tardar lo mismo
    // y no delatar (por tiempo de respuesta) qué correos están registrados.
    this.hashFalso = bcrypt.hashSync('contrasena-falsa', rondasBcrypt);
  }

  async registrar(datos) {
    const { valido, errores, valores } = validarRegistro(datos);
    if (!valido) throw new ErrorValidacion(errores);

    if (this.repoUsuarios.buscarPorEmail(valores.email)) {
      throw new ErrorValidacion({ email: 'Ese correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(valores.password, this.rondas);
    // El registro público SIEMPRE crea rol "usuario"
    const usuario = this.repoUsuarios.crear({
      nombre: valores.nombre,
      email: valores.email,
      passwordHash,
      rol: 'usuario',
    });
    return this.sinHash(usuario);
  }

  async autenticar(email, password) {
    const correo = String(email ?? '').trim().toLowerCase();
    const clave = String(password ?? '');
    if (!correo || !clave) {
      throw new ErrorValidacion({ general: 'Introduce tu correo y tu contraseña' });
    }

    const usuario = this.repoUsuarios.buscarPorEmail(correo);
    const coincide = await bcrypt.compare(clave, usuario ? usuario.passwordHash : this.hashFalso);
    if (!usuario || !coincide) throw new ErrorCredenciales(); // mismo error en ambos casos
    return this.sinHash(usuario);
  }

  obtenerPorId(id) {
    const usuario = this.repoUsuarios.buscarPorId(id);
    return usuario ? this.sinHash(usuario) : undefined;
  }

  // Nunca sacamos el hash de esta capa hacia fuera
  sinHash(usuario) {
    const { id, nombre, email, rol } = usuario;
    return { id, nombre, email, rol };
  }
}
