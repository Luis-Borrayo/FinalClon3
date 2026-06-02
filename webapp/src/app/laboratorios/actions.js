'use server'

import { prisma } from '@/lib/prisma-laboratorios'
import { revalidatePath } from 'next/cache'
import { requireServerRole } from '@/lib/server-auth'

const labInclude = {
  configuraciones: { where: { activo: true }, orderBy: { orden: 'asc' } },
  estaciones: { where: { activo: true }, orderBy: { orden: 'asc' } },
  _count: { select: { equipos: true, reservas: true } },
}

export async function getDashboardData() {
  try {
    const [laboratorios, reservasPendientes, equipos, pagosRecientes, usuariosActivos] =
      await Promise.all([
        prisma.laboratorio.findMany({
          include: {
            ...labInclude,
            reservas: {
              where: {
                estado: { in: ['APROBADA', 'PENDIENTE'] },
                fechaFin: { gte: new Date() },
              },
              orderBy: { fechaInicio: 'asc' },
              take: 5,
            },
          },
          orderBy: [{ faseImplementacion: 'asc' }, { nombre: 'asc' }],
        }),
        prisma.reserva.findMany({
          where: { estado: 'PENDIENTE' },
          include: {
            usuario: { select: { nombre: true, apellido: true, correo: true } },
            laboratorio: { select: { nombre: true, codigo: true } },
            configuracionDivision: { select: { etiqueta: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.equipo.findMany({
          include: { laboratorio: { select: { nombre: true, codigo: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        }),
        prisma.pago.findMany({
          include: {
            usuario: { select: { nombre: true, correo: true } },
            laboratorio: { select: { nombre: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.usuario.count({ where: { activo: true, sancionado: false } }),
      ])

    const stats = {
      totalLabs: laboratorios.length,
      labsActivos: laboratorios.filter((l) => l.estado === 'ACTIVO').length,
      reservasPendientes: reservasPendientes.length,
      equiposOperativos: equipos.filter((e) => e.estado === 'OPERATIVO').length,
      usuariosActivos,
    }

    return { laboratorios, reservasPendientes, equipos, pagosRecientes, stats }
  } catch (error) {
    console.error('getDashboardData:', error)
    return {
      laboratorios: [],
      reservasPendientes: [],
      equipos: [],
      pagosRecientes: [],
      stats: {
        totalLabs: 0,
        labsActivos: 0,
        reservasPendientes: 0,
        equiposOperativos: 0,
        usuariosActivos: 0,
      },
    }
  }
}

export async function getLaboratorioById(id) {
  try {
    return await prisma.laboratorio.findUnique({
      where: { id: Number(id) },
      include: {
        configuraciones: { orderBy: { orden: 'asc' } },
        estaciones: { orderBy: { orden: 'asc' } },
        equipos: { orderBy: { nombre: 'asc' } },
        reservas: {
          include: {
            usuario: { select: { nombre: true, apellido: true, correo: true } },
            configuracionDivision: true,
          },
          orderBy: { fechaInicio: 'desc' },
          take: 20,
        },
        pagos: {
          include: { usuario: { select: { nombre: true, correo: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  } catch (error) {
    console.error('getLaboratorioById:', error)
    return null
  }
}

export async function crearLaboratorio(formData) {
  try {
    await requireServerRole('ADMIN', 'TEACHER')
    const nombre = String(formData.get('nombre') || '').trim()
    const codigo = String(formData.get('codigo') || '').trim().toUpperCase()
    const descripcion = String(formData.get('descripcion') || '').trim() || null
    const ubicacion = String(formData.get('ubicacion') || '').trim() || null
    const tipo = String(formData.get('tipo') || 'COMPUTACION')
    const capacidadTotal = parseInt(formData.get('capacidadTotal') || '30', 10)
    const faseImplementacion = parseInt(formData.get('faseImplementacion') || '1', 10)
    const permiteDivision = formData.get('permiteDivision') === 'on'

    if (!nombre || !codigo) {
      return { success: false, error: 'Nombre y código son obligatorios.' }
    }

    await prisma.laboratorio.create({
      data: {
        nombre,
        codigo,
        descripcion,
        ubicacion,
        tipo,
        capacidadTotal,
        permiteDivision,
        faseImplementacion,
        estado: 'ACTIVO',
        configuraciones: permiteDivision
          ? {
              create: [
                { etiqueta: 'Grupo completo', cupo: capacidadTotal, esGrupoCompleto: true, orden: 99 },
              ],
            }
          : {
              create: [
                {
                  etiqueta: `Grupo completo (${capacidadTotal})`,
                  cupo: capacidadTotal,
                  esGrupoCompleto: true,
                  orden: 1,
                },
              ],
            },
      },
    })

    revalidatePath('/laboratorios')
    return { success: true }
  } catch (error) {
    console.error('crearLaboratorio:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'El código de laboratorio ya existe.' }
    }
    return { success: false, error: 'No se pudo crear el laboratorio.' }
  }
}

export async function actualizarLaboratorio(id, formData) {
  try {
    await requireServerRole('ADMIN', 'TEACHER')
    await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: {
        nombre: String(formData.get('nombre') || '').trim(),
        descripcion: String(formData.get('descripcion') || '').trim() || null,
        ubicacion: String(formData.get('ubicacion') || '').trim() || null,
        capacidadTotal: parseInt(formData.get('capacidadTotal') || '30', 10),
        disponiblePublico: formData.get('disponiblePublico') === 'on',
      },
    })
    revalidatePath('/laboratorios')
    revalidatePath(`/laboratorios/${id}`)
    return { success: true }
  } catch (error) {
    console.error('actualizarLaboratorio:', error)
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function cambiarEstadoLaboratorio(id, nuevoEstado) {
  try {
    await requireServerRole('ADMIN')
    await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: { estado: nuevoEstado },
    })
    revalidatePath('/laboratorios')
    revalidatePath(`/laboratorios/${id}`)
    return { success: true }
  } catch (error) {
    console.error('cambiarEstadoLaboratorio:', error)
    return { success: false, error: 'No se pudo cambiar el estado.' }
  }
}

export async function crearEquipo(laboratorioId, formData) {
  try {
    await requireServerRole('ADMIN')
    await prisma.equipo.create({
      data: {
        laboratorioId: Number(laboratorioId),
        codigoInventario: String(formData.get('codigoInventario') || '').trim(),
        nombre: String(formData.get('nombre') || '').trim(),
        esServidor: formData.get('esServidor') === 'on',
        ubicacionFisica: String(formData.get('ubicacionFisica') || '').trim() || null,
        estado: 'OPERATIVO',
      },
    })
    revalidatePath(`/laboratorios/${laboratorioId}`)
    revalidatePath('/laboratorios')
    return { success: true }
  } catch (error) {
    console.error('crearEquipo:', error)
    return { success: false, error: 'No se pudo registrar el equipo.' }
  }
}

export async function crearReserva(formData) {
  try {
    const laboratorioId = Number(formData.get('laboratorioId'))
    const usuarioId = String(formData.get('usuarioId') || '').trim()
    const configuracionDivisionId = formData.get('configuracionDivisionId')
      ? Number(formData.get('configuracionDivisionId'))
      : null
    const fechaInicio = new Date(String(formData.get('fechaInicio')))
    const fechaFin = new Date(String(formData.get('fechaFin')))
    const cantidadPersonas = parseInt(formData.get('cantidadPersonas') || '1', 10)
    const proposito = String(formData.get('proposito') || '').trim()

    if (fechaFin <= fechaInicio) {
      return { success: false, error: 'La fecha de fin debe ser posterior al inicio.' }
    }

    const conflicto = await prisma.reserva.findFirst({
      where: {
        laboratorioId,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        fechaInicio: { lt: fechaFin },
        fechaFin: { gt: fechaInicio },
      },
    })

    if (conflicto) {
      return { success: false, error: 'Conflicto de horario con otra reservación.' }
    }

    await prisma.reserva.create({
      data: {
        laboratorioId,
        usuarioId,
        configuracionDivisionId,
        fechaInicio,
        fechaFin,
        cantidadPersonas,
        proposito,
        estado: 'PENDIENTE',
      },
    })

    revalidatePath('/laboratorios')
    revalidatePath(`/laboratorios/${laboratorioId}`)
    return { success: true }
  } catch (error) {
    console.error('crearReserva:', error)
    return { success: false, error: 'No se pudo crear la reservación.' }
  }
}

export async function resolverReserva(reservaId, accion, motivo = '') {
  try {
    await requireServerRole('ADMIN', 'TEACHER')
    const tecnico = await prisma.usuario.findFirst({ where: { rol: 'TECNICO' } })
    const data =
      accion === 'aprobar'
        ? {
            estado: 'APROBADA',
            aprobadaPorId: tecnico?.id ?? null,
            motivoRechazo: null,
          }
        : accion === 'rechazar'
          ? { estado: 'RECHAZADA', motivoRechazo: motivo || 'Rechazada por el técnico' }
          : { estado: 'CANCELADA', motivoCancelacion: motivo || 'Cancelada' }

    const reserva = await prisma.reserva.update({
      where: { id: reservaId },
      data,
    })

    revalidatePath('/laboratorios')
    revalidatePath(`/laboratorios/${reserva.laboratorioId}`)
    return { success: true }
  } catch (error) {
    console.error('resolverReserva:', error)
    return { success: false, error: 'No se pudo actualizar la reservación.' }
  }
}

export async function registrarPago(formData) {
  try {
    await requireServerRole('ADMIN')
    await prisma.pago.create({
      data: {
        usuarioId: String(formData.get('usuarioId')),
        laboratorioId: formData.get('laboratorioId')
          ? Number(formData.get('laboratorioId'))
          : null,
        monto: parseFloat(String(formData.get('monto') || '0')),
        tipoCobro: String(formData.get('tipoCobro') || 'PAGO_HORA'),
        metodoPago: String(formData.get('metodoPago') || 'EFECTIVO'),
        estado: 'PAGADO',
        notas: String(formData.get('notas') || '').trim() || null,
      },
    })
    revalidatePath('/laboratorios')
    return { success: true }
  } catch (error) {
    console.error('registrarPago:', error)
    return { success: false, error: 'No se pudo registrar el pago.' }
  }
}

export async function getUsuariosSelect() {
  try {
    return await prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true, correo: true, rol: true },
      orderBy: { nombre: 'asc' },
    })
  } catch {
    return []
  }
}
