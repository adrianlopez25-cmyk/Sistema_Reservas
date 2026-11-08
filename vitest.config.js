import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // Variables de entorno de prueba: no hace falta .env para ejecutar los tests
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'secreto-solo-para-pruebas-123456',
    },
  },
});
