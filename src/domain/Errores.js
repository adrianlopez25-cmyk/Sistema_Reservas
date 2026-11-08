// Errores de dominio: representan situaciones PREVISTAS (no fallos del servidor).
// Cada uno lleva el código HTTP que le corresponde.

export class ErrorDominio extends Error {
  constructor(mensaje, status = 400, errores = null) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
    this.errores = errores; // objeto { campo: 'mensaje' } para mostrar en formularios
  }
}

// 400: datos incorrectos
export class ErrorValidacion extends ErrorDominio {
  constructor(errores, mensaje = 'Hay datos incorrectos en el formulario') {
    super(mensaje, 400, errores);
  }
}

// 401: credenciales incorrectas (mensaje genérico: no revela si el correo existe)
export class ErrorCredenciales extends ErrorDominio {
  constructor() {
    super('Correo o contraseña incorrectos', 401);
  }
}

// 403: autenticado pero sin permisos
export class ErrorPermisos extends ErrorDominio {
  constructor(mensaje = 'No tienes permisos para realizar esta acción') {
    super(mensaje, 403);
  }
}

// 404: el recurso no existe
export class ErrorNoEncontrado extends ErrorDominio {
  constructor(mensaje = 'El recurso solicitado no existe') {
    super(mensaje, 404);
  }
}

// 409: conflicto (p. ej. equipo ya reservado en ese turno)
export class ErrorConflicto extends ErrorDominio {
  constructor(mensaje = 'La operación entra en conflicto con el estado actual') {
    super(mensaje, 409);
  }
}

// 429: demasiados intentos de login
export class ErrorDemasiadasPeticiones extends ErrorDominio {
  constructor() {
    super('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.', 429);
  }
}
