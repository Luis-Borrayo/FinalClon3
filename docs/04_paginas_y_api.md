# Páginas y API REST

## Páginas del panel administrador (`/parqueo/*`)

| Ruta | Descripción | Roles |
|------|-------------|-------|
| `/parqueo/mapa` | Mapa interactivo con espacios en tiempo real. Polling cada 3s. Clic en zona muestra espacios y su estado (verde/rojo/amarillo). | Todos |
| `/parqueo/sesiones` | Listado de sesiones activas y completadas. Muestra entrada, salida, duración y monto. Historial completo. | Todos |
| `/parqueo/escaner` | Panel principal del guardia. Escanea QR con cámara (BarcodeDetector API), ingreso manual, genera QR para visitantes. | SECURITY, ADMIN |
| `/parqueo/vehiculos` | Gestión de vehículos. Búsqueda, paginación (20 por página), autorizar/desautorizar, agregar a lista negra. | ADMIN |
| `/parqueo/reservas` | Ver y gestionar reservas. Cancelar reservas, enviar QR por correo. | Todos |
| `/parqueo/reportes` | Gráficas de ocupación, ingresos, usuarios frecuentes, predicción. Exportar a CSV/PDF. | ADMIN |
| `/parqueo/seguridad` | Logs de auditoría traducidos al español, lista negra, intentos fallidos, actividad sospechosa. | ADMIN, SECURITY |
| `/parqueo/tarifas` | Configurar quetzales por hora por rol. Solo ADMIN puede editar. | ADMIN |
| `/parqueo/suscripciones` | Ver suscripciones activas/expiradas, crear nuevas (mensual/semestral). | ADMIN |

---

## Páginas del kiosco público (`/kiosco/*`)

| Ruta | Descripción |
|------|-------------|
| `/kiosco/acceso` | El guardia escanea QR con cámara real (BarcodeDetector). Sin login requerido. |
| `/kiosco/buscar` | El usuario busca su vehículo por placa. Muestra si está adentro, en qué zona y parqueo (A Norte, A Oeste, B Sur, B Este). |

---

## API REST — Rutas principales

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/[...nextauth]` | Login/logout con NextAuth |

### QR y acceso
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/parqueo/qr/scan` | Escanea QR → entrada o salida automática |
| POST | `/api/parqueo/qr/validate` | Valida si un QR es válido sin crear sesión |
| POST | `/api/parqueo/qr/visitor` | Genera QR temporal para visitante |
| GET | `/api/parqueo/qr/list` | Lista QRs de visitante |
| POST | `/api/parqueo/qr/send-email` | Envía QR de reserva por correo |
| POST | `/api/parqueo/qr/send-batch` | Envía múltiples QRs de reserva en un correo |

### Espacios e IoT
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/spaces` | Lista espacios con filtros |
| POST | `/api/parqueo/spaces/sensor` | **Endpoint IoT** — ESP32 actualiza estado del espacio |

### Sesiones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/sessions/active` | Sesiones activas en este momento |
| GET | `/api/parqueo/sessions/[id]` | Detalle de sesión |
| POST | `/api/parqueo/sessions/[id]/exit` | Forzar salida manual |
| GET | `/api/parqueo/sessions/[id]/ticket` | Genera ticket de pago |

### Vehículos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/vehicles` | Lista vehículos |
| POST | `/api/parqueo/vehicles` | Registrar vehículo |
| PUT | `/api/parqueo/vehicles/[id]` | Editar vehículo |
| DELETE | `/api/parqueo/vehicles/[id]` | Eliminar vehículo |
| POST | `/api/parqueo/vehicles/[id]/blacklist` | Agregar a lista negra |
| POST | `/api/parqueo/vehicles/[id]/authorize` | Autorizar vehículo |
| GET | `/api/parqueo/vehicles/search` | Buscar por placa (kiosco) |

### Reservas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/reservations` | Lista reservas |
| POST | `/api/parqueo/reservations` | Crear reserva |
| POST | `/api/parqueo/reservations/[id]/cancel` | Cancelar reserva |

### Pagos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/payments` | Lista pagos |
| POST | `/api/parqueo/payments/[id]/confirm` | Confirmar pago |
| POST | `/api/parqueo/payments/[id]/refund` | Reembolsar |

### Seguridad y auditoría
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/security/audit` | Logs de auditoría |
| GET | `/api/parqueo/security/blacklist` | Lista negra |
| GET | `/api/parqueo/security/failed-attempts` | Intentos fallidos |
| GET | `/api/parqueo/security/suspicious` | Actividad sospechosa |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/reports/daily` | Reporte diario |
| GET | `/api/parqueo/reports/monthly` | Reporte mensual |
| GET | `/api/parqueo/reports/occupancy` | Ocupación por hora/zona |
| GET | `/api/parqueo/reports/revenue` | Ingresos |
| GET | `/api/parqueo/reports/top-users` | Usuarios más frecuentes |
| GET | `/api/parqueo/reports/prediction` | Predicción de ocupación |
| GET | `/api/parqueo/reports/export` | Exportar CSV/PDF |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parqueo/dashboard` | Métricas generales |
| GET | `/api/parqueo/dashboard/activity` | Actividad reciente |
| GET | `/api/parqueo/dashboard/alerts` | Alertas activas |
| GET | `/api/parqueo/dashboard/traffic` | Tráfico por hora |

### Tarifas, suscripciones y eventos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/PUT | `/api/parqueo/tariffs` | Ver y editar tarifas por rol |
| GET/POST | `/api/parqueo/subscriptions` | Suscripciones |
| GET | `/api/parqueo/subscriptions/check` | Verifica si usuario tiene suscripción activa |
| GET/POST | `/api/parqueo/events` | Eventos especiales |
| GET | `/api/parqueo/events/active` | Evento activo en este momento |

---

## Formato de respuesta de la API

Todas las rutas usan helpers de `@/lib/response.js`:

```javascript
// Éxito
{ success: true, data: {...}, message: "..." }

// Error
{ success: false, error: "mensaje de error" }

// Con status HTTP correcto (200, 400, 404, 500)
```
