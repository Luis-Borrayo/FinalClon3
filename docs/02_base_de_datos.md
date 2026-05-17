# Base de Datos — Schema y Modelos

## Motor y ORM

- **Motor:** PostgreSQL
- **ORM:** Prisma v6
- **Producción:** Neon (serverless, región us-east-1)
- **Local:** `postgresql://postgres:admin123@localhost:5432/parqueo_db`
- **Comando para sincronizar:** `npx prisma db push`
- **Comando para poblar:** `npx prisma db seed`

---

## Modelos principales

### Campus
Representa el campus universitario. Solo existe 1 registro.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | String | Nombre del campus |
| lat / lng | Float | Coordenadas GPS |
| zoom | Int | Zoom inicial del mapa (18) |
| total_spaces | Int | Total de espacios (500) |

---

### User
Usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| email | String UNIQUE | Correo / login |
| password_hash | String | bcrypt |
| role | Enum | ADMIN, SECURITY, TEACHER, STUDENT, VISITOR |
| first_name / last_name | String | Nombre completo |
| carnet | String? UNIQUE | Número de carnet (estudiantes) |
| nfc_card_id | String? UNIQUE | ID de tarjeta NFC |
| qr_code | String UNIQUE | Código QR personal para acceso |
| is_active | Boolean | Si puede ingresar |

**Roles y sus permisos:**
- **ADMIN** — acceso total, edita tarifas, gestiona usuarios
- **SECURITY** — escanea QR, abre barreras, ve historial
- **TEACHER** — estaciona gratis hasta 8 horas
- **STUDENT** — paga tarifa por hora
- **VISITOR** — accede con QR temporal generado por seguridad

---

### Vehicle
Vehículos registrados. Cada usuario puede tener varios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| placa | String UNIQUE | Placa del vehículo |
| brand / model / color / year | String? / Int? | Datos del vehículo |
| is_authorized | Boolean | Autorizado para ingresar |
| blacklisted | Boolean | En lista negra |
| blacklist_reason | String? | Motivo del bloqueo |

---

### ParkingSpace
Espacios individuales del parqueo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| code | String UNIQUE | Ej: "A-001", "B-130" |
| zone | Enum | A, B, C, D |
| type | Enum | STANDARD, VIP, HANDICAPPED, ELECTRIC, RESERVED, TEACHER |
| status | Enum | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |
| last_sensor_update | DateTime? | Última actualización del sensor IoT |

---

### ParkingSession
Registro de cada vez que un vehículo entra y sale.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| vehicle_id | UUID FK | Vehículo |
| space_id | UUID FK | Espacio asignado |
| user_id | UUID FK? | Dueño del vehículo |
| entry_time | DateTime | Hora de entrada |
| exit_time | DateTime? | Hora de salida (null si está activo) |
| entry_method | Enum | QR, PLATE, NFC, MANUAL, VISITOR_QR |
| status | Enum | ACTIVE, COMPLETED, CANCELLED |
| duration_minutes | Int? | Calculado al salir |
| amount_due | Float? | Monto a pagar al salir |
| is_paid | Boolean | Si ya pagó |

---

### Payment
Pago asociado a una sesión (relación 1:1 con ParkingSession).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| session_id | UUID UNIQUE | Sesión pagada |
| amount | Float | Monto total |
| payment_method | Enum | CASH, CARD, TRANSFER, QR_CODE, MOBILE |
| status | Enum | PENDING, COMPLETED, FAILED, REFUNDED |

---

### Reservation
Reservas anticipadas de espacios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| start_time / end_time | DateTime | Ventana de tiempo |
| status | Enum | PENDING, CONFIRMED, CANCELLED, EXPIRED, USED |
| type | Enum | STANDARD, PERSONAL, EVENT, SPECIAL_VISIT |

---

### VisitorQR
QR temporal generado por seguridad para visitantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| qr_code | String UNIQUE | Código único (ej: VIS-xxx-NOMBRE) |
| visitor_name | String | Nombre del visitante |
| vehicle_plate | String | Placa del carro del visitante |
| expires_at | DateTime | Vence (normalmente 2 horas) |
| is_used | Boolean | Si ya fue escaneado |
| session_id | UUID? | Sesión asociada al usar el QR |

---

### TariffConfig
Tarifas por rol, editables desde el panel de admin.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| role | Enum UNIQUE | Rol al que aplica |
| hourly_rate | Decimal | Quetzales por hora |
| is_free | Boolean | Exento de cobro |
| max_free_hours | Int? | Límite gratuito (docentes = 8h) |

**Tarifas por defecto:**
- ADMIN: Exento
- TEACHER: Exento (hasta 8h, excedente cobra tarifa de estudiante)
- STUDENT: Q5/hora
- VISITOR: Q10/hora
- SECURITY: Exento

---

### ParkingSubscription
Suscripciones mensuales o semestrales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| type | Enum | MONTHLY, SEMESTER |
| status | Enum | ACTIVE, EXPIRED, CANCELLED, PENDING |
| start_date / end_date | DateTime | Vigencia |
| amount_paid | Decimal | Monto pagado |

---

### ParkingEvent
Eventos especiales en el campus con tarifa propia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| name | String | Nombre del evento |
| affected_zones | String | Zonas afectadas |
| tariff_mode | Enum | HOURLY (por hora) o FLAT_RATE (tarifa fija) |
| flat_rate | Decimal? | Monto fijo si aplica |
| status | Enum | SCHEDULED, ACTIVE, COMPLETED, CANCELLED |

---

### AuditLog
Registro de todas las acciones importantes del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_id | UUID? | Quién hizo la acción |
| action | String | Ej: LOGIN, ENTRY, EXIT, VEHICLE_CREATED |
| resource | String? | Tabla/recurso afectado |
| metadata | JSON? | Datos adicionales |
| ip_address | String? | IP del cliente |

**Acciones traducidas al español en el panel:**
- LOGIN → Inicio de sesión
- LOGOUT → Cierre de sesión
- ENTRY → Entrada registrada
- EXIT → Salida registrada
- VEHICLE_CREATED → Vehículo registrado
- BLACKLISTED → Vehículo en lista negra
- RESERVATION_DELETED → Reserva cancelada

---

### Blacklist
Lista negra de vehículos bloqueados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| vehicle_id | UUID FK | Vehículo bloqueado |
| reason | String | Motivo |
| is_active | Boolean | Si el bloqueo sigue activo |
| removed_at / removed_by_user_id | DateTime? / UUID? | Cuándo y quién lo desactivó |

---

### BarrierLog
Registro de aperturas/cierres de barreras físicas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| barrier_id | String | ID de la barrera (Ej: "ENTRADA-1") |
| action | Enum | OPEN, CLOSE, BLOCK, ERROR |
| trigger_source | Enum | QR, PLATE, NFC, MANUAL, SYSTEM |

---

## Diagrama de relaciones simplificado

```
User ──────────── Vehicle ──────────── ParkingSession
 │                                          │
 │                                       Payment
 │
 ├── Reservation ── ParkingSpace
 │
 ├── VisitorQR
 ├── ParkingSubscription
 ├── AuditLog
 ├── Notification
 └── MonthlyBill

Campus ── ParkingSpace
```

## Enums importantes

```
Role:       ADMIN | SECURITY | TEACHER | STUDENT | VISITOR
Zone:       A | B | C | D
SpaceStatus: AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE
EntryMethod: QR | PLATE | NFC | MANUAL | VISITOR_QR
SessionStatus: ACTIVE | COMPLETED | CANCELLED
```
