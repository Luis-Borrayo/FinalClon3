'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  TIPO_ESPACIO_LABEL,
  TIPO_ESPACIO_ICON_FA,
  ESTADO_ESPACIO_LABEL,
  ESTADO_RESERVA_ESPACIO_LABEL,
  PRIORIDAD_LABEL,
  PRIORIDAD_COLOR,
  ESTADO_REPORTE_LABEL,
  TIPO_ELEMENTO_LABEL,
  TIPO_ELEMENTO_ICON,
} from '@/lib/administracion/constants'
import NuevoEspacioModal from './components/NuevoEspacioModal'
import NuevaReservaEspacioModal from './components/NuevaReservaEspacioModal'
import NuevoReporteModal from './components/NuevoReporteModal'
import { useAdmToast } from './components/ToastProvider'
import {
  resolverReservaEspacio,
  actualizarEstadoReporte,
  actualizarEstadoEspacio,
  eliminarEspacio,
  getReservasMes,
} from './actions'

function estadoEspacioClass(estado) {
  if (estado === 'DISPONIBLE') return 'adm-badge-disponible'
  if (estado === 'OCUPADO') return 'adm-badge-ocupado'
  if (estado === 'MANTENIMIENTO') return 'adm-badge-mantenimiento'
  return 'adm-badge-fuera'
}

function formatFecha(date) {
  return new Date(date).toLocaleString('es-GT', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatHora(date) {
  return new Date(date).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

// ── Calendario mensual ────────────────────────────────────────────────────────
function CalendarioMensual({ reservasPendientes, onAprobar, onRechazar, pending }) {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth()) // 0-indexed
  const [reservasMes, setReservasMes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [conflictoModal, setConflictoModal] = useState(null) // { reservaPendiente, conflictos }

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const cargarMes = useCallback(async () => {
    setCargando(true)
    const result = await getReservasMes(anio, mes)
    setReservasMes(result || [])
    setCargando(false)
  }, [anio, mes])

  useEffect(() => { cargarMes() }, [cargarMes])

  const irMesAnterior = () => {
    if (mes === 0) { setMes(11); setAnio(a => a - 1) }
    else setMes(m => m - 1)
    setDiaSeleccionado(null)
  }

  const irMesSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio(a => a + 1) }
    else setMes(m => m + 1)
    setDiaSeleccionado(null)
  }

  // Construir grilla del mes
  const primerDia = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const reservasDelDia = (dia) => {
    if (!dia) return []
    return reservasMes.filter(r => {
      const f = new Date(r.fechaInicio)
      return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === dia
    })
  }

  const pendientesDelDia = (dia) => {
    if (!dia) return []
    return reservasPendientes.filter(r => {
      const f = new Date(r.fechaInicio)
      return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === dia
    })
  }

  const esHoy = (dia) => {
    return dia && anio === hoy.getFullYear() && mes === hoy.getMonth() && dia === hoy.getDate()
  }

  // Verificar conflictos antes de aprobar
  const verificarYAprobar = (reservaPendiente) => {
    const inicio = new Date(reservaPendiente.fechaInicio)
    const fin = new Date(reservaPendiente.fechaFin)

    const conflictos = reservasMes.filter(r => {
      if (r.espacioId !== reservaPendiente.espacioId) return false
      const rInicio = new Date(r.fechaInicio)
      const rFin = new Date(r.fechaFin)
      return rInicio < fin && rFin > inicio
    })

    if (conflictos.length > 0) {
      setConflictoModal({ reservaPendiente, conflictos })
    } else {
      onAprobar(reservaPendiente.id)
    }
  }

  const reservasDiaSeleccionado = diaSeleccionado
      ? [...reservasDelDia(diaSeleccionado), ...pendientesDelDia(diaSeleccionado)]
      : []

  return (
      <div>
        {/* Navegación del mes */}
        <div className="flex items-center justify-between mb-4 dashboard-card" style={{ padding: '12px 16px' }}>
          <button type="button" className="adm-btn-ghost" onClick={irMesAnterior}>
            <i className="fa fa-chevron-left" />
          </button>
          <h2 className="adm-section-title mb-0" style={{ margin: 0 }}>
            <i className="fa fa-calendar" /> {MESES[mes]} {anio}
            {cargando && <i className="fa fa-spinner fa-spin ml-2 opacity-50" />}
          </h2>
          <button type="button" className="adm-btn-ghost" onClick={irMesSiguiente}>
            <i className="fa fa-chevron-right" />
          </button>
        </div>

        {/* Grilla del calendario */}
        <div className="dashboard-card" style={{ padding: '16px' }}>
          {/* Encabezados días semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', opacity: 0.5, fontWeight: 600, padding: '4px' }}>
                  {d}
                </div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={`empty-${i}`} />
              const aprobadas = reservasDelDia(dia)
              const pendientes = pendientesDelDia(dia)
              const seleccionado = diaSeleccionado === dia
              const hoyFlag = esHoy(dia)

              return (
                  <button
                      key={dia}
                      type="button"
                      onClick={() => setDiaSeleccionado(seleccionado ? null : dia)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: seleccionado ? '2px solid var(--adm-primary, #7c1c2e)' : '2px solid transparent',
                        background: hoyFlag ? 'var(--adm-primary-light, rgba(124,28,46,0.12))' : 'transparent',
                        cursor: 'pointer',
                        minHeight: '52px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                  >
                <span style={{
                  fontSize: '13px',
                  fontWeight: hoyFlag ? 700 : 400,
                  color: hoyFlag ? 'var(--adm-primary, #7c1c2e)' : 'inherit',
                }}>
                  {dia}
                </span>
                    {aprobadas.length > 0 && (
                        <span style={{
                          fontSize: '9px', background: '#22c55e', color: '#fff',
                          borderRadius: '4px', padding: '1px 4px', fontWeight: 600,
                        }}>
                    {aprobadas.length} res.
                  </span>
                    )}
                    {pendientes.length > 0 && (
                        <span style={{
                          fontSize: '9px', background: '#f59e0b', color: '#fff',
                          borderRadius: '4px', padding: '1px 4px', fontWeight: 600,
                        }}>
                    {pendientes.length} pend.
                  </span>
                    )}
                  </button>
              )
            })}
          </div>
        </div>

        {/* Detalle del día seleccionado */}
        {diaSeleccionado && (
            <div className="dashboard-card" style={{ marginTop: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', opacity: 0.8 }}>
                <i className="fa fa-calendar-o mr-1" />
                {diaSeleccionado} de {MESES[mes]} de {anio}
              </h3>

              {reservasDiaSeleccionado.length === 0 ? (
                  <p style={{ opacity: 0.5, fontSize: '13px' }}>Sin reservas este día.</p>
              ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reservasDiaSeleccionado.map((r) => {
                      const esPendiente = r.estado === 'PENDIENTE'
                      return (
                          <div key={r.id} style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${esPendiente ? '#f59e0b44' : '#22c55e44'}`,
                            background: esPendiente ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
                          }}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>{r.titulo}</p>
                                <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                                  <i className="fa fa-building mr-1" />{r.espacio?.nombre} ({r.espacio?.codigo})
                                </p>
                                <p style={{ fontSize: '12px', opacity: 0.6 }}>
                                  <i className="fa fa-clock-o mr-1" />
                                  {formatHora(r.fechaInicio)} — {formatHora(r.fechaFin)}
                                </p>
                              </div>
                              <span className={`adm-badge ${esPendiente ? 'adm-badge-pendiente' : 'adm-badge-aprobada'}`}>
                        {ESTADO_RESERVA_ESPACIO_LABEL[r.estado]}
                      </span>
                            </div>

                            {esPendiente && (
                                <div className="flex gap-2 mt-2">
                                  <button type="button" className="adm-btn-primary adm-btn-xs" disabled={pending}
                                          onClick={() => verificarYAprobar(r)}>
                                    <i className="fa fa-check" /> Aprobar
                                  </button>
                                  <button type="button" className="adm-btn-ghost adm-btn-xs" disabled={pending}
                                          onClick={() => onRechazar(r.id)}>
                                    <i className="fa fa-times" /> Rechazar
                                  </button>
                                </div>
                            )}
                          </div>
                      )
                    })}
                  </div>
              )}
            </div>
        )}

        {/* Modal de conflicto */}
        {conflictoModal && (
            <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setConflictoModal(null)}>
              <div className="adm-modal">
                <div className="adm-modal-header">
                  <h2><i className="fa fa-exclamation-triangle" style={{ color: '#f59e0b' }} /> Conflicto de horario</h2>
                  <button type="button" className="adm-modal-close" onClick={() => setConflictoModal(null)}>
                    <i className="fa fa-times" />
                  </button>
                </div>
                <div className="adm-modal-body">
                  <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                    La reserva <strong>"{conflictoModal.reservaPendiente.titulo}"</strong> se traslapa con:
                  </p>
                  {conflictoModal.conflictos.map(c => (
                      <div key={c.id} style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e44',
                        marginBottom: '8px', fontSize: '13px',
                      }}>
                        <p style={{ fontWeight: 600 }}>{c.titulo}</p>
                        <p style={{ opacity: 0.6 }}>{formatHora(c.fechaInicio)} — {formatHora(c.fechaFin)}</p>
                        <p style={{ opacity: 0.6 }}>{c.espacio?.nombre}</p>
                      </div>
                  ))}
                  <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '12px' }}>
                    ¿Deseas aprobar de todas formas, rechazar o cancelar para reprogramar?
                  </p>
                </div>
                <div className="adm-modal-footer">
                  <button type="button" className="adm-btn-ghost" onClick={() => setConflictoModal(null)}>
                    <i className="fa fa-calendar" /> Cancelar / Reprogramar
                  </button>
                  <button type="button" className="adm-btn-ghost" disabled={pending}
                          onClick={() => {
                            onRechazar(conflictoModal.reservaPendiente.id)
                            setConflictoModal(null)
                          }}>
                    <i className="fa fa-times" /> Rechazar
                  </button>
                  <button type="button" className="adm-btn-primary" disabled={pending}
                          onClick={() => {
                            onAprobar(conflictoModal.reservaPendiente.id)
                            setConflictoModal(null)
                          }}>
                    <i className="fa fa-check" /> Aprobar de todas formas
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function AdministracionDashboard({ initialData, userRole = 'ADMIN' }) {
  const isStudent = userRole === 'STUDENT' || userRole === 'TEACHER'
  const router = useRouter()
  const { showToast } = useAdmToast()
  const [tab, setTab] = useState(isStudent ? 'mantenimiento' : 'espacios')
  const [showEspacioModal, setShowEspacioModal] = useState(false)
  const [showReservaModal, setShowReservaModal] = useState(false)
  const [showReporteModal, setShowReporteModal] = useState(false)
  const [pending, startTransition] = useTransition()

  const { espacios, reservasPendientes, reservasHoy, reportesAbiertos, usuarios, stats } = initialData

  const goTab = (id) => {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAprobarReserva = (id) => {
    startTransition(async () => {
      const result = await resolverReservaEspacio(id, 'aprobar')
      if (result.success) {
        showToast('Reserva aprobada.')
        router.refresh()
      } else {
        showToast(result.error || 'No se pudo aprobar.', 'error')
      }
    })
  }

  const handleRechazarReserva = (id) => {
    const motivo = window.prompt('Motivo del rechazo (opcional):')
    if (motivo === null) return
    startTransition(async () => {
      const result = await resolverReservaEspacio(id, 'rechazar', motivo)
      if (result.success) {
        showToast('Reserva rechazada.')
        router.refresh()
      } else {
        showToast(result.error || 'No se pudo rechazar.', 'error')
      }
    })
  }

  const handleResolverReporte = (id, estado) => {
    startTransition(async () => {
      const result = await actualizarEstadoReporte(id, estado)
      if (result.success) {
        showToast(`Reporte marcado como ${ESTADO_REPORTE_LABEL[estado]}.`)
        router.refresh()
      } else {
        showToast(result.error || 'No se pudo actualizar.', 'error')
      }
    })
  }

  const handleEliminarEspacio = (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const r = await eliminarEspacio(id)
      if (r.success) {
        showToast('Espacio eliminado.')
        router.refresh()
      } else {
        showToast(r.error || 'No se pudo eliminar.', 'error')
      }
    })
  }

  const allTabs = [
    { id: 'espacios',      label: 'Espacios',      icon: 'fa-building' },
    { id: 'calendario',    label: 'Calendario',    icon: 'fa-calendar',  badge: stats.reservasHoy },
    { id: 'reservas',      label: 'Reservas',      icon: 'fa-clock-o',   badge: stats.reservasPendientes },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: 'fa-wrench',    badge: stats.reportesAbiertos },
  ]
  const tabs = isStudent
    ? allTabs.filter((t) => t.id === 'mantenimiento')
    : allTabs

  const statItems = [
    { id: 'espacios', label: 'Total Espacios', value: stats.totalEspacios },
    { id: 'espacios', label: 'Disponibles', value: stats.espaciosDisponibles },
    { id: 'calendario', label: 'Reservas Hoy', value: stats.reservasHoy },
    { id: 'reservas', label: 'Pendientes', value: stats.reservasPendientes, alert: stats.reservasPendientes > 0 },
    { id: 'mantenimiento', label: 'Reportes Abiertos', value: stats.reportesAbiertos, alert: stats.reportesUrgentes > 0 },
  ]

  return (
      <div className="adm-module">
        {pending && <div className="adm-loading-bar" aria-hidden="true" />}

        {/* Hero */}
        <div className="adm-hero dashboard-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70 mb-1">
                USPG · Administración de Instalaciones
              </p>
              <h1>Gestión de Espacios Físicos</h1>
              <p>Reserva de salones, auditorios y laboratorios · Reportes de mantenimiento</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.reservasPendientes > 0 && (
                  <button type="button" className="adm-btn-primary" onClick={() => goTab('reservas')}>
                    <i className="fa fa-bell" />
                    {stats.reservasPendientes} pendiente{stats.reservasPendientes !== 1 ? 's' : ''}
                  </button>
              )}
              {!isStudent && (
                <button type="button" className="adm-btn-ghost" onClick={() => setShowReservaModal(true)}>
                  <i className="fa fa-calendar-plus-o" /> Reservar espacio
                </button>
              )}
              <button type="button" className="adm-btn-ghost" onClick={() => setShowReporteModal(true)}>
                <i className="fa fa-wrench" /> Reportar problema
              </button>
              {!isStudent && (
                <button type="button" className="adm-btn-ghost" onClick={() => setShowEspacioModal(true)}>
                  <i className="fa fa-plus" /> Nuevo espacio
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="adm-stats">
          {statItems.map((s, i) => (
              <button
                  key={`${s.label}-${i}`}
                  type="button"
                  className="adm-stat adm-stat--clickable"
                  onClick={() => goTab(s.id)}
              >
                <div className={`adm-stat-value ${s.alert ? 'adm-stat-value--alert' : ''}`}>
                  {s.value}
                </div>
                <div className="adm-stat-label">{s.label}</div>
              </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="adm-tabs" role="tablist">
          {tabs.map((t) => (
              <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`adm-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => goTab(t.id)}
              >
                <i className={`fa ${t.icon}`} aria-hidden="true" /> {t.label}
                {t.badge > 0 && <span className="adm-tab-badge">{t.badge}</span>}
              </button>
          ))}
        </div>

        {/* ── Tab: Espacios ──────────────────────────────────────────────────── */}
        {tab === 'espacios' && (
            <>
              {espacios.length === 0 ? (
                  <div className="adm-empty dashboard-card adm-card">
                    <i className="fa fa-building text-3xl mb-3 opacity-40" aria-hidden="true" />
                    <p className="mb-2">No hay espacios registrados.</p>
                    {!isStudent && (
                      <button type="button" className="adm-btn-primary" onClick={() => setShowEspacioModal(true)}>
                        <i className="fa fa-plus" /> Agregar primer espacio
                      </button>
                    )}
                  </div>
              ) : (
                  <div className="adm-grid">
                    {espacios.map((esp) => {
                      const reservasActivas = esp.reservasEspacio || []
                      return (
                          <article key={esp.id} className="dashboard-card adm-card">
                            <div className="flex justify-between items-start mb-3">
                              <div className="adm-icon-wrap">
                                <i className={`fa ${TIPO_ESPACIO_ICON_FA[esp.tipo] || 'fa-building'} text-xl`} aria-hidden="true" />
                              </div>
                              <span className="adm-tipo-chip">{TIPO_ESPACIO_LABEL[esp.tipo]}</span>
                            </div>
                            <p className="text-xs opacity-60 mb-1">{esp.codigo}</p>
                            <h3 className="adm-card-title break-words">{esp.nombre}</h3>
                            <div className={`adm-estado-badge ${estadoEspacioClass(esp.estado)} mb-2`}>
                              {ESTADO_ESPACIO_LABEL[esp.estado]}
                            </div>
                            <p className="text-sm opacity-70 mb-2 line-clamp-2 min-h-[2.5rem]">
                              {esp.descripcion || 'Sin descripción'}
                            </p>
                            <p className="text-xs opacity-60 mb-3">
                              <i className="fa fa-map-marker mr-1" />
                              {esp.ubicacion}{esp.piso ? ` · Piso ${esp.piso}` : ''}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm mb-3">
                              <span><i className="fa fa-users mr-1 opacity-50" />{esp.capacidad} plazas</span>
                              {esp.tieneProyector && <span className="adm-recurso-chip"><i className="fa fa-video-camera" /> Proyector</span>}
                              {esp.tieneAireAcondicionado && <span className="adm-recurso-chip"><i className="fa fa-snowflake-o" /> A/C</span>}
                              {esp.tieneInternetWifi && <span className="adm-recurso-chip"><i className="fa fa-wifi" /> WiFi</span>}
                            </div>
                            {reservasActivas.length > 0 && (
                                <div className="adm-proximas">
                                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1">Próximas</p>
                                  {reservasActivas.map((r) => (
                                      <div key={r.id} className="adm-proxima-item">
                                        <i className="fa fa-clock-o opacity-50" />
                                        <span>{formatHora(r.fechaInicio)} – {formatHora(r.fechaFin)}</span>
                                        <span className="truncate opacity-70">{r.titulo}</span>
                                      </div>
                                  ))}
                                </div>
                            )}
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <button type="button" className="adm-btn-ghost flex-1 justify-center text-xs"
                                      onClick={() => setShowReservaModal(true)}>
                                <i className="fa fa-calendar-plus-o" /> Reservar
                              </button>
                              {esp.estado === 'MANTENIMIENTO' ? (
                                  <button type="button" className="adm-btn-ghost flex-1 justify-center text-xs"
                                          disabled={pending}
                                          onClick={() => {
                                            startTransition(async () => {
                                              const r = await actualizarEstadoEspacio(esp.id, 'DISPONIBLE')
                                              if (r.success) { showToast('Espacio marcado como disponible.'); router.refresh() }
                                            })
                                          }}>
                                    <i className="fa fa-check" /> Disponible
                                  </button>
                              ) : (
                                  <button type="button" className="adm-btn-ghost flex-1 justify-center text-xs"
                                          disabled={pending}
                                          onClick={() => {
                                            startTransition(async () => {
                                              const r = await actualizarEstadoEspacio(esp.id, 'MANTENIMIENTO')
                                              if (r.success) { showToast('Espacio en mantenimiento.'); router.refresh() }
                                            })
                                          }}>
                                    <i className="fa fa-wrench" /> Mantenimiento
                                  </button>
                              )}
                              {!isStudent && (
                                <button type="button"
                                        className="adm-btn-ghost flex-1 justify-center text-xs text-red-400 hover:text-red-300"
                                        disabled={pending}
                                        onClick={() => handleEliminarEspacio(esp.id, esp.nombre)}>
                                  <i className="fa fa-trash" /> Borrar
                                </button>
                              )}
                            </div>
                          </article>
                      )
                    })}
                  </div>
              )}
            </>
        )}

        {/* ── Tab: Calendario mensual ────────────────────────────────────────── */}
        {tab === 'calendario' && (
            <CalendarioMensual
                reservasPendientes={reservasPendientes}
                onAprobar={handleAprobarReserva}
                onRechazar={handleRechazarReserva}
                pending={pending}
            />
        )}

        {/* ── Tab: Reservas pendientes ───────────────────────────────────────── */}
        {tab === 'reservas' && (
            <div className="adm-table-wrap adm-table-wrap--responsive">
              {reservasPendientes.length === 0 ? (
                  <div className="adm-empty dashboard-card">
                    <i className="fa fa-check-circle text-3xl mb-3 opacity-40" />
                    <p>No hay reservas pendientes de aprobación.</p>
                  </div>
              ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="md:hidden">
                      {reservasPendientes.map((r) => (
                          <div key={r.id} className="adm-reserva-card">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold">{r.titulo}</p>
                              <span className="adm-badge adm-badge-pendiente">Pendiente</span>
                            </div>
                            <p className="text-sm opacity-70 mb-1">
                              <i className="fa fa-building mr-1" />{r.espacio?.nombre}
                            </p>
                            <p className="text-xs opacity-60 mb-3">
                              {formatFecha(r.fechaInicio)} — {formatFecha(r.fechaFin)}
                            </p>
                            <div className="flex gap-2">
                              <button type="button" className="adm-btn-primary flex-1 justify-center"
                                      disabled={pending} onClick={() => handleAprobarReserva(r.id)}>
                                <i className="fa fa-check" /> Aprobar
                              </button>
                              <button type="button" className="adm-btn-ghost flex-1 justify-center"
                                      disabled={pending} onClick={() => handleRechazarReserva(r.id)}>
                                <i className="fa fa-times" /> Rechazar
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <table className="adm-table hidden md:table">
                      <thead>
                      <tr>
                        <th>Espacio</th>
                        <th>Título</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Personas</th>
                        <th>Acciones</th>
                      </tr>
                      </thead>
                      <tbody>
                      {reservasPendientes.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <span className="font-medium">{r.espacio?.nombre}</span><br />
                              <span className="text-xs opacity-50">{r.espacio?.codigo}</span>
                            </td>
                            <td>
                              <span className="font-medium">{r.titulo}</span><br />
                              <span className="text-xs opacity-60">{r.proposito?.slice(0, 40)}{r.proposito?.length > 40 ? '…' : ''}</span>
                            </td>
                            <td>{formatFecha(r.fechaInicio)}</td>
                            <td>{formatFecha(r.fechaFin)}</td>
                            <td>{r.cantidadPersonas}</td>
                            <td>
                              <div className="flex gap-2 flex-wrap">
                                <button type="button" className="adm-btn-primary" disabled={pending}
                                        onClick={() => handleAprobarReserva(r.id)}>
                                  <i className="fa fa-check" /> Aprobar
                                </button>
                                <button type="button" className="adm-btn-ghost" disabled={pending}
                                        onClick={() => handleRechazarReserva(r.id)}>
                                  <i className="fa fa-times" /> Rechazar
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </>
              )}
            </div>
        )}

        {/* ── Tab: Mantenimiento ─────────────────────────────────────────────── */}
        {tab === 'mantenimiento' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="adm-section-title">
                  <i className="fa fa-wrench" /> Reportes de Mantenimiento
                  {stats.reportesUrgentes > 0 && (
                      <span className="adm-badge adm-badge-urgente ml-2">
                  {stats.reportesUrgentes} urgente{stats.reportesUrgentes !== 1 ? 's' : ''}
                </span>
                  )}
                </h2>
                <button type="button" className="adm-btn-ghost" onClick={() => setShowReporteModal(true)}>
                  <i className="fa fa-plus" /> Nuevo reporte
                </button>
              </div>

              {reportesAbiertos.length === 0 ? (
                  <div className="adm-empty dashboard-card">
                    <i className="fa fa-check-circle text-3xl mb-3 opacity-40" />
                    <p>No hay reportes de mantenimiento abiertos. ¡Todo en orden!</p>
                  </div>
              ) : (
                  <div className="adm-reporte-grid">
                    {reportesAbiertos.map((rep) => (
                        <div key={rep.id} className="dashboard-card adm-reporte-card">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="adm-reporte-icon">
                                <i className={`fa ${TIPO_ELEMENTO_ICON[rep.tipoElemento] || 'fa-wrench'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{rep.titulo}</p>
                                <p className="text-xs opacity-60">
                                  {TIPO_ELEMENTO_LABEL[rep.tipoElemento]}
                                  {rep.espacio ? ` · ${rep.espacio.nombre}` : ' · Área general'}
                                </p>
                              </div>
                            </div>
                            <span className={`adm-badge ${PRIORIDAD_COLOR[rep.prioridad]}`}>
                      {PRIORIDAD_LABEL[rep.prioridad]}
                    </span>
                          </div>
                          <p className="text-sm opacity-70 mb-3 line-clamp-2">{rep.descripcion}</p>
                          <div className="flex items-center justify-between gap-2">
                    <span className="text-xs opacity-50">
                      <i className="fa fa-clock-o mr-1" />
                      {new Date(rep.createdAt).toLocaleDateString('es-GT')}
                    </span>
                            {!isStudent && (
                              <div className="flex gap-1">
                                {rep.estado === 'ABIERTO' && (
                                    <button type="button" className="adm-btn-ghost adm-btn-xs"
                                            disabled={pending}
                                            onClick={() => handleResolverReporte(rep.id, 'EN_PROCESO')}>
                                      <i className="fa fa-play" /> En proceso
                                    </button>
                                )}
                                {rep.estado !== 'RESUELTO' && rep.estado !== 'CERRADO' && (
                                    <button type="button" className="adm-btn-primary adm-btn-xs"
                                            disabled={pending}
                                            onClick={() => handleResolverReporte(rep.id, 'RESUELTO')}>
                                      <i className="fa fa-check" /> Resuelto
                                    </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}

        {/* Modals */}
        {showEspacioModal && (
            <NuevoEspacioModal onClose={(msg, type) => {
              setShowEspacioModal(false)
              if (msg) { showToast(msg, type); router.refresh() }
            }} />
        )}
        {showReservaModal && (
            <NuevaReservaEspacioModal
                espacios={espacios}
                usuarios={usuarios}
                onClose={(msg, type) => {
                  setShowReservaModal(false)
                  if (msg) { showToast(msg, type); router.refresh() }
                }}
            />
        )}
        {showReporteModal && (
            <NuevoReporteModal
                espacios={espacios}
                onClose={(msg, type) => {
                  setShowReporteModal(false)
                  if (msg) { showToast(msg, type); router.refresh() }
                }}
            />
        )}
      </div>
  )
}