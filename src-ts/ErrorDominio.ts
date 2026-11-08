// Error de dominio tipado: lleva un código para distinguir cada situación prevista.
export type CodigoError = "RESERVA_DUPLICADA" | "NO_ENCONTRADA" | "SIN_PERMISOS" | "YA_CANCELADA";

export class ErrorDominio extends Error {
  readonly codigo: CodigoError;

  constructor(mensaje: string, codigo: CodigoError) {
    super(mensaje);
    this.name = "ErrorDominio";
    this.codigo = codigo;
  }
}
