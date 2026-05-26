-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'TECNICO', 'CATEDRATICO', 'ESTUDIANTE');

-- CreateEnum
CREATE TYPE "CategoriaUsuario" AS ENUM ('ESTUDIANTE_UNIVERSITARIO', 'PERSONAL_COLEGIO', 'PERSONAL_IGLESIA', 'EVENTO_EXTERNO', 'CATEDRATICO');

-- CreateEnum
CREATE TYPE "TipoLaboratorio" AS ENUM ('COMPUTACION', 'PLC_CNC', 'QUIMICA', 'FISICA');

-- CreateEnum
CREATE TYPE "EstadoLaboratorio" AS ENUM ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoCobro" AS ENUM ('CUOTA_SEMESTRAL', 'PAGO_HORA', 'PAGO_DIA', 'PAGO_SEMESTRE', 'RESERVACION_GRUPO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('OPERATIVO', 'MANTENIMIENTO', 'DANADO', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoConexion" AS ENUM ('PRESENCIAL', 'REMOTA');

-- CreateEnum
CREATE TYPE "TipoSancion" AS ENUM ('AMONESTACION', 'SUSPENSION_TEMPORAL', 'EXPULSION');

-- CreateEnum
CREATE TYPE "EstadoMantenimiento" AS ENUM ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "EstadoReporteDano" AS ENUM ('REPORTADO', 'EN_REVISION', 'COBRADO', 'CERRADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ESTUDIANTE',
    "categoria" "CategoriaUsuario" NOT NULL DEFAULT 'ESTUDIANTE_UNIVERSITARIO',
    "carrera" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "reglamento_acep" BOOLEAN NOT NULL DEFAULT false,
    "sancionado" BOOLEAN NOT NULL DEFAULT false,
    "evento_externo_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglamento" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglamento_aceptacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "reglamento_id" INTEGER NOT NULL,
    "aceptado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglamento_aceptacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sancion" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoSancion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "aplicada_por_id" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "levantada" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratorio" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT 'LAB-GEN',
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "ubicacion" TEXT,
    "tipo" "TipoLaboratorio" NOT NULL DEFAULT 'COMPUTACION',
    "capacidad_total" INTEGER NOT NULL DEFAULT 30,
    "permite_division" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoLaboratorio" NOT NULL DEFAULT 'ACTIVO',
    "fase_implementacion" INTEGER NOT NULL DEFAULT 1,
    "disponible_publico" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_division" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "cupo" INTEGER NOT NULL,
    "es_grupo_completo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "configuracion_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estacion" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipo" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "codigo_inventario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "es_servidor" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'OPERATIVO',
    "ubicacion_fisica" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimiento_equipo" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "tecnico_id" TEXT,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" DECIMAL(10,2),
    "estado" "EstadoMantenimiento" NOT NULL DEFAULT 'PROGRAMADO',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mantenimiento_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporte_dano" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "reportado_por_id" TEXT NOT NULL,
    "usuario_responsable_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "requiere_cobro" BOOLEAN NOT NULL DEFAULT false,
    "monto_cobro" DECIMAL(10,2),
    "estado" "EstadoReporteDano" NOT NULL DEFAULT 'REPORTADO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporte_dano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "configuracion_division_id" INTEGER,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "cantidad_personas" INTEGER NOT NULL,
    "proposito" TEXT NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "aprobada_por_id" TEXT,
    "notas" TEXT,
    "motivo_rechazo" TEXT,
    "motivo_cancelacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "laboratorio_id" INTEGER,
    "reserva_id" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "tipo_cobro" "TipoCobro" NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "referencia_externa" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion_uso" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "laboratorio_id" INTEGER,
    "equipo_id" INTEGER,
    "tipo_conexion" "TipoConexion" NOT NULL DEFAULT 'PRESENCIAL',
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "registro_actividad" JSONB,

    CONSTRAINT "sesion_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infraccion" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "sesion_uso_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "sancion_aplicada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infraccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumno" (
    "id" SERIAL NOT NULL,
    "carnet" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catedratico_academico" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catedratico_academico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creditos" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "ciclo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario" (
    "id" SERIAL NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "catedratico_id" INTEGER NOT NULL,
    "dia" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "salon" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencia" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "horario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "reglamento_version_key" ON "reglamento"("version");

-- CreateIndex
CREATE UNIQUE INDEX "reglamento_aceptacion_usuario_id_reglamento_id_key" ON "reglamento_aceptacion"("usuario_id", "reglamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "laboratorio_codigo_key" ON "laboratorio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "equipo_codigo_inventario_key" ON "equipo"("codigo_inventario");

-- CreateIndex
CREATE INDEX "reserva_laboratorio_id_fecha_inicio_fecha_fin_idx" ON "reserva"("laboratorio_id", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE UNIQUE INDEX "alumno_carnet_key" ON "alumno"("carnet");

-- CreateIndex
CREATE UNIQUE INDEX "alumno_email_key" ON "alumno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "catedratico_academico_codigo_key" ON "catedratico_academico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "catedratico_academico_email_key" ON "catedratico_academico"("email");

-- CreateIndex
CREATE UNIQUE INDEX "curso_codigo_key" ON "curso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "asignacion_alumno_id_curso_id_ciclo_key" ON "asignacion"("alumno_id", "curso_id", "ciclo");

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_alumno_id_horario_id_fecha_key" ON "asistencia"("alumno_id", "horario_id", "fecha");

-- AddForeignKey
ALTER TABLE "reglamento_aceptacion" ADD CONSTRAINT "reglamento_aceptacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglamento_aceptacion" ADD CONSTRAINT "reglamento_aceptacion_reglamento_id_fkey" FOREIGN KEY ("reglamento_id") REFERENCES "reglamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancion" ADD CONSTRAINT "sancion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_division" ADD CONSTRAINT "configuracion_division_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estacion" ADD CONSTRAINT "estacion_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimiento_equipo" ADD CONSTRAINT "mantenimiento_equipo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimiento_equipo" ADD CONSTRAINT "mantenimiento_equipo_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_dano" ADD CONSTRAINT "reporte_dano_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_dano" ADD CONSTRAINT "reporte_dano_reportado_por_id_fkey" FOREIGN KEY ("reportado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_dano" ADD CONSTRAINT "reporte_dano_usuario_responsable_id_fkey" FOREIGN KEY ("usuario_responsable_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_configuracion_division_id_fkey" FOREIGN KEY ("configuracion_division_id") REFERENCES "configuracion_division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_aprobada_por_id_fkey" FOREIGN KEY ("aprobada_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_uso" ADD CONSTRAINT "sesion_uso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_uso" ADD CONSTRAINT "sesion_uso_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_uso" ADD CONSTRAINT "sesion_uso_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraccion" ADD CONSTRAINT "infraccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraccion" ADD CONSTRAINT "infraccion_sesion_uso_id_fkey" FOREIGN KEY ("sesion_uso_id") REFERENCES "sesion_uso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario" ADD CONSTRAINT "horario_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario" ADD CONSTRAINT "horario_catedratico_id_fkey" FOREIGN KEY ("catedratico_id") REFERENCES "catedratico_academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "horario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable (carrera)
CREATE TABLE "carrera" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "facultad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carrera_codigo_key" ON "carrera"("codigo");

-- AlterTable (alumno — agregar carrera_id)
ALTER TABLE "alumno" ADD COLUMN "carrera_id" INTEGER;

-- AddForeignKey
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
