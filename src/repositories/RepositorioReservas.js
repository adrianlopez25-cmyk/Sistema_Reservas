// Repositorio de reservas (en memoria).
export class RepositorioReservas {
  constructor(datosIniciales = []) {
    this.reservas = datosIniciales.map((r) => ({ ...r }));
  }

  todas() {
    return [...this.reservas];
  }

  buscarPorId(id) {
    return this.reservas.find((r) => r.id === id);
  }

  buscarPorUsuario(usuarioId) {
    return this.reservas.filter((r) => r.usuarioId === usuarioId);
  }

  crear(datos) {
    const nueva = { id: this.siguienteId(), ...datos };
    this.reservas.push(nueva);
    return nueva;
  }

  // Cancelar = cambiar el estado. NUNCA se borra el registro.
  cambiarEstado(id, estado) {
    const reserva = this.buscarPorId(id);
    if (reserva) reserva.estado = estado;
    return reserva;
  }

  siguienteId() {
    return this.reservas.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  }
}
