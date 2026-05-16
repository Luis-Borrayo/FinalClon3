'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TIPO_LAB_LABEL,
  TIPO_LAB_ICON,
  ESTADO_LAB_LABEL,
  ESTADO_RESERVA_LABEL,
  ESTADO_EQUIPO_LABEL,
} from '@/lib/laboratorios/constants'
import { getDisponibilidadLab } from '@/lib/laboratorios/disponibilidad'
import {
  cambiarEstadoLaboratorio,
  actualizarLaboratorio,
  crearEquipo,
  resolverReserva,
} from '../actions'
import NuevaReservaModal from '../components/NuevaReservaModal'
import RechazarReservaModal from '../components/RechazarReservaModal'
import { useLabToast } from '../components/ToastProvider'

function estadoLabClass(estado) {
  if (estado === 'ACTIVO') return 'lab-badge-activo'
  if (estado === 'MANTENIMIENTO') return 'lab-badge-mantenimiento'
  return 'lab-badge-inactivo'
}

export default function LaboratorioDetail({ laboratorio: lab, usuarios }) {
  const router = useRouter()
  const { showToast } = useLabToast()
  const [tab, setTab] = useState('general')
  const [showReserva, setShowReserva] = useState(false)
  const [rechazarReserva, setRechazarReserva] = useState(null)
  const [pending, startTransition] = useTransition()

  const disp = getDisponibilidadLab({
    ...lab,
    reservas: (lab.reservas || []).filter((r) => r.estado === 'APROBADA'),
  })

  const tabs = useMemo(() => {
    const base = [
      { id: 'general', label: 'General', icon: 'fa-info-circle' },
      { id: 'equipos', label: 'Equipos', icon: 'fa-desktop' },
      { id: 'reservas', label: 'Reservas', icon: 'fa-calendar' },
    ]
    if ((lab.estaciones?.length ?? 0) > 0) {
      base.push({ id: 'estaciones', label: 'Estaciones', icon: 'fa-cogs' })
    }
    base.push({ id: 'pagos', label: 'Cobros', icon: 'fa-money' })
    return base
  }, [lab.estaciones])

  const handleEstado = (estado) => {
    if (!window.confirm(`¿Cambiar estado a ${ESTADO_LAB_LABEL[estado]}?`)) return
    startTransition(async () => {
      const result = await cambiarEstadoLaboratorio(lab.id, estado)
      if (result.success) {
        showToast(`Estado actualizado: ${ESTADO_LAB_LABEL[estado]}`)
        router.refresh()
      } else {
        showToast(result.error || 'Error al cambiar estado', 'error')
      }
    })
  }

  const handleEquipo = async (formData) => {
    startTransition(async () => {
      const result = await crearEquipo(lab.id, formData)
      if (result.success) {
        showToast('Equipo registrado.')
        router.refresh()
      } else {
        showToast(result.error || 'Error al registrar equipo', 'error')
      }
    })
  }

  const handleAprobar = (id) => {
    startTransition(async () => {
      const result = await resolverReserva(id, 'aprobar')
      if (result.success) {
        showToast('Reservación aprobada.')
        router.refresh()
      } else {
        showToast(result.error || 'Error', 'error')
      }
    })
  }

  const handleRechazarConfirm = async (motivo) => {
    if (!rechazarReserva) return
    const result = await resolverReserva(rechazarReserva.id, 'rechazar', motivo)
    if (result.success) {
      showToast('Reservación rechazada.')
      setRechazarReserva(null)
      router.refresh()
    } else {
      showToast(result.error || 'Error', 'error')
    }
  }

  return (
    <div className="lab-module">
      {pending && <div className="lab-loading-bar" aria-hidden="true" />}

      <Link href="/laboratorios" className="text-sm opacity-70 hover:opacity-100 mb-4 inline-flex items-center gap-1">
        <i className="fa fa-arrow-left" aria-hidden="true" /> Volver al panel
      </Link>

      <div className="lab-hero dashboard-card">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 lab-icon-wrap">
              <i className={`fa ${TIPO_LAB_ICON[lab.tipo]} text-2xl`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{lab.codigo}</p>
              <h1 className="!text-2xl !mb-1">{lab.nombre}</h1>
              <p className="!text-sm">{TIPO_LAB_LABEL[lab.tipo]} · Fase {lab.faseImplementacion}</p>
              <p className="!text-sm mt-2">
                <i className="fa fa-map-marker mr-1" aria-hidden="true" />
                {lab.ubicacion || 'Sin ubicación'}
              </p>
              <div className={`lab-avail lab-avail--${disp.status} mt-3 inline-flex`}>
                <i className={`fa ${disp.icon}`} aria-hidden="true" />
                {disp.label}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`lab-badge ${estadoLabClass(lab.estado)}`}>
              {ESTADO_LAB_LABEL[lab.estado]}
            </span>
            <select
              className="lab-input text-sm py-1.5 w-auto"
              value={lab.estado}
              onChange={(e) => handleEstado(e.target.value)}
              disabled={pending}
              aria-label="Cambiar estado operativo"
            >
              <option value="ACTIVO">Activo</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            <button type="button" className="lab-btn-primary" onClick={() => setShowReserva(true)}>
              <i className="fa fa-calendar-plus-o" aria-hidden="true" /> Reservar
            </button>
          </div>
        </div>
      </div>

      <div className="lab-stats mb-4">
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.capacidadTotal}</div>
          <div className="lab-stat-label">Capacidad</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.equipos?.length ?? 0}</div>
          <div className="lab-stat-label">Equipos</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.reservas?.length ?? 0}</div>
          <div className="lab-stat-label">Reservas recientes</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.configuraciones?.length ?? 0}</div>
          <div className="lab-stat-label">Configuraciones</div>
        </div>
      </div>

      <div className="lab-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`lab-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fa ${t.icon}`} aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card lab-card">
            <h3 className="lab-card-title mb-3">Descripción</h3>
            <p className="text-sm opacity-80 mb-4">{lab.descripcion || 'Sin descripción.'}</p>
            <h4 className="text-xs uppercase opacity-60 mb-2">Divisiones permitidas</h4>
            <div>
              {lab.configuraciones?.map((c) => (
                <span key={c.id} className="lab-config-chip">
                  {c.etiqueta} ({c.cupo})
                </span>
              ))}
            </div>
          </div>
          <div className="dashboard-card lab-card">
            <h3 className="lab-card-title mb-3">Editar datos</h3>
            <form
              action={(fd) => {
                startTransition(async () => {
                  const result = await actualizarLaboratorio(lab.id, fd)
                  if (result.success) {
                    showToast('Cambios guardados.')
                    router.refresh()
                  } else {
                    showToast(result.error || 'Error al guardar', 'error')
                  }
                })
              }}
              className="space-y-3"
            >
              <input name="nombre" defaultValue={lab.nombre} className="lab-input" required />
              <input name="ubicacion" defaultValue={lab.ubicacion || ''} className="lab-input" placeholder="Ubicación" />
              <textarea name="descripcion" defaultValue={lab.descripcion || ''} rows={2} className="lab-input" />
              <input type="number" name="capacidadTotal" defaultValue={lab.capacidadTotal} className="lab-input" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="disponiblePublico" defaultChecked={lab.disponiblePublico} />
                Disponible en panel público
              </label>
              <button type="submit" className="lab-btn-primary" disabled={pending}>
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'equipos' && (
        <div className="space-y-4">
          <div className="dashboard-card lab-card">
            <h3 className="lab-card-title mb-3">Agregar equipo</h3>
            <form action={handleEquipo} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="codigoInventario" required placeholder="Código inventario" className="lab-input" />
              <input name="nombre" required placeholder="Nombre" className="lab-input" />
              <input name="ubicacionFisica" placeholder="Ubicación física" className="lab-input" />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="esServidor" /> Es servidor
              </label>
              <button type="submit" className="lab-btn-primary sm:col-span-2" disabled={pending}>
                Registrar equipo
              </button>
            </form>
          </div>
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Servidor</th>
                </tr>
              </thead>
              <tbody>
                {(lab.equipos?.length ?? 0) === 0 ? (
                  <tr><td colSpan={4} className="text-center opacity-60 py-6">Sin equipos</td></tr>
                ) : (
                  lab.equipos.map((e) => (
                    <tr key={e.id}>
                      <td>{e.codigoInventario}</td>
                      <td>{e.nombre}</td>
                      <td>{ESTADO_EQUIPO_LABEL[e.estado]}</td>
                      <td>{e.esServidor ? 'Sí' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reservas' && (
        <div className="lab-table-wrap lab-table-wrap--responsive">
          {(lab.reservas?.length ?? 0) === 0 ? (
            <div className="lab-empty">Sin reservaciones</div>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Solicitante</th>
                  <th>Configuración</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lab.reservas.map((r) => (
                  <tr key={r.id}>
                    <td>{r.usuario?.nombre} {r.usuario?.apellido}</td>
                    <td>{r.configuracionDivision?.etiqueta || '—'}</td>
                    <td>{new Date(r.fechaInicio).toLocaleString('es-GT')}</td>
                    <td>{new Date(r.fechaFin).toLocaleString('es-GT')}</td>
                    <td>{ESTADO_RESERVA_LABEL[r.estado]}</td>
                    <td>
                      {r.estado === 'PENDIENTE' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="lab-btn-primary text-sm"
                            disabled={pending}
                            onClick={() => handleAprobar(r.id)}
                          >
                            <i className="fa fa-check" /> Aprobar
                          </button>
                          <button
                            type="button"
                            className="lab-btn-ghost text-sm"
                            disabled={pending}
                            onClick={() => setRechazarReserva(r)}
                          >
                            <i className="fa fa-times" /> Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'estaciones' && (
        <div className="dashboard-card lab-card">
          <h3 className="lab-card-title mb-3">Estaciones (PLC/CNC)</h3>
          <ul className="space-y-2">
            {lab.estaciones.map((e) => (
              <li key={e.id} className="flex justify-between items-center py-2 border-b border-white/5">
                <span><strong>{e.nombre}</strong> — {e.tipo}</span>
                <span className="text-xs opacity-50">Orden {e.orden}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'pagos' && (
        <div className="lab-table-wrap">
          {(lab.pagos?.length ?? 0) === 0 ? (
            <div className="lab-empty">Sin cobros</div>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Método</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {lab.pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.usuario?.nombre}</td>
                    <td>Q {Number(p.monto).toFixed(2)}</td>
                    <td>{p.tipoCobro}</td>
                    <td>{p.metodoPago}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('es-GT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showReserva && (
        <NuevaReservaModal
          laboratorios={[lab]}
          usuarios={usuarios}
          laboratorioIdDefault={lab.id}
          onClose={(msg, type) => {
            setShowReserva(false)
            if (typeof msg === 'string' && msg) showToast(msg, type)
            router.refresh()
          }}
        />
      )}
      {rechazarReserva && (
        <RechazarReservaModal
          reserva={rechazarReserva}
          onClose={() => setRechazarReserva(null)}
          onConfirm={handleRechazarConfirm}
        />
      )}
    </div>
  )
}
