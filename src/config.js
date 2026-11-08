// Configuración de la aplicación: lee variables de entorno y las VALIDA al arrancar.
import dotenv from 'dotenv';

dotenv.config(); // Carga el archivo .env (si existe) en process.env

const ENTORNOS = ['development', 'production', 'test'];
const SECRETO_EJEMPLO = 'cambia-este-valor-por-un-secreto-largo';

export function cargarConfig(env = process.env) {
  const errores = [];

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errores.push('PORT debe ser un número entero entre 1 y 65535');
  }

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!ENTORNOS.includes(nodeEnv)) {
    errores.push(`NODE_ENV debe ser uno de: ${ENTORNOS.join(', ')}`);
  }

  const secreto = env.SESSION_SECRET;
  if (!secreto || secreto.length < 16 || secreto === SECRETO_EJEMPLO) {
    errores.push('SESSION_SECRET debe definirse (mínimo 16 caracteres) y no puede ser el valor de .env.example');
  }

  if (errores.length > 0) {
    throw new Error('Configuración inválida:\n- ' + errores.join('\n- '));
  }

  return {
    port,
    nodeEnv,
    sessionSecret: secreto,
    produccion: nodeEnv === 'production',
    // En tests usamos valores pequeños para que vayan rápido
    rondasBcrypt: nodeEnv === 'test' ? 4 : 10,
    maxIntentosLogin: nodeEnv === 'test' ? 1000 : 5,
  };
}

export const config = cargarConfig();
