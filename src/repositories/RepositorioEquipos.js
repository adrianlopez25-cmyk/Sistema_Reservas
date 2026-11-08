// Repositorio: único sitio que toca la colección de equipos (en memoria).
export class RepositorioEquipos {
  constructor(datosIniciales = []) {
    this.equipos = datosIniciales.map((e) => ({ ...e }));
  }

  todos() {
    return [...this.equipos];
  }

  buscarPorId(id) {
    return this.equipos.find((e) => e.id === id);
  }

  buscarPorCodigo(codigo) {
    return this.equipos.find((e) => e.codigo.toLowerCase() === codigo.toLowerCase());
  }

  crear(datos) {
    const nuevo = { id: this.siguienteId(), ...datos };
    this.equipos.push(nuevo);
    return nuevo;
  }

  actualizarEstado(id, estado) {
    const equipo = this.buscarPorId(id);
    if (equipo) equipo.estado = estado;
    return equipo;
  }

  siguienteId() {
    return this.equipos.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }
}
