// Repositorio de usuarios (en memoria).
export class RepositorioUsuarios {
  constructor(datosIniciales = []) {
    this.usuarios = datosIniciales.map((u) => ({ ...u }));
  }

  buscarPorId(id) {
    return this.usuarios.find((u) => u.id === id);
  }

  buscarPorEmail(email) {
    return this.usuarios.find((u) => u.email === email);
  }

  crear(datos) {
    const nuevo = { id: this.siguienteId(), ...datos };
    this.usuarios.push(nuevo);
    return nuevo;
  }

  siguienteId() {
    return this.usuarios.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  }
}
