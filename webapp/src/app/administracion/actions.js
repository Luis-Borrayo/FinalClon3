'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── Datos del dashboard ──────────────────────────────────────────────────────

export async function getDashboardAdminData() {
  try {
    const hoy = new Date()
    const inicioDia = new Date(hoy)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(hoy)
    finDia.setHours(23, 59, 59, 999)

    const [
      espacios,
      reservasPendientes,
      reservasHoy,
      reportesAbiertos,
      usuarios,
    ] = await Promise.all([
      prisma.espacio.findMany({
        where: { activo: true },
        include: {
          _count: { select: { reservasEspacio: true, reportesMantenimiento: true } },
          reservasEspacio: {
            where: {
              estado: { in: ['APROBADA', 'PENDIENTE'] },
              fechaFin: { gte: new Date() },
            },
            orderBy: { fechaInicio: 'asc' },
            take: 3,
          },
        },
        orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
      }),
      prisma.reservaEspacio.findMany({
        where: { estado: 'PENDIENTE' },
        include: {
          espacio: { select: { nombre: true, codigo: true, tipo: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Solo conteo para el stat "Reservas Hoy"
      prisma.reservaEspacio.findMany({
        where: {
          estado: 'APROBADA',
          fechaInicio: { gte: inicioDia },
          fechaFin: { lte: finDia },
        },
        select: { id: true },
      }),
      prisma.reporteMantenimiento.findMany({
        where: { estado: { in: ['ABIERTO', 'EN_PROCESO'] } },
        include: {
          espacio: { select: { nombre: true, codigo: true } },
        },
        orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
        take: 20,
      }),
      prisma.catedraticoAcademico.findMany({
        select: { id: true, codigo: true, nombre: true, apellido: true, email: true },
        orderBy: { nombre: 'asc' },
      }),
    ])

    const stats = {
      totalEspacios: espacios.length,
      espaciosDisponibles: espacios.filter((e) => e.estado === 'DISPONIBLE').length,
      reservasPendientes: reservasPendientes.length,
      reservasHoy: reservasHoy.length,
      reportesAbiertos: reportesAbiertos.length,
      reportesUrgentes: reportesAbiertos.filter((r) => r.prioridad === 'URGENTE').length,
    }

    return { espacios, reservasPendientes, reservasHoy, reportesAbiertos, usuarios, stats }
  } catch (error) {
    console.error('getDashboardAdminData error:', error)
    throw error
  }
}

// ─── Reservas por mes (para calendario mensual) ───────────────────────────────

export async function getReservasMes(anio, mes) {
  try {
    const inicio = new Date(anio, mes, 1)
    const fin = new Date(anio, mes + 1, 0, 23, 59, 59, 999)

    const reservas = await prisma.reservaEspacio.findMany({
      where: {
        estado: { in: ['APROBADA', 'PENDIENTE'] },
        fechaInicio: { gte: inicio },
        fechaFin: { lte: fin },
      },
      include: {
        espacio: { select: { nombre: true, codigo: true } },
      },
      orderBy: { fechaInicio: 'asc' },
    })

    return reservas
  } catch (error) {
    console.error('getReservasMes error:', error)
    return []
  }
}

// ─── Espacios CRUD ────────────────────────────────────────────────────────────

export async function crearEspacio(data) {
  try {
    const espacio = await prisma.espacio.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        capacidad: parseInt(data.capacidad),
        ubicacion: data.ubicacion,
        piso: data.piso ? parseInt(data.piso) : null,
        tieneProyector: data.tieneProyector === true || data.tieneProyector === 'true',
        tieneAireAcondicionado: data.tieneAireAcondicionado === true || data.tieneAireAcondicionado === 'true',
        tieneInternetWifi: data.tieneInternetWifi === true || data.tieneInternetWifi === 'true',
        tienePizarron: data.tienePizarron === true || data.tienePizarron === 'true',
        tienePizarronDigital: data.tienePizarronDigital === true || data.tienePizarronDigital === 'true',
        notasRecursos: data.notasRecursos || null,
      },
    })
    revalidatePath('/administracion')
    return { success: true, espacio }
  } catch (error) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un espacio con ese código.' }
    }
    return { success: false, error: 'No se pudo crear el espacio.' }
  }
}

export async function actualizarEstadoEspacio(id, estado) {
  try {
    await prisma.espacio.update({ where: { id }, data: { estado } })
    revalidatePath('/administracion')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo actualizar el estado.' }
  }
}

// ─── Reservaciones ────────────────────────────────────────────────────────────

export async function crearReservaEspacio(data) {
  try {
    const inicio = new Date(data.fechaInicio)
    const fin = new Date(data.fechaFin)

    if (fin <= inicio) {
      return { success: false, error: 'La fecha de fin debe ser posterior al inicio.' }
    }

    // Verificar capacidad del espacio
    const espacio = await prisma.espacio.findUnique({
      where: { id: parseInt(data.espacioId) },
      select: { capacidad: true, nombre: true },
    })

    if (espacio && parseInt(data.cantidadPersonas) > espacio.capacidad) {
      return {
        success: false,
        error: `Capacidad superada. "${espacio.nombre}" tiene un máximo de ${espacio.capacidad} personas. Elige otro salón o reduce el número de personas.`,
      }
    }

    // Verificar conflictos de horario
    const conflicto = await prisma.reservaEspacio.findFirst({
      where: {
        espacioId: parseInt(data.espacioId),
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        OR: [{ fechaInicio: { lt: fin }, fechaFin: { gt: inicio } }],
      },
    })

    if (conflicto) {
      return { success: false, error: 'El espacio ya tiene una reserva en ese horario.' }
    }

    const reserva = await prisma.reservaEspacio.create({
      data: {
        espacioId: parseInt(data.espacioId),
        solicitanteId: String(data.solicitanteId),
        titulo: data.titulo,
        proposito: data.proposito,
        fechaInicio: inicio,
        fechaFin: fin,
        cantidadPersonas: parseInt(data.cantidadPersonas),
        recurrente: data.recurrente === true,
        diasRecurrencia: data.diasRecurrencia || null,
        notas: data.notas || null,
      },
    })

    revalidatePath('/administracion')
    return { success: true, reserva }
  } catch (error) {
    console.error('crearReservaEspacio error:', error)
    return { success: false, error: 'No se pudo crear la reserva.' }
  }
}

export async function resolverReservaEspacio(id, accion, motivo = null) {
  try {
    const estado = accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA'
    await prisma.reservaEspacio.update({
      where: { id },
      data: {
        estado,
        motivoRechazo: accion === 'rechazar' ? motivo : null,
      },
    })
    revalidatePath('/administracion')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo procesar la reserva.' }
  }
}

// ─── Reportes de mantenimiento ────────────────────────────────────────────────

export async function crearReporteMantenimiento(data) {
  try {
    const reporte = await prisma.reporteMantenimiento.create({
      data: {
        espacioId: data.espacioId ? parseInt(data.espacioId) : null,
        reportadoPorId: String(data.reportadoPorId),
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipoElemento: data.tipoElemento,
        prioridad: data.prioridad,
      },
    })
    revalidatePath('/administracion')
    return { success: true, reporte }
  } catch (error) {
    console.error('crearReporteMantenimiento error:', error)
    return { success: false, error: 'No se pudo crear el reporte.' }
  }
}

export async function actualizarEstadoReporte(id, estado, notasResolucion = null) {
  try {
    await prisma.reporteMantenimiento.update({
      where: { id },
      data: {
        estado,
        notasResolucion,
        fechaResolucion: ['RESUELTO', 'CERRADO'].includes(estado) ? new Date() : null,
      },
    })
    revalidatePath('/administracion')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo actualizar el reporte.' }
  }
}

export async function eliminarEspacio(id) {
  try {
    await prisma.espacio.delete({ where: { id } })
    revalidatePath('/administracion')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar el espacio.' }
  }
}