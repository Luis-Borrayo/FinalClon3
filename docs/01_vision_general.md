# Sistema de Parqueo USPG — Visión General

## ¿Qué es?

El Sistema de Parqueo USPG es un módulo del Proyecto Integrador del Grupo 5 de la Universidad San Pablo Guatemala. Controla el acceso vehicular al campus, gestiona espacios en tiempo real, cobra tarifas automáticas según el rol del usuario y genera reportes para administración.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | JavaScript (sin TypeScript) |
| Base de datos | PostgreSQL vía Prisma ORM |
| Producción DB | Neon (serverless PostgreSQL) |
| Deploy | Vercel |
| Autenticación | NextAuth.js (credenciales) |
| Email | Resend SDK |
| Estilos | Tailwind CSS v4 |
| QR | librería `qrcode` |

## Repositorios

- **Organización:** https://github.com/g-uspg/final (rama `parqueo`)
- **Fork personal:** https://github.com/ElChaviSPG/final (rama `parqueo`)
- **Deploy:** https://final-blond-ten.vercel.app

## Estructura de carpetas

```
final/
├── webapp/                    ← raíz de Next.js (Root Directory en Vercel)
│   ├── prisma/
│   │   ├── schema.prisma      ← modelos de base de datos
│   │   └── seed.js            ← datos iniciales
│   ├── src/app/
│   │   ├── api/parqueo/       ← 73 rutas de API REST
│   │   ├── parqueo/           ← páginas del panel admin
│   │   └── kiosco/            ← páginas del kiosco público
│   └── .env.local             ← variables de entorno locales
├── demo-iot.sh                ← simulador ESP32
├── reset-demo.sh              ← limpia datos de prueba
└── docs/                      ← esta documentación
```

## Campus

- **Nombre:** Universidad San Pablo Guatemala
- **Ubicación:** 13 Calle 4-65, Guatemala City (Lat 14.5847, Lng -90.5085)
- **Total espacios:** 500 (divididos en 4 zonas)

## Zonas del parqueo

| Zona | Nombre | Espacios | Códigos |
|------|--------|----------|---------|
| A Norte | Zona A · Norte | ~125 | A-001 a A-125 |
| A Oeste | Zona A · Oeste | ~95 | A-126 a A-220 |
| B Sur | Zona B · Sur | ~75 | B-001 a B-075 |
| B Este | Zona B · Este | ~75 | B-076 a B-150 |
| C | Zona C | 80 | C-001 a C-080 |
| D | Zona D | 50 | D-001 a D-050 |

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@uspg.edu.gt | Admin2026! | Administrador |
| docente01@uspg.edu.gt | Teacher2026! | Docente |
| est001@uspg.edu.gt | Student2026! | Estudiante (carnet: 2021-0001) |
| est002@uspg.edu.gt | Student2026! | Estudiante (carnet: 2021-0002) |
| guardia01@uspg.edu.gt | Security2026! | Seguridad |
