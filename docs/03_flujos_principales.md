# Flujos Principales del Sistema

## 1. Flujo de entrada de un vehículo con QR

```
Guardia escanea QR del usuario (código único en su perfil)
         ↓
API POST /api/parqueo/qr/scan
         ↓
¿Vehículo en lista negra? → Denegar + AuditLog(BLACKLIST_ATTEMPT)
         ↓ No
¿Tiene suscripción activa? → Acceso gratis automático
         ↓
¿Hay evento activo con tarifa especial? → Aplica tarifa del evento
         ↓
¿Sesión activa ya? → Es SALIDA: calcula monto + cierra sesión
         ↓ No hay sesión activa
Crea ParkingSession (status: ACTIVE)
Actualiza ParkingSpace (status: OCCUPIED)
Registra BarrierLog (OPEN, trigger: QR)
Registra AuditLog (ENTRY)
Devuelve respuesta al escáner
```

## 2. Flujo de salida

El mismo escaneo del QR detecta que ya hay sesión activa:

```
Escaneo QR → sesión activa encontrada
         ↓
Calcula duration_minutes = now - entry_time
         ↓
Calcula amount_due según tarifa del rol:
  - ADMIN/SECURITY: Q0
  - TEACHER: Q0 hasta 8h, excedente a tarifa de estudiante
  - STUDENT: Q5/hora
  - VISITOR: Q10/hora
  - Evento activo: aplica flat_rate o tarifa propia
  - Suscripción activa: Q0
         ↓
Cierra ParkingSession (status: COMPLETED, exit_time: now)
Libera ParkingSpace (status: AVAILABLE)
Crea Payment (status: PENDING si amount > 0)
Registra AuditLog (EXIT)
```

## 3. Flujo de Visitante (QR temporal)

```
Guardia abre "Generar QR Visitante" en /parqueo/escaner
         ↓
Ingresa nombre del visitante y placa del carro
         ↓
API POST /api/parqueo/qr/visitor
  - Crea VisitorQR con expires_at = now + 2 horas
  - Genera código único: VIS-{timestamp}-{NOMBRE_SIN_ESPACIOS}
  - Genera imagen QR en base64
         ↓
Sistema muestra QR en pantalla
Guardia puede:
  a) Imprimir el QR
  b) Enviarlo por correo (Resend SDK)
         ↓
Visitante llega y escanea el QR
         ↓
API POST /api/parqueo/qr/scan detecta que es VisitorQR:
  - Verifica que no haya expirado
  - Verifica que no haya sido usado
  - Crea sesión con entry_method: VISITOR_QR
  - Marca VisitorQR.is_used = true
```

## 4. Flujo de Reserva

```
Usuario va a /parqueo/reservas
         ↓
Selecciona zona, espacio, fecha y hora
         ↓
API POST /api/parqueo/reservations
  - Verifica que el espacio esté disponible en ese rango
  - Crea Reservation (status: CONFIRMED)
  - Cambia ParkingSpace (status: RESERVED)
         ↓
Usuario puede recibir QR de la reserva por correo
(API POST /api/parqueo/qr/send-email)
         ↓
Al llegar, escanea QR → entra al flujo normal de sesión
```

## 5. Flujo de Sensor IoT (ESP32 simulado)

```
ESP32/script envía señal de ocupación:
POST /api/parqueo/spaces/sensor
Body: { "space_code": "A-002", "status": "OCCUPIED" }
         ↓
API actualiza ParkingSpace.status
API actualiza ParkingSpace.last_sensor_update = now
         ↓
Mapa en /parqueo/mapa hace polling cada 3 segundos
y muestra el cambio de color en tiempo real
```

## 6. Cálculo de tarifas

```javascript
// Prioridad de cálculo (de mayor a menor):
1. Suscripción activa → GRATIS
2. Evento con tarifa fija activo → flat_rate del evento
3. Evento con tarifa por hora activo → hourly del evento
4. Tarifa normal por rol:
   - ADMIN/SECURITY → Q0 (exento)
   - TEACHER → Q0 hasta 8h
   - TEACHER > 8h → excedente × tarifa de STUDENT
   - STUDENT → Q5 × horas
   - VISITOR → Q10 × horas

// Fórmula:
amount = (duration_minutes / 60) × hourly_rate
```

## 7. Autenticación

```
Usuario accede a /login
         ↓
NextAuth.js verifica email + contraseña contra DB
(bcrypt.compare)
         ↓
Si es válido → crea JWT session con { id, email, role, name }
         ↓
Middleware protege rutas /parqueo/* y /api/parqueo/*
según el rol:
  - /parqueo/tarifas → solo ADMIN
  - /parqueo/seguridad → ADMIN o SECURITY
  - Kiosco (/kiosco/*) → público (sin login)
```
