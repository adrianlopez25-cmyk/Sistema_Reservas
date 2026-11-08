// server.js: único sitio donde se abre el puerto HTTP.
import { config } from './config.js';
import { crearApp } from './app.js';

const app = crearApp(config);

app.listen(config.port, () => {
  console.log(`Servidor escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});
