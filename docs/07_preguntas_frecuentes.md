# Preguntas Frecuentes — Para estudiar antes de la presentación

## Preguntas generales del proyecto

**¿Qué problema resuelve el sistema?**
El campus de la USPG tiene 500 espacios de parqueo y no tenía forma de saber cuáles están disponibles, quién está adentro, o cobrar automáticamente. El sistema digitaliza el control de acceso, monitorea ocupación en tiempo real y automatiza el cobro según el tipo de usuario.

**¿Qué tecnologías usaron y por qué Next.js?**
Next.js 15 porque permite tener el frontend y el backend (API REST) en un solo proyecto. No necesitamos un servidor separado — las rutas `app/api/` son funciones serverless que Vercel ejecuta automáticamente. Usamos Prisma como ORM porque simplifica las consultas a PostgreSQL y Tailwind CSS para los estilos.

**¿Cómo funciona la autenticación?**
Con NextAuth.js usando el proveedor de credenciales. El usuario ingresa email y contraseña, el servidor verifica contra la base de datos con bcrypt (hash seguro), y si es válido genera un JWT (token) que se guarda en una cookie. Cada ruta protegida verifica este token con un middleware.

---

## Preguntas sobre la base de datos

**¿Por qué usaron Prisma y no SQL directo?**
Prisma genera queries optimizadas, previene SQL injection automáticamente, y el schema en `schema.prisma` sirve como documentación viva de la estructura de datos. También simplifica las migraciones.

**¿Cómo se conecta la app a la base de datos en producción?**
Via la variable `DATABASE_URL` que apunta a Neon, un PostgreSQL serverless gratuito. Neon permite conexiones desde Vercel sin necesidad de abrir puertos o configurar IPs.

**¿Qué pasa si hay dos vehículos tratando de entrar al mismo tiempo?**
Prisma maneja las transacciones de base de datos. El espacio se asigna de forma atómica — si dos peticiones llegan al mismo tiempo, Neon garantiza que solo una gane.

**¿Por qué hay `deleted_at` en algunos modelos y no un DELETE real?**
Es soft delete. Los vehículos y usuarios no se borran físicamente para conservar el historial de sesiones y auditoría. Si un vehículo tiene `deleted_at` con fecha, está "eliminado" pero el registro permanece para reportes históricos.

---

## Preguntas sobre el IoT

**¿Cómo se conectan los sensores ESP32?**
El ESP32 hace una petición HTTP POST al endpoint `/api/parqueo/spaces/sensor` con el código del espacio y el estado (OCCUPIED o AVAILABLE). El servidor actualiza la base de datos y el mapa se refresca automáticamente.

**¿Cómo se ve en tiempo real en el mapa?**
El mapa hace polling (consulta) a la API cada 3 segundos. Cuando un sensor actualiza un espacio, en máximo 3 segundos el mapa cambia el color del espacio.

**¿Por qué polling y no WebSockets?**
Por simplicidad y compatibilidad con Vercel. Las funciones serverless no mantienen conexiones persistentes, así que WebSockets no funcionan sin infraestructura adicional. Para una demo, polling cada 3 segundos es suficiente.

**¿Cómo simulan el ESP32 para la demo?**
Con el script `demo-iot.sh` que corre en la terminal y hace las mismas peticiones HTTP que haría el ESP32 físico. Para la presentación se corre localmente pero apuntando a la URL de Vercel.

---

## Preguntas sobre funcionalidades

**¿Cómo funciona el cobro automático?**
Al salir (segunda pasada del QR), el sistema calcula el tiempo en minutos desde la entrada, lo multiplica por la tarifa del rol del usuario (ej: Q5/hora para estudiante), y crea un registro de pago pendiente. Si el usuario tiene suscripción activa, el monto es Q0.

**¿Qué pasa si un vehículo está en lista negra?**
Al escanear el QR, el sistema verifica si algún vehículo del usuario está en `blacklisted: true`. Si está bloqueado, niega el acceso, registra un `AuditLog` con acción `BLACKLIST_ATTEMPT` y no crea sesión.

**¿Cómo funciona el QR de visitante?**
El guardia genera un QR temporal con nombre y placa del visitante. El QR expira en 2 horas y solo puede usarse una vez. Al escanearlo, el sistema crea una sesión normal pero marcada como `VISITOR_QR`. Puede enviarse por correo con Resend.

**¿Qué son las suscripciones?**
Son pases mensuales o semestrales que eximen del pago al ingresar. Al calcular el cobro, el sistema primero verifica si el usuario tiene suscripción activa — si la tiene, el monto es Q0 sin importar cuánto tiempo estuvo.

**¿Cómo funcionan los eventos especiales?**
Un admin crea un evento con fecha, horas y zonas afectadas. Puede tener tarifa fija (Q20 el evento) o tarifa por hora propia. Cuando un usuario ingresa durante el evento, el sistema aplica la tarifa del evento en lugar de la tarifa normal.

**¿Qué muestra el Escáner QR?**
Tiene tres modos: cámara real (BarcodeDetector API del navegador), ingreso manual del código, y detección por placa. Muestra si el usuario entra o sale, el vehículo, la zona asignada y el monto a pagar.

**¿Para qué sirve el Kiosco?**
Es una pantalla pública (sin login) donde cualquier persona puede buscar su vehículo por placa para saber si está adentro del parqueo y en qué zona. También tiene la cámara para que el guardia escanee QR directamente.

---

## Preguntas sobre arquitectura

**¿Cuántas rutas API tiene el sistema?**
73 rutas API REST bajo `/api/parqueo/`. Cada una es una función serverless en Vercel.

**¿Cómo está organizado el código?**
```
app/
├── api/parqueo/     ← Backend (73 endpoints)
├── parqueo/         ← Frontend admin (8 páginas)
└── kiosco/          ← Frontend público (2 páginas)
```

**¿Cómo se protegen las rutas?**
Next.js middleware intercepta todas las peticiones a `/parqueo/*` y `/api/parqueo/*`. Verifica el JWT de NextAuth y redirige al login si no hay sesión válida. Algunas rutas además verifican el rol dentro del handler.

**¿Por qué Vercel y no otro hosting?**
Vercel es el creador de Next.js, así que la integración es perfecta. El plan gratuito soporta funciones serverless, deploys automáticos desde GitHub, y dominios HTTPS gratis. Neon también tiene plan gratuito que es suficiente para el proyecto.

---

## Posibles preguntas de los evaluadores

**¿Qué mejoras harían si tuvieran más tiempo?**
- WebSockets para actualización instantánea sin polling
- Integración con LPR (reconocimiento de placas) real via cámara
- App móvil para que usuarios vean disponibilidad antes de llegar
- Pasarela de pago real (Visa/MasterCard)
- ESP32 físico conectado

**¿Cómo escala el sistema?**
Vercel escala automáticamente las funciones serverless. Neon escala la base de datos. El cuello de botella sería el polling del mapa — con WebSockets o Server-Sent Events se eliminaría.

**¿Qué pasaría si se cae internet en el campus?**
El ESP32 físico podría almacenar lecturas localmente y sincronizar al reconectarse. En la implementación actual, el sistema requiere conexión continua.

**¿Por qué no pusieron la API key de Resend directo en el código?**
Por seguridad. Las API keys nunca van en el código fuente porque quedarían en el historial de Git y cualquiera con acceso al repo podría usarlas. Van en variables de entorno que solo el servidor en producción conoce.
