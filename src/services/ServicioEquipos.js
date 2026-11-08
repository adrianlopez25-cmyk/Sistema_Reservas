// Servicio de equipos: reglas de negocio del catálogo. No conoce req/res/EJS.
import { ESTADOS_EQUIPO, validarEquipo } from '../domain/reglas.js';
import { ErrorNoEncontrado, ErrorValidacion } from '../domain/Errores.js';

export class ServicioEquipos {
  constructor(repoEquipos) {
    this.repoEquipos = repoEquipos;
  }

  // Filtra por tipo y/o solo operativos
  listar({ tipo, soloOperativos = false } = {}) {
    return this.repoEquipos
      .todos()
      .filter((e) => !tipo || e.tipo === tipo)
      .filter((e) => !soloOperativos || e.estado === 'operativo');
  }

  obtener(id) {
    const equipo = this.repoEquipos.buscarPorId(id);
    if (!equipo) throw new ErrorNoEncontrado('El equipo no existe');
    return equipo;
  }

  crear(datos) {
    const { valido, errores, valores } = validarEquipo(datos);
    if (!valido) throw new ErrorValidacion(errores);
    if (this.repoEquipos.buscarPorCodigo(valores.codigo)) {
      throw new ErrorValidacion({ codigo: 'Ya existe un equipo con ese código' });
    }
    return this.repoEquipos.crear(valores);
  }

  cambiarEstado(id, estado) {
    if (!ESTADOS_EQUIPO.includes(estado)) {
      throw new ErrorValidacion({ estado: 'El estado no es válido' });
    }
    this.obtener(id); // lanza 404 si no existe
    return this.repoEquipos.actualizarEstado(id, estado);
  }
}
