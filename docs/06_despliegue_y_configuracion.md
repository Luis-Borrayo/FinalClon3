# Despliegue y Configuración

## Variables de entorno

Archivo: `webapp/.env.local` (local) / Vercel Environment Variables (producción)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_URL` | URL base del sistema | `https://final-blond-ten.vercel.app` |
| `NEXTAUTH_SECRET` | Clave secreta para JWT | string largo aleatorio |
| `NEXT_PUBLIC_BASE_URL` | URL pública (frontend) | `https://final-blond-ten.vercel.app` |
| `RESEND_API_KEY` | API key de Resend para emails | `re_xxxxx` |
| `RESEND_TO_OVERRIDE` | Sobreescribe destinatario (pruebas) | `javiera.estradag@gmail.com` |

## Base de datos Neon

- **Proveedor:** Neon.tech (PostgreSQL serverless gratuito)
- **Región:** us-east-1
- **Proyecto:** ep-green-butterfly-aqxcp9cs
- **Cómo aplicar schema:** `npx prisma db push`
- **Cómo poblar datos:** `node --input-type=module -e "import './prisma/seed.js'"` (desde `webapp/`)

## Vercel

- **Cuenta:** elchavispg's projects
- **URL producción:** https://final-blond-ten.vercel.app
- **Configuración crítica en dashboard:**
  - Root Directory: `webapp`
  - Framework Preset: Next.js
  - Build Command: `npx prisma generate && npm run build`
  - Install Command: `npm install`
  - Output Directory: (vacío — auto detectado)

- **vercel.json** (ubicado en `webapp/vercel.json`):
```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## Cómo correr localmente

```bash
# 1. Instalar dependencias
cd webapp
npm install

# 2. Asegurarse que PostgreSQL local esté corriendo
# DATABASE_URL=postgresql://postgres:admin123@localhost:5432/parqueo_db

# 3. Sincronizar schema
npx prisma db push

# 4. Poblar datos
npx prisma db seed

# 5. Correr servidor
npm run dev
# → http://localhost:3000
```

## Repositorios Git

```bash
# Ver remotos configurados
git remote -v

# origin → g-uspg/final (organización del proyecto)
# fork   → ElChaviSPG/final (fork personal)

# Push a ambos (rama parqueo)
git push origin parqueo
git push fork parqueo
```

## Dependencias clave

| Paquete | Versión | Para qué |
|---------|---------|----------|
| next | 15.x | Framework |
| @prisma/client | 6.x | ORM base de datos |
| next-auth | 4.x | Autenticación |
| resend | última | Envío de emails |
| qrcode | última | Generación de QR |
| bcryptjs | última | Hash de contraseñas |
| tailwindcss | 4.x | Estilos CSS |
| @tailwindcss/postcss | 4.x | PostCSS plugin (debe estar en `dependencies`, NO `devDependencies`) |

## Notas importantes para el despliegue

1. **`@tailwindcss/postcss` debe estar en `dependencies`** (no devDependencies) — Vercel no instala devDependencies en producción y el build falla.

2. **Resend SDK debe inicializarse dentro del handler** de cada ruta API, no a nivel de módulo — de lo contrario falla en build si `RESEND_API_KEY` no está disponible.

3. **`npx prisma generate` antes del build** — el cliente de Prisma se genera en tiempo de build, por eso el buildCommand incluye este paso.

4. **Neon requiere `sslmode=require`** en la connection string.
