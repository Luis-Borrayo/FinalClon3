# IoT y Demo

## Arquitectura IoT

El sistema simula sensores ultrasónicos ESP32 que detectan si un espacio está ocupado y notifican al servidor via HTTP.

```
ESP32 (sensor físico o script demo)
         │
         │ POST /api/parqueo/spaces/sensor
         │ Body: { space_code: "A-002", status: "OCCUPIED" }
         ▼
Servidor Next.js en Vercel
         │
         │ Actualiza ParkingSpace en Neon DB
         ▼
Mapa en browser (polling cada 3 segundos)
         │
         │ GET /api/parqueo/spaces
         ▼
Visualización en tiempo real (colores cambian)
```

## Script demo-iot.sh

Simula el comportamiento de sensores ESP32 desde la terminal.

### Cómo ejecutarlo

**Para demo local** (servidor corriendo en tu máquina):
```bash
cd /Users/javierestrada/Downloads/final
./demo-iot.sh
```

**Para demo en producción** (Vercel):
```bash
PARQUEO_URL="https://final-blond-ten.vercel.app" ./demo-iot.sh
```

### Menú del script

```
1) Auto-demo (muestra 4 parqueos en secuencia automática)
2) Ocupar espacio manualmente
3) Liberar espacio manualmente
4) Salir
```

### Auto-demo: espacios que simula

| Espacio | Parqueo | Acción |
|---------|---------|--------|
| A-002 | Zona A · Norte | Ocupa |
| A-130 | Zona A · Oeste | Ocupa |
| B-001 | Zona B · Sur | Ocupa |
| B-130 | Zona B · Este | Ocupa |
| (espera 4s) | | |
| A-002 | Zona A · Norte | Libera |
| A-130 | Zona A · Oeste | Libera |
| B-001 | Zona B · Sur | Libera |
| B-130 | Zona B · Este | Libera |

Tiempos: 1.5s entre ocupaciones, 1s entre liberaciones.

## Endpoint del sensor

```
POST /api/parqueo/spaces/sensor

Body:
{
  "space_code": "A-001",   ← código del espacio
  "status": "OCCUPIED"      ← o "AVAILABLE"
}

Respuesta:
{
  "success": true,
  "data": { ...espacio actualizado... },
  "message": "Estado actualizado por sensor"
}
```

No requiere autenticación (simula ESP32 en red interna).

## Mapa en tiempo real

- **Ruta:** `/parqueo/mapa`
- **Polling:** cada 3 segundos (`setInterval(load, 3000)`)
- **Colores:**
  - Verde → disponible (< 60% ocupado)
  - Naranja → moderado (60–85% ocupado)
  - Rojo → lleno (> 85% ocupado)
- **Clic en zona** → panel lateral con lista de espacios y su estado individual

## Script reset-demo.sh

Limpia la base de datos dejando solo los datos del seed original.

```bash
cd /Users/javierestrada/Downloads/final
./reset-demo.sh
```

**Qué borra:**
- Pagos
- Sesiones de parqueo
- Reservas
- Logs de auditoría
- Logs de barreras
- QRs de visitante
- Notificaciones
- Lista negra (solo vehículos no-seed)
- Vehículos de prueba (conserva los 10 del seed)

**Qué conserva:**
- Los 10 vehículos originales del seed
- Los 5 usuarios del seed
- Los 500 espacios (todos en AVAILABLE)
- Campus y configuración de tarifas

**Para resetear Neon (producción):**
Modifica temporalmente `ENV_FILE` en el script, o corre:
```bash
DATABASE_URL="postgresql://neondb_owner:..." node -e "..." 
```
