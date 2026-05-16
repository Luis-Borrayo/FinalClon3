'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TIPO_LAB_LABEL,
  TIPO_LAB_ICON,
  ESTADO_LAB_LABEL,
  ESTADO_RESERVA_LABEL,
  TIPO_COBRO_LABEL,
  ESTADO_EQUIPO_LABEL,
} from '@/lib/laboratorios/constants'
import { getDisponibilidadLab } from '@/lib/laboratorios/disponibilidad'
import NuevoLaboratorioModal from './components/NuevoLaboratorioModal'
import NuevaReservaModal from './components/NuevaReservaModal'
import NuevoPagoModal from './components/NuevoPagoModal'
import RechazarReservaModal from './components/RechazarReservaModal'
import { useLabToast } from './components/ToastProvider'
import { resolverReserva } from './actions'

function estadoLabClass(estado) {
  if (estado === 'ACTIVO') return 'lab-badge-activo'
  if (estado === 'MANTENIMIENTO') return 'lab-badge-mantenimiento'
  return 'lab-badge-inactivo'
}

export default function LaboratoriosDashboard({ initialData }) {
  const router = useRouter()
  const { showToast } = useLabToast()
  const [tab, setTab] = useState('resumen')
  const [showLabModal, setShowLabModal] = useState(false)
  const [showReservaModal, setShowReservaModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [rechazarReserva, setRechazarReserva] = useState(null)
  const [pending, startTransition] = useTransition()

  const {
    laboratorios,
    reservasPendientes,
    equipos,
    pagosRecientes,
    stats,
    usuarios,
  } = initialData

  const pendientes = stats.reservasPendientes

  const goTab = (id) => {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAprobar = (id) => {
    startTransition(async () => {
      const result = await resolverReserva(id, 'aprobar')
      if (result.success) {
        showToast('Reservación aprobada correctamente.')
        router.refresh()
      } else {
        showToast(result.error || 'No se pudo aprobar.', 'error')
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
      showToast(result.error || 'No se pudo rechazar.', 'error')
    }
  }

  const tabs = [
    { id: 'resumen', label: 'Laboratorios', icon: 'fa-flask' },
    { id: 'reservas', label: 'Reservaciones', icon: 'fa-calendar', badge: pendientes },
    { id: 'equipos', label: 'Equipos', icon: 'fa-desktop' },
    { id: 'pagos', label: 'Cobros', icon: 'fa-money' },
  ]

  const statItems = [
    { id: 'resumen', label: 'Laboratorios', value: stats.totalLabs },
    { id: 'resumen', label: 'Activos', value: stats.labsActivos },
    {
      id: 'reservas',
      label: 'Reservas pendientes',
      value: pendientes,
      alert: pendientes > 0,
    },
    { id: 'equipos', label: 'Equipos operativos', value: stats.equiposOperativos },
    { id: 'resumen', label: 'Usuarios activos', value: stats.usuariosActivos },
  ]

  return (
    <div className="lab-module">
      {pending && <div className="lab-loading-bar" aria-hidden="true" />}

      <div className="lab-hero dashboard-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">
              USPG · Facultad de Ingeniería
            </p>
            <h1>Sistema de Gestión de Laboratorios</h1>
            <p>Administración, reservaciones, cobros y monitoreo — Fase 1: Computación</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendientes > 0 && (
              <button
                type="button"
                className="lab-btn-primary"
                onClick={() => goTab('reservas')}
              >
                <i className="fa fa-bell" aria-hidden="true" />
                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              </button>
            )}
            <button
              type="button"
              className="lab-btn-ghost"
              onClick={() => setShowReservaModal(true)}
            >
              <i className="fa fa-calendar-plus-o" aria-hidden="true" /> Reservar
            </button>
            <button type="button" className="lab-btn-ghost" onClick={() => setShowPagoModal(true)}>
              <i className="fa fa-credit-card" aria-hidden="true" /> Registrar pago
            </button>
            <button type="button" className="lab-btn-ghost" onClick={() => setShowLabModal(true)}>
              <i className="fa fa-plus" aria-hidden="true" /> Nuevo laboratorio
            </button>
          </div>
        </div>
      </div>

      <div className="lab-stats">
        {statItems.map((s, i) => (
          <button
            key={`${s.label}-${i}`}
            type="button"
            className="lab-stat lab-stat--clickable"
            onClick={() => goTab(s.id)}
          >
            <div className={`lab-stat-value ${s.alert ? 'lab-stat-value--alert' : ''}`}>
              {s.value}
            </div>
            <div className="lab-stat-label">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="lab-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`lab-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => goTab(t.id)}
          >
            <i className={`fa ${t.icon}`} aria-hidden="true" /> {t.label}
            {t.badge > 0 && <span className="lab-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <>
          {laboratorios.length === 0 ? (
            <div className="lab-empty dashboard-card lab-card">
              <i className="fa fa-database text-3xl mb-3 opacity-40" aria-hidden="true" />
              <p className="mb-2">No hay laboratorios en la base de datos.</p>
              <p className="text-sm opacity-70">
                Ejecuta en <code>webapp</code>: <strong>npm run db:push</strong> y{' '}
                <strong>npm run db:seed</strong>
              </p>
            </div>
          ) : (
            <div className="lab-grid">
              {laboratorios.map((lab) => {
                const disp = getDisponibilidadLab(lab)
                return (
                  <article key={lab.id} className="dashboard-card lab-card">
                    <div className={`lab-avail lab-avail--${disp.status}`}>
                      <i className={`fa ${disp.icon}`} aria-hidden="true" />
                      {disp.label}
                    </div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center lab-icon-wrap">
                        <i
                          className={`fa ${TIPO_LAB_ICON[lab.tipo] || 'fa-building'} text-xl`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`lab-badge ${estadoLabClass(lab.estado)}`}>
                          {ESTADO_LAB_LABEL[lab.estado]}
                        </span>
                        <span className="lab-badge lab-badge-fase">Fase {lab.faseImplementacion}</span>
                      </div>
                    </div>
                    <p className="text-xs opacity-60 mb-1">{lab.codigo}</p>
                    <h3 className="lab-card-title">{lab.nombre}</h3>
                    <p className="text-sm opacity-70 mb-3 line-clamp-2 min-h-[2.5rem]">
                      {lab.descripcion || 'Sin descripción'}
                    </p>
                    <p className="text-xs opacity-60 mb-3">
                      <i className="fa fa-map-marker mr-1" aria-hidden="true" />
                      {lab.ubicacion || 'Ubicación no definida'}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm mb-3">
                      <span>
                        <i className="fa fa-users mr-1 opacity-50" aria-hidden="true" />
                        {lab.capacidadTotal} plazas
                      </span>
                      <span>
                        <i className="fa fa-desktop mr-1 opacity-50" aria-hidden="true" />
                        {lab._count?.equipos ?? 0} equipos
                      </span>
                      <span>{TIPO_LAB_LABEL[lab.tipo]}</span>
                    </div>
                    <div className="mb-4">
                      {lab.configuraciones?.slice(0, 4).map((c) => (
                        <span key={c.id} className="lab-config-chip">
                          {c.etiqueta}
                        </span>
                      ))}
                      {(lab.configuraciones?.length ?? 0) > 4 && (
                        <span className="lab-config-chip">+{lab.configuraciones.length - 4}</span>
                      )}
                    </div>
                    <Link
                      href={`/laboratorios/${lab.id}`}
                      className="lab-btn-primary w-full justify-center"
                    >
                      <i className="fa fa-cog" aria-hidden="true" /> Gestionar
                    </Link>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'reservas' && (
        <div className="lab-table-wrap lab-table-wrap--responsive">
          {reservasPendientes.length === 0 ? (
            <div className="lab-empty dashboard-card">No hay reservaciones pendientes de autorización.</div>
          ) : (
            <>
              <div className="md:hidden">
                {reservasPendientes.map((r) => (
                  <div key={r.id} className="lab-reserva-card">
                    <p className="font-semibold mb-1">{r.laboratorio?.nombre}</p>
                    <p className="text-sm opacity-80 mb-2">
                      {r.usuario?.nombre} {r.usuario?.apellido || ''}
                    </p>
                    <p className="text-xs opacity-60 mb-3">
                      {new Date(r.fechaInicio).toLocaleString('es-GT')} —{' '}
                      {new Date(r.fechaFin).toLocaleString('es-GT')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="lab-btn-primary flex-1 justify-center"
                        disabled={pending}
                        onClick={() => handleAprobar(r.id)}
                      >
                        <i className="fa fa-check" /> Aprobar
                      </button>
                      <button
                        type="button"
                        className="lab-btn-ghost flex-1 justify-center"
                        disabled={pending}
                        onClick={() => setRechazarReserva(r)}
                      >
                        <i className="fa fa-times" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <table className="lab-table hidden md:table">
                <thead>
                  <tr>
                    <th>Laboratorio</th>
                    <th>Solicitante</th>
                    <th>Configuración</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasPendientes.map((r) => (
                    <tr key={r.id}>
                      <td>{r.laboratorio?.nombre}</td>
                      <td>
                        {r.usuario?.nombre} {r.usuario?.apellido || ''}
                        <br />
                        <span className="text-xs opacity-60">{r.usuario?.correo}</span>
                      </td>
                      <td>{r.configuracionDivision?.etiqueta || '—'}</td>
                      <td>{new Date(r.fechaInicio).toLocaleString('es-GT')}</td>
                      <td>{new Date(r.fechaFin).toLocaleString('es-GT')}</td>
                      <td>
                        <span className="lab-badge lab-badge-pendiente">
                          {ESTADO_RESERVA_LABEL[r.estado]}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="lab-btn-primary"
                            disabled={pending}
                            onClick={() => handleAprobar(r.id)}
                          >
                            <i className="fa fa-check" /> Aprobar
                          </button>
                          <button
                            type="button"
                            className="lab-btn-ghost"
                            disabled={pending}
                            onClick={() => setRechazarReserva(r)}
                          >
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

      {tab === 'equipos' && (
        <div className="lab-table-wrap">
          {equipos.length === 0 ? (
            <div className="lab-empty">Sin equipos registrados.</div>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Laboratorio</th>
                  <th>Estado</th>
                  <th>Servidor</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => (
                  <tr key={e.id}>
                    <td>{e.codigoInventario}</td>
                    <td>{e.nombre}</td>
                    <td>
                      <Link href={`/laboratorios/${e.laboratorioId}`} className="lab-link-corinto">
                        {e.laboratorio?.nombre}
                      </Link>
                    </td>
                    <td>{ESTADO_EQUIPO_LABEL[e.estado]}</td>
                    <td>{e.esServidor ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'pagos' && (
        <div className="lab-table-wrap">
          {pagosRecientes.length === 0 ? (
            <div className="lab-empty">No hay pagos registrados.</div>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Laboratorio</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecientes.map((p) => (
                  <tr key={p.id}>
                    <td>{p.usuario?.nombre}</td>
                    <td>{p.laboratorio?.nombre || '—'}</td>
                    <td>{TIPO_COBRO_LABEL[p.tipoCobro]}</td>
                    <td>Q {Number(p.monto).toFixed(2)}</td>
                    <td>{p.metodoPago}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('es-GT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showLabModal && (
        <NuevoLaboratorioModal
          onClose={(msg, type) => {
            setShowLabModal(false)
            if (typeof msg === 'string' && msg) showToast(msg, type)
            router.refresh()
          }}
        />
      )}
      {showReservaModal && (
        <NuevaReservaModal
          laboratorios={laboratorios}
          usuarios={usuarios}
          onClose={(msg, type) => {
            setShowReservaModal(false)
            if (typeof msg === 'string' && msg) showToast(msg, type)
            router.refresh()
          }}
        />
      )}
      {showPagoModal && (
        <NuevoPagoModal
          laboratorios={laboratorios}
          usuarios={usuarios}
          onClose={(msg, type) => {
            setShowPagoModal(false)
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
