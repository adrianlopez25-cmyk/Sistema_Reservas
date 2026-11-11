# Sistema de reserva de equipos informáticos (DWES – UD 2 y 3)

Aplicación web con Node.js, Express, EJS y JavaScript (más un núcleo en TypeScript) para reservar equipos de un centro educativo. Los datos viven en memoria; el acceso se hace mediante repositorios.

## 1. Instalación, configuración y ejecución

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env        # en Windows (cmd): copy .env.example .env
```

Edita `.env` y pon un `SESSION_SECRET` propio (mínimo 16 caracteres). La app valida `PORT`, `NODE_ENV` y `SESSION_SECRET` al arrancar y se niega a iniciar si son incorrectos.

```bash
npm start        # http://localhost:3000
npm run dev      # reinicia al guardar cambios
```

> En `NODE_ENV=production` la cookie de sesión es `secure` (solo viaja por HTTPS), por lo que no funcionará en `http://localhost`. Para desarrollar usa `development`.

### Usuarios de prueba (solo demo)

| Rol | Correo | Contraseña |
|---|---|---|
| admin | admin@example.com | Admin1234 |
| usuario | ana@example.com | Ana12345 |
| usuario | luis@example.com | Luis12345 |

## 2. TypeScript y pruebas

```bash
npm run build:ts   # compila src-ts/ a dist-ts/ con strict: true
npm run demo:ts    # ejecuta una demo del núcleo tipado
npm test           # Vitest + Supertest (no hace falta arrancar el servidor)
```

## 3. Estructura

```
src/config.js        Variables de entorno validadas
src/app.js           Construye la app Express (sin abrir puerto)
src/server.js        Abre el puerto
src/domain/          Errores de dominio, datos iniciales y reglas puras (estaReservado, validarReserva...)
src/repositories/    Acceso a las colecciones en memoria
src/services/        Reglas de negocio (sin req/res/EJS)
src/controllers/     Reciben la petición, llaman al servicio y deciden la respuesta HTTP
src/routes/          Método + URL + middleware
src/middleware/      Autenticación, roles, CSRF, rate limit, errores
src/presentation/    Helpers de vistas y modelo de vista del formulario de reservas
src-ts/              Núcleo de reservas tipado (TypeScript)
views/               Plantillas EJS (parciales: cabecera, pie, navegacion, errores, csrf)
tests/               Pruebas automatizadas
```

## 4. Cómo se ha implementado cada funcionalidad

- **Consulta de equipos** (`GET /equipos`, `/equipos/:id`): filtros `tipo` y `operativos` en `ServicioEquipos.listar`. La ficha es `detalle-equipo.ejs`.
- **Registro/login/logout/perfil**: contraseñas con bcrypt; el registro público siempre crea rol `usuario`. En el login se regenera el id de sesión y solo se guarda `userId`. El logout destruye la sesión y borra la cookie `sid`. El mensaje de error es el mismo exista o no el correo (y se compara contra un hash falso para no delatarlo por el tiempo de respuesta).
- **Crear reserva** (`GET /reservas/nueva`, `POST /reservas`): el formulario ofrece solo equipos disponibles para la fecha y turno elegidos (nueva petición GET). El servidor repite todas las comprobaciones (`ServicioReservas.crear`): id, equipo existente, operativo, fecha válida y no pasada, turno válido y sin conflicto (409). El usuario sale de la sesión. Éxito: 303 (PRG) + mensaje flash de un solo uso. Error: se repinta el formulario conservando los valores.
- **Mis reservas / cancelar**: la cancelación cambia el estado a `cancelada` (no borra). Un usuario solo cancela las suyas (403 si no) y solo si la fecha no ha pasado. Una reserva cancelada no bloquea nuevas reservas.
- **Administración** (`/admin/*`): `requiereRol('admin')` protege todo el router. Anónimo → 303 a login; usuario sin permiso → 403.
- **Cookies y sesiones**: cookie `tipoPreferido` (preferencia de filtro, validada al leerla, nunca usada para permisos) y sesión `sid` con `httpOnly`, `secure` (en producción), `sameSite: lax`, `maxAge` 1 h.
- **Seguridad**: middleware de auth y roles, comprobación de propiedad en el servicio, CSRF con token de sesión en todos los POST (incluido logout), `express-rate-limit` en `POST /login` (5 intentos/15 min → 429), validación en `domain/reglas.js` y errores centralizados en `errorHandler.js` (sin trazas ni datos internos).
- **Escape**: las vistas usan `<%= %>` (escapa HTML); no se usa `<%- %>` con datos del usuario.

## 5. Ejemplos con curl (Linux, macOS, Git Bash o WSL)

Con el servidor en marcha. Se guardan las cookies en `cookies.txt` (`-c` escribe, `-b` envía) y se extrae el token CSRF de cada formulario antes de enviarlo.

```bash
BASE=http://localhost:3000
J=cookies.txt; rm -f $J
# Función: pide una página y extrae el token CSRF (también mantiene la cookie de sesión)
token() { curl -s -b $J -c $J "$BASE$1" | sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' | head -1; }
```

**Consulta de equipos (público)**
```bash
curl -s "$BASE/equipos"
curl -s "$BASE/equipos?tipo=portatil&operativos=true"
curl -s "$BASE/equipos/1"                 # 404 si no existe
curl -s -c $J "$BASE/equipos?tipo=sobremesa" -o /dev/null   # guarda la cookie de preferencia
```

**Registro**
```bash
T=$(token /registro)
curl -i -b $J -c $J --data-urlencode "_csrf=$T" --data-urlencode "nombre=Marta Ruiz" --data-urlencode "email=marta@example.com" --data-urlencode "password=Marta12345" $BASE/registro   # 303
```

**Login (401 si falla, 303 si acierta). Después de entrar hay que pedir un token nuevo: la sesión se regenera**
```bash
T=$(token /login)
curl -i -b $J -c $J -d "_csrf=$T&email=ana@example.com&password=Ana12345" $BASE/login
curl -i -b $J $BASE/perfil                # 200 con sesión; 303 a /login sin ella
```

**Crear reserva** (409 si está ocupada, 400 si hay datos incorrectos)
```bash
curl -s -b $J "$BASE/reservas/nueva?fecha=2030-05-20&turno=tarde"      # equipos disponibles
T=$(token /reservas/nueva)
curl -i -b $J -c $J -d "_csrf=$T&equipoId=2&fecha=2030-05-20&turno=tarde" $BASE/reservas   # 303
```

**Mis reservas y cancelar** (403 si la reserva es de otro usuario)
```bash
curl -s -b $J -c $J $BASE/mis-reservas
T=$(token /mis-reservas)
curl -i -b $J -c $J -d "_csrf=$T" $BASE/reservas/4/cancelar          # usa el id de tu reserva
```

**Administración** (entra primero como admin@example.com / Admin1234)
```bash
T=$(token /admin/equipos)
curl -i -b $J -c $J --data-urlencode "_csrf=$T" --data-urlencode "codigo=PC-010" --data-urlencode "nombre=Aula 3" -d "tipo=sobremesa&estado=operativo" $BASE/admin/equipos
curl -i -b $J -c $J -d "_csrf=$T&estado=fuera_de_servicio" $BASE/admin/equipos/1/estado
curl -s -b $J $BASE/admin/reservas
T=$(token /admin/reservas)
curl -i -b $J -c $J -d "_csrf=$T" $BASE/admin/reservas/1/cancelar
```

**Logout** (destruye la sesión; después `/perfil` redirige a login)
```bash
T=$(token /perfil)
curl -i -b $J -c $J -d "_csrf=$T" $BASE/logout
```

**Comprobar la protección CSRF** (sin token → 403)
```bash
curl -i -b $J -d "estado=fuera_de_servicio" $BASE/admin/equipos/1/estado
```

Todas las operaciones de usuario anteriores tienen su formulario HTML en la web (login, registro, nueva reserva, mis reservas, administración, logout).

## 6. Uso de inteligencia artificial

Historial de conversación con la IA: https://gemini.google.com/app/321696577ec6e966?hl=es-ES

