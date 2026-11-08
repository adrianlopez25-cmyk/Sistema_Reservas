# Guía para entender el proyecto (y qué preguntarle a la IA)

Está pensada para que puedas explicar y modificar todo el código en la evaluación.

## 1. La idea en una imagen

Una petición del navegador recorre siempre las mismas capas, de fuera hacia dentro:

```
Navegador → app.js (middleware) → ROUTES → CONTROLLER → SERVICE → REPOSITORY (datos)
                                                  ↓
                                               VIEW (EJS) → respuesta HTML
```

| Capa | Pregunta que responde | Qué NO debe hacer |
|---|---|---|
| Routes | ¿Qué URL y método? ¿Qué middleware pasa antes? | Lógica |
| Controller | ¿Qué datos llegan? ¿Qué respondo (200, 303, 400...)? | Reglas de negocio |
| Service | ¿Se puede hacer esto? (reglas) | Usar `req`, `res` o EJS |
| Repository | ¿Dónde se guardan y buscan los datos? | Reglas |
| View | ¿Cómo se ve? | Decidir nada importante |

Truco para la defensa: si te piden "añade una regla nueva", casi siempre va en **`src/services`** o **`src/domain/reglas.js`**.

## 2. Orden recomendado de lectura

1. `src/domain/Errores.js` y `src/domain/modelos.js`
2. `src/domain/reglas.js`
3. `src/repositories/*`
4. `src/services/*`
5. `src/middleware/*`
6. `src/controllers/*` y `src/routes/*`
7. `src/app.js` y `src/server.js`
8. `views/*`
9. `src-ts/*`
10. `tests/*`

## 3. Explicación archivo por archivo

### `src/config.js`
Lee `PORT`, `NODE_ENV` y `SESSION_SECRET` de `process.env` (`dotenv` carga el archivo `.env`) y los **valida al arrancar**: si falta el secreto o el puerto no es un número, lanza un error y el servidor no arranca. Así nunca se ejecuta con una configuración rota. También decide valores según el entorno (en `test`, bcrypt usa menos rondas para ir rápido).
*Por qué:* el PDF exige variables de entorno validadas y secretos fuera del código.

### `src/domain/Errores.js`
Una clase base `ErrorDominio` con un `status` HTTP, y subclases (`ErrorValidacion` 400, `ErrorCredenciales` 401, `ErrorPermisos` 403, `ErrorNoEncontrado` 404, `ErrorConflicto` 409, `ErrorDemasiadasPeticiones` 429).
*Por qué:* los servicios no conocen HTTP; lanzan "reserva duplicada" y la capa web ya sabe que eso es un 409. Distingue errores **previstos** (los del dominio) de **fallos reales** (500).

### `src/domain/modelos.js`
Los datos de arranque: 3 equipos, 3 reservas y 3 usuarios (un admin). Las contraseñas se convierten con `bcrypt.hashSync`; nunca hay contraseñas en claro en las colecciones.

### `src/domain/reglas.js` (la más importante para el profesor)
Funciones **puras** (no usan `req`/`res`):
- `estaReservado(equipoId, fecha, turno, reservas)` → usa `some()`: ¿hay una reserva **activa** igual? Las canceladas no cuentan, por eso una cancelación libera el hueco.
- `obtenerEquiposDisponibles(equipos, reservas, fecha, turno)` → usa `filter()`: operativos y no reservados.
- `validarReserva(datos)` → comprueba id, fecha (formato, que exista y que no sea pasada) y turno. Devuelve `{ valido, errores, valores }`.
- `validarRegistro`, `validarEquipo`, `validarFechaTurno`, `parsearId`, `fechaHoy`.
*Por qué:* todo lo que sean "reglas" se puede probar sin servidor y se modifica en un solo sitio.

### `src/repositories/*`
Tres clases que guardan un array y ofrecen métodos (`buscarPorId` con `find()`, `buscarPorUsuario` con `filter()`, `crear`, `cambiarEstado`...). El resto de la app **nunca** toca los arrays directamente. Si mañana usaras una base de datos, solo cambiarías esta capa.

### `src/services/*`
- `ServicioEquipos`: listar con filtros, obtener (404 si no existe), crear, cambiar estado.
- `ServicioReservas`: `crear` (valida → existe equipo → operativo → no duplicado), `cancelar` (existe → **propiedad** → no cancelada → fecha no pasada), `listarDeUsuario`, `listarTodas` (con `map()` añade nombre del equipo y si es cancelable).
- `ServicioUsuarios`: `registrar` (rol siempre `usuario`, hash con bcrypt) y `autenticar` (mismo error si el correo no existe o la clave falla).
*Por qué:* el PDF pide que disponibilidad, conflictos y cancelaciones estén aquí y no en rutas o vistas.

### `src/middleware/*`
- `authMiddleware.js`: `cargarUsuario` lee `session.userId` y busca al usuario real; `requiereAuth` (anónimo → 303 al login); `requiereRol('admin')` (anónimo → 303, sin permiso → 403).
- `csrfMiddleware.js`: crea un token aleatorio por sesión y, en cada POST, comprueba que el formulario lo trae. Sin él → 403. Evita que otra web envíe formularios en nombre del usuario.
- `rateLimiters.js`: máximo de intentos de login por IP en 15 min (429).
- `errorHandler.js`: único punto donde se convierten errores en páginas. Los errores desconocidos muestran "Error interno" sin trazas; el detalle va a la consola del servidor.

### `src/controllers/*`
Cada función hace: leer `req` → llamar al servicio → responder. Patrones a reconocer:
- **PRG** (Post/Redirect/Get): tras un POST correcto, `res.redirect(303, ...)` para que F5 no repita la operación.
- **Flash**: `req.session.flash = {...}` antes de redirigir; `app.js` lo pasa a la vista y lo borra (un solo uso).
- En errores de formulario: se repinta la vista con el código del error y los valores escritos (sin contraseñas).
- `equiposController`: gestiona la **cookie de preferencias** (`tipoPreferido`) y la valida antes de usarla.
- `reservasController`: el usuario sale de `req.usuario` (sesión), nunca del body.

### `src/routes/*`
Solo lista de `router.get/post(url, middleware, controlador)`. `adminRoutes` aplica `requiereRol('admin')` a todo el router con `router.use`.

### `src/app.js` y `src/server.js`
`app.js` monta todo en orden: repositorios → servicios → controladores → middleware → rutas → manejo de errores. **El orden de los `app.use` importa** (la sesión antes de leer el usuario, el CSRF después de leer el body, el 404 y el errorHandler al final). `server.js` solo hace `listen`; por eso los tests importan `crearApp()` sin abrir un puerto.
Sesión: `httpOnly` (JS no la lee), `secure` (solo HTTPS en producción), `sameSite: 'lax'` (frena envíos cruzados), `maxAge` (caduca en 1 h).

### `src/presentation/*`
`helpers.js`: textos legibles ("Fuera de servicio"), promesas sobre los métodos de sesión (`regenerate`, `save`, `destroy`) y `renderizarConError`. `reservasVM.js`: el **modelo de vista** del formulario de reservas: convierte datos del servicio en lo que la vista necesita (opciones del select, turnos, valores conservados).

### `views/*` (EJS)
`<%= x %>` **escapa** el HTML (seguro); `<%- x %>` no (solo para incluir parciales). Parciales: `cabecera`, `pie`, `navegacion`, `errores`, `csrf`. El formulario de reserva tiene dos pasos: un GET para elegir fecha/turno y ver equipos libres, y un POST para reservar uno.

### `src-ts/*`
Núcleo tipado independiente: `modelos.ts` (interfaces y tipos unión), `RepositorioReservas.ts` (interfaz), `RepositorioReservasMemoria.ts` (clase con `Map`), `ServicioReservas.ts` (recibe el repositorio por constructor = **inyección de dependencias**), `ErrorDominio.ts`, `demo.ts`. Compila con `strict: true` sin `any`.

### `tests/*`
Cada test usa una app nueva (`crearApp()`), así los datos son controlados y no se contaminan entre sí. Un `agent` de Supertest guarda las cookies como un navegador; `obtenerToken` extrae el CSRF del HTML. Los 10 tests del PDF están en `auth`, `reservas` y `admin`; `reglas.test.js` es extra.

## 4. Preguntas para hacerle a la IA (y guardar en el historial)

El profesor evalúa tu historial, así que **usa la IA para entender**, no solo para pedir código. Ejemplos:

**Arquitectura**
1. ¿Por qué separar rutas, controladores, servicios y repositorios? Dame un ejemplo de qué pasaría si pongo la regla de "reserva duplicada" dentro de la ruta.
2. ¿Por qué `app.js` y `server.js` están separados y cómo ayuda eso a Supertest?
3. ¿Qué significa que un servicio "no dependa de req ni res"? ¿Cómo lo compruebo en mi código?

**Sesiones, cookies y seguridad**
4. Explícame qué hace `req.session.regenerate()` en el login y qué ataque evita (session fixation).
5. ¿Qué diferencia hay entre `httpOnly`, `secure` y `sameSite`? ¿Qué pasaría si quito cada uno?
6. ¿Por qué la cookie de preferencias no puede usarse para decidir permisos? ¿Cómo la manipularía un atacante?
7. Explícame CSRF con un ejemplo concreto de mi app (el logout o el cambio de estado) y cómo lo evita el token.
8. ¿Por qué el mensaje de error del login es el mismo si el correo no existe? ¿Para qué sirve comparar contra un hash falso?
9. ¿Por qué se guarda solo `userId` en la sesión y no el objeto usuario completo?
10. ¿Por qué un usuario puede intentar cancelar una reserva ajena cambiando el id en la URL y dónde lo impide mi código?

**Flujo HTTP**
11. ¿Qué es el patrón PRG y por qué uso 303 en vez de 200 tras un POST?
12. ¿Cuándo uso 400, 401, 403, 404 y 409? Pon un ejemplo de cada uno en mi proyecto.
13. ¿Cómo funciona el mensaje "flash" de un solo uso paso a paso?

**JavaScript y TypeScript**
14. ¿Qué hacen `find`, `filter`, `map` y `some` en `reglas.js`? Reescribe `estaReservado` con un `for` para comparar.
15. ¿Qué es un tipo unión y qué error me daría el compilador si escribo `turno: "noche"`?
16. ¿Qué es la inyección de dependencias en `ServicioReservas.ts` y qué ventaja tiene sobre crear el repositorio dentro de la clase?
17. ¿Por qué usar `Map` en el repositorio en vez de un array?

**Pruebas**
18. ¿Cómo funciona `request.agent` y por qué lo necesito para probar sesiones?
19. ¿Cómo extraigo el token CSRF del HTML en los tests?

**Práctica para la defensa (cambios sencillos)**
20. Quiero añadir un tercer turno "noche". ¿Qué archivos tengo que tocar? (pista: `TURNOS` en `reglas.js` y `etiquetaTurno`).
21. Quiero que un usuario no pueda tener más de 2 reservas activas. ¿En qué capa lo pongo y cómo lo pruebo?
22. Quiero que el admin pueda reservar para otro usuario. ¿Qué parte de la seguridad debo cuidar?

> Consejo: pregunta primero, lee la respuesta, **intenta tú el cambio** y luego pide que revise tu solución. Eso queda muy bien en el historial.

## 5. Cambios típicos que puede pedirte el profesor

| Cambio | Dónde |
|---|---|
| Añadir un turno | `TURNOS` y `etiquetaTurno` |
| Cambiar la contraseña mínima | `validarRegistro` en `reglas.js` |
| Nuevo filtro en el catálogo | `ServicioEquipos.listar` + formulario de `index.ejs` |
| Cambiar duración de la sesión | `maxAge` en `app.js` |
| Cambiar intentos de login | `maxIntentosLogin` en `config.js` |
| Nuevo estado de reserva | `etiquetaEstado` + `ServicioReservas` |
| Nuevo campo de equipo | `validarEquipo`, `admin-equipos.ejs`, vistas de listado |
