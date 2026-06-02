# Auditoría de Integración — Ecosistema USPG

**Fecha:** 2026-06-01  
**Auditor:** Arquitecto Senior (Claude)  
**Stack:** Next.js + PostgreSQL + Prisma  
**Rama auditada:** `main`

---

## Contexto

Sistema universitario multi-módulo. Regla central del proyecto:

> **"El alumno es único y debe ingresarse en solo un sistema."**
> `grupo1_academico.Alumno` es la fuente de verdad.  
> Todos los módulos deben referenciar al alumno de académico. NO crear sus propias tablas de usuario.

### Identidad maestra actual

El login unificado (`/api/auth/login`) emite un JWT con:

```
sub   = UUID de grupo5_parqueo.User   ← identidad maestra
email = correo del usuario
name  = nombre completo
role  = ADMIN | SECURITY | TEACHER | STUDENT
source = "uspg"
```

Al primer login de un alumno o catedrático académico, se crea automáticamente un registro en `grupo5_parqueo.User` y se escribe su UUID en `Alumno.parqueo_user_id` / `CatedraticoAcademico.parqueo_user_id`.

---

## Módulos Desarrollados

---

### Módulo 1 — Sistema Académico (Grupo 1)

#### 1. ¿Referencia al alumno de académico o tiene tabla propia?
Es la **fuente de verdad**. `grupo1_academico.Alumno` es la tabla canónica del alumno. Tiene columna `parqueo_user_id` como puente hacia `grupo5_parqueo.User`.

```
grupo1_academico.Alumno
  ├── id (PK, integer, autoincrement)
  ├── carnet (unique)
  ├── nombre, apellido, email
  ├── password (bcrypt)
  ├── carreraId → Carrera.id
  └── parqueo_user_id → grupo5_parqueo.User.id  ← puente
```

#### 2. ¿Qué le falta para integrarse correctamente?
- El `parqueo_user_id` se llena **lazy** (solo en el primer login). Si un alumno nunca hace login, no tiene puente y otros módulos no pueden encontrarlo.
- No expone un endpoint público `GET /api/alumno/{id}` o `GET /api/alumno?email=X` para que otros módulos consulten datos del alumno sin duplicarlos.
- Las tablas `Asignacion`, `Asistencia` y `SolicitudInscripcion` existen pero no hay evidencia de consumo externo desde otros módulos.

#### 3. ¿Tiene login propio?
No. Usa el login unificado en `/api/auth/login`. ✅

#### 4. Caso Carlos Pérez (`est001@uspg.edu.gt`)
Login → JWT generado con `sub = parqueo_user_id`, `role = STUDENT`. Su `parqueo_user_id` se escribe en `Alumno` en ese mismo request. **Funciona correctamente.**

---

### Módulo 2 — Laboratorios (Grupo 3)

#### 1. ¿Referencia al alumno de académico o tiene tabla propia?
❌ **Tiene su propia tabla:** `grupo3_laboratorios.usuario`

```
grupo3_laboratorios.usuario
  ├── id (text, PK)
  ├── correo (unique)
  ├── nombre, apellido
  ├── rol (ESTUDIANTE | TECNICO | ADMINISTRADOR)
  ├── categoria, carrera
  ├── sancionado (boolean)
  └── parqueo_user_id  ← columna añadida pero NUNCA USADA
```

La tabla está **vacía en producción** (0 registros). Tiene `parqueo_user_id` añadido como columna pero ningún código la lee ni la escribe.

#### 2. ¿Qué le falta para integrarse correctamente?
- **El módulo ignora por completo el JWT del usuario logueado.** `LaboratoriosDashboard.js` no tiene ninguna línea que lea `localStorage` ni cookies.
- La modal `NuevaReservaModal` tiene `<select name="usuarioId">` — el usuario se selecciona manualmente de un dropdown, no se infiere del JWT. Cualquiera podría reservar en nombre de otro.
- `reserva.usuario_id` apunta a `grupo3_laboratorios.usuario.id`, no al UUID de parqueo ni al carnet académico.
- No hay ningún `import prismaAcademico` en el módulo — está completamente desconectado de la BD académica.
- Para integrarse correctamente: al montar el componente leer `sub` del JWT, usarlo como `usuario_id` en reservas, y mapear `grupo3_laboratorios.usuario` a `grupo5_parqueo.User` o eliminarlo.

#### 3. ¿Tiene login propio?
No tiene formulario de login separado visible. El módulo carga bajo el shell protegido por JWT. Pero internamente **no lee la identidad del JWT** — el usuario logueado es invisible para el módulo.

#### 4. Caso Carlos Pérez (`est001@uspg.edu.gt`)
Hace login → entra al módulo → **el módulo no sabe que es Carlos Pérez**. Para hacer una reserva tendría que seleccionarse de un dropdown (la tabla de usuarios está vacía). En la práctica: **no puede hacer ninguna reserva**. El módulo es operable solo por un administrador que cargue datos directamente.

---

### Módulo 3 — Parqueo (Grupo 5)

#### 1. ¿Referencia al alumno de académico o tiene tabla propia?
⚠️ Tiene su propia tabla `grupo5_parqueo.User`, pero está diseñada intencionalmente como **identidad maestra del ecosistema**, no como duplicación. El login unificado crea registros aquí automáticamente para alumnos y catedráticos académicos al primer login.

```
grupo5_parqueo.User
  ├── id (UUID, PK)  ← sub del JWT
  ├── email, first_name, last_name
  ├── role (ADMIN | SECURITY | TEACHER | STUDENT)
  ├── password_hash (bcrypt)
  └── qr_code, is_active, last_login_at, etc.

Vehicle, ParkingSubscription, Reservation, Payment
  └── todos referencian → grupo5_parqueo.User.id  ✅
```

#### 2. ¿Qué le falta para integrarse correctamente?
- Falta que los módulos restantes (G3, G9) adopten `parqueo_user_id` como FK estándar en lugar de crear sus propias tablas.
- No hay endpoint que exporte la lista de usuarios para consumo externo.
- Si un alumno nunca hace login, no existe en `grupo5_parqueo.User` y G3/G9 no pueden referenciarlo.

#### 3. ¿Tiene login propio?
No. El login propio de parqueo fue eliminado en refactor previo. Usa el login unificado. ✅

#### 4. Caso Carlos Pérez (`est001@uspg.edu.gt`)
Hace login → JWT con `sub = UUID de grupo5_parqueo.User` → puede ver su vehículo, cuotas, historial de ingresos. **Funciona correctamente.** ✅

---

### Módulo 4 — Otras Actividades (Grupo 9)

#### 1. ¿Referencia al alumno de académico o tiene tabla propia?
❌ No tiene tabla de usuarios en BD. Solo existe `grupo9_otras_actividades.actividad`. El campo `inscritos` es un `text[]` — array de emails guardado directo en la fila de la actividad:

```
grupo9_otras_actividades.actividad
  ├── id, codigo, nombre, tipo, modalidad
  ├── inscritos  text[]   ← array de emails, SIN FK, SIN integridad referencial
  ├── creador    text     ← texto libre, no FK
  └── aprobador  text     ← texto libre, no FK
```

Sin FK no hay integridad: un email puede ser de un usuario eliminado, mal escrito, o ficticio.

#### 2. ¿Qué le falta para integrarse correctamente?
- Reemplazar `inscritos text[]` por tabla de relación:
  ```sql
  InscripcionActividad(
    actividad_id  → actividad.id,
    user_id       → grupo5_parqueo.User.id,
    inscrito_at   timestamp
  )
  ```
- `creador` y `aprobador` deben ser FKs al UUID de `grupo5_parqueo.User`, no texto libre.
- Sin tabla de relación no se puede: paginar inscripciones, filtrar por alumno, emitir certificados con datos reales, ni auditar quién se inscribió cuándo.
- Eliminar el login interno hardcodeado y leer la sesión del JWT unificado.

#### 3. ¿Tiene login propio?
❌ **SÍ. Tiene login interno hardcodeado.** En `page.js` existe un array de usuarios ficticios con contraseñas en texto plano:

```js
// webapp/src/app/otras-actividades/page.js  líneas 93-95
{ email: "alumno@uspg.edu.gt",  password: "123456",    nombre: "Ana Lopez",     rol: "alumno" }
{ email: "evento@uspg.edu.gt",  password: "123456",    nombre: "Luis Perez",    rol: "event-creaator" }
{ email: "admin@uspg.edu.gt",   password: "admin123",  nombre: "Carlos Mendez", rol: "admin-eventos" }
```

El módulo tiene un formulario de login interno (`accesoModulo` state, `sesionModulo` state). La sesión es una variable React en memoria — se pierde al recargar la página. El JWT del sistema existe y se lee como fallback parcial, pero la lógica de roles y permisos depende de `sesionModulo`, no del JWT.

#### 4. Caso Carlos Pérez (`est001@uspg.edu.gt`)
Hace login en el sistema → entra al módulo → ve un segundo formulario de login interno → sus credenciales reales (`est001@uspg.edu.gt` / `Student123`) **no funcionan** — no están en el array hardcodeado. Debe usar `alumno@uspg.edu.gt` / `123456`. **Carlos Pérez no puede usar este módulo con su identidad real.**

---

## Tabla Resumen

| Módulo | Usa alumno de académico | Tiene login propio | Estado de integración |
|---|---|---|---|
| Sistema Académico (G1) | ✅ Es la fuente de verdad | ❌ No (usa unificado) | **Bien — necesita exponer API pública** |
| Laboratorios (G3) | ❌ Tabla propia vacía, JWT ignorado | ❌ No (pero tampoco lo lee) | **Roto — usuario logueado invisible al módulo** |
| Parqueo (G5) | ⚠️ Tabla propia (funciona como hub) | ❌ No (usa unificado) | **Funcional — es el hub de identidad actual** |
| Otras Actividades (G9) | ❌ Emails en `text[]`, sin FKs | ✅ Login hardcodeado con usuarios ficticios | **Roto — login paralelo, datos sin integridad** |

---

## Diagnóstico Global

### Lo que funciona
- Login unificado (`/api/auth/login`) cubre los 3 orígenes: parqueo, alumnos académicos, catedráticos académicos.
- El puente `parqueo_user_id` está implementado en G1 (Alumno) y G5 (User) y se llena automáticamente al primer login.
- JWT con `sub = UUID de grupo5_parqueo.User` es la identidad estándar del ecosistema.
- Middleware (`proxy.js`) valida firma JWT real en cada request con `jose`.

### Lo que está roto
| Problema | Módulo | Criticidad |
|---|---|---|
| JWT ignorado — usuario logueado no se usa | G3 Laboratorios | Alta |
| Login paralelo hardcodeado con usuarios ficticios | G9 Otras Actividades | Alta |
| `inscritos text[]` sin integridad referencial | G9 Otras Actividades | Alta |
| `grupo3_laboratorios.usuario` vacía, desconectada | G3 Laboratorios | Alta |
| `parqueo_user_id` en G3 nunca se escribe | G3 Laboratorios | Media |
| No hay endpoint público de consulta de alumno | G1 Académico | Media |
| Lazy-link: alumnos sin primer login no tienen puente | G1/G5 | Baja |

### Corrección mínima por módulo

**G3 Laboratorios:**
1. Al montar `LaboratoriosDashboard`, leer JWT de `localStorage`, extraer `sub`.
2. Usar ese `sub` como `usuarioId` por defecto en `NuevaReservaModal` (ocultar el dropdown para alumnos).
3. Asegurarse de que el usuario exista en `grupo3_laboratorios.usuario` via `upsert` en el primer acceso, ligado por `parqueo_user_id`.

**G9 Otras Actividades:**
1. Eliminar el array hardcodeado y el login interno.
2. Leer `sub`, `email`, `name`, `role` del JWT al montar el componente.
3. Migrar `inscritos text[]` a tabla `InscripcionActividad(actividad_id, user_id, inscrito_at)`.
4. Reemplazar `creador` y `aprobador` (text libre) por FKs al UUID del usuario.

---

## Módulos Pendientes — Recomendaciones de Diseño

Para los módulos aún no desarrollados, la pauta de integración correcta desde el inicio:

| Módulo | Pauta |
|---|---|
| Control de Notas (G2) | `nota.alumno_id` → `grupo1_academico.Alumno.id`; `nota.catedratico_id` → `CatedraticoAcademico.id`. No crear tabla de usuario. |
| Biblioteca (G4) | `prestamo.user_id` → `grupo5_parqueo.User.id` (sub del JWT). No crear tabla de usuario. |
| Pagos (G6) | `pago.user_id` → `grupo5_parqueo.User.id`. Puede referenciar `grupo5_parqueo.Payment` si los pagos de parqueo deben unificarse. |
| Administración (G8) | Solo usuarios con `role = ADMIN` en `grupo5_parqueo.User`. No crear tabla de admins separada. |

**Regla universal para todos los módulos nuevos:**
```js
// Al montar cualquier página protegida:
const token = localStorage.getItem("access_token");
const payload = JSON.parse(decodeURIComponent(
  atob(token.split(".")[1]).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2,"0")).join("")
));
const userId = payload.sub;   // UUID de grupo5_parqueo.User — usar como FK en todo
const userRole = payload.role;
const userName = payload.name;
```

---

*Generado el 2026-06-01. Próxima revisión recomendada tras integrar G3 y G9.*
