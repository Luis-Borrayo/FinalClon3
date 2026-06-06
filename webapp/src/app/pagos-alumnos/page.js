'use client'

import { useState, useEffect, useRef } from 'react'
import './pagos_alumnos.css'

/* ── Utilidades de fecha ────────────────────────────────────────────────────── */
const hoy = () => new Date().toISOString().split('T')[0]
const ahoraLocal = () =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
const ultimoDiaMes = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
}
const mesActual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/* ── Constantes ─────────────────────────────────────────────────────────────── */
const FORMAS_PAGO     = ['Efectivo', 'Tarjeta', 'Transferencia']
const MESES           = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ESTADOS_CUOTA   = ['Pendiente', 'Pagado', 'Parcial', 'Vencido']
const MOTIVOS_PAGO    = ['Título', 'Reposición de carnet', 'Constancia de estudios', 'Certificado de notas', 'Laboratorio', 'Material didáctico', 'Otro']
const TIPOS_PARQUEO   = ['Hora', 'Día', 'Mes']
const ESTADOS_PARQUEO = ['Activo', 'Finalizado', 'Reservado']

/* ── Hooks ──────────────────────────────────────────────────────────────────── */
function useNextId(endpoint) {
  const [nextId, setNextId] = useState(null)
  const refresh = async () => {
    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const d = await res.json()
        setNextId(d.next_id ?? '—')
      } else setNextId('ERR')
    } catch { setNextId('—') }
  }
  useEffect(() => { refresh() }, [])
  return [nextId, refresh]
}

function useAlumno(carnet) {
  const [alumno, setAlumno] = useState({ nombres: '', apellidos: '' })
  const timer = useRef(null)
  useEffect(() => {
    if (!carnet || carnet.length < 4) {
      setAlumno({ nombres: '', apellidos: '' })
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setAlumno({ nombres: '...', apellidos: '' })
      try {
        const res = await fetch(`/pagos-alumnos/alumnos/${carnet}`)
        if (res.ok) {
          const d = await res.json()
          setAlumno({
            nombres:   d.nombres   || d.nombre   || '',
            apellidos: d.apellidos || d.apellido || ''
          })
        } else setAlumno({ nombres: 'No encontrado', apellidos: '' })
      } catch { setAlumno({ nombres: '', apellidos: '' }) }
    }, 500)
  }, [carnet])
  return alumno
}

/* ── Componentes base ───────────────────────────────────────────────────────── */
function Inp({ className = '', ...props }) {
  return <input className={`lab-input ${className}`} {...props} />
}

function Sel({ className = '', children, ...props }) {
  return (
      <select className={`lab-input ${className}`} {...props}>
        {children}
      </select>
  )
}

function ModalRow({ children }) {
  return <div className="pa-modal-row">{children}</div>
}

function ModalSection({ children }) {
  return <div className="pa-modal-section">{children}</div>
}

function ModalBtns({ onClose, onGuardar }) {
  return (
      <div className="pa-modal-btns">
        <button className="lab-btn-primary" onClick={onGuardar}>Guardar</button>
        <button className="lab-btn-primary lab-btn-danger" onClick={onClose}>Cancelar</button>
      </div>
  )
}

function ModalBase({ title, onClose, children }) {
  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">{title}</h2>
          {children}
        </div>
      </div>
  )
}

/* ── Modal Recibo ────────────────────────────────────────────────────────────── */
function ModalRecibo({ pago, onClose }) {
  if (!pago) return null
  const idRecibo = pago.recibo || pago.id_recibo || pago.id_ref

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-recibo-modal" onClick={e => e.stopPropagation()}>

          <div className="pa-recibo-header">
            <div className="pa-recibo-logo">USPG</div>
            <div>
              <div className="pa-recibo-title">RECIBO OFICIAL</div>
              <div className="pa-recibo-sub">Sistema de Pagos Alumnos</div>
            </div>
          </div>

          <div className="pa-recibo-meta-grid">
            <div className="pa-recibo-item highlight">
              <span>No. Recibo</span>
              <strong>#{idRecibo || '—'}</strong>
            </div>
            <div className="pa-recibo-item highlight text-right">
              <span>Fecha de emisión</span>
              <strong>{pago.fecha || '—'}</strong>
            </div>
          </div>

          <div className="pa-recibo-divider" />

          <div className="pa-recibo-section-title">Datos del Alumno</div>
          <div className="pa-recibo-info-grid">
            <div className="pa-recibo-item">
              <span>Carnet</span>
              <strong>{pago.carnet}</strong>
            </div>
            <div className="pa-recibo-item">
              <span>Nombre completo</span>
              <strong>{pago.nombre} {pago.apellidos || pago.apellido}</strong>
            </div>
          </div>

          <div className="pa-recibo-divider-dashed" />

          <div className="pa-recibo-section-title">Detalle del Pago</div>
          <div className="pa-recibo-info-grid">
            <div className="pa-recibo-item">
              <span>Concepto</span>
              <strong>{pago.concepto || pago.tipo}</strong>
            </div>
            <div className="pa-recibo-item">
              <span>Descripción</span>
              <strong>{pago.descripcion || `Referencia #${pago.referencia || '—'}`}</strong>
            </div>
            <div className="pa-recibo-item">
              <span>Forma de pago</span>
              <strong>{pago.forma || '—'}</strong>
            </div>
            <div className="pa-recibo-item">
              <span>Estado</span>
              <strong>{pago.estado || 'Emitido'}</strong>
            </div>
          </div>

          <div className="pa-recibo-total-block">
            <span className="total-label">Total procesado</span>
            <strong className="total-amount">{pago.monto}</strong>
          </div>

          <div className="pa-modal-btns pa-btns-stack">
            {idRecibo && (
                <button
                    className="lab-btn-primary"
                    onClick={() => window.open(`/pagos-alumnos/recibo-pdf/${idRecibo}`, '_blank')}
                >
                  Ver PDF
                </button>
            )}
            <button className="lab-btn-primary lab-btn-danger" onClick={onClose}>Cerrar</button>
          </div>

        </div>
      </div>
  )
}

/* ── Vista: Estado de Cuenta ─────────────────────────────────────────────────── */
function VistaEstadoCuenta({ onClose, carnetFijo = null }) {
  // Si viene carnetFijo (alumno logueado), lo usamos directo y no mostramos buscador
  const [carnet,   setCarnet]   = useState(carnetFijo || '')
  const [cuenta,   setCuenta]   = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [err,      setErr]      = useState(null)

  // Si es portal alumno, cargar automáticamente al abrir
  useEffect(() => {
    if (carnetFijo) buscar(carnetFijo)
  }, [carnetFijo])

  async function buscar(c) {
    const target = c || carnet
    if (!target.trim()) return
    setBuscando(true); setErr(null); setCuenta(null)
    try {
      const res = await fetch(`/pagos-alumnos/estado-cuenta/${target.trim()}`)
      if (res.ok) setCuenta(await res.json())
      else setErr('Alumno no encontrado o sin movimientos.')
    } catch { setErr('Error de conexión.') }
    finally { setBuscando(false) }
  }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-cuenta-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">📋 Estado de Cuenta</h2>

          {/* Solo mostrar buscador al admin */}
          {!carnetFijo && (
              <div className="pa-cuenta-search-row">
                <Inp
                    placeholder="Ingresa el carnet del alumno..."
                    value={carnet}
                    onChange={e => setCarnet(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && buscar()}
                />
                <button className="lab-btn-primary" onClick={() => buscar()} disabled={buscando}>
                  {buscando ? '...' : '🔍 Buscar'}
                </button>
              </div>
          )}

          {buscando && <p style={{ color: 'var(--pa-muted)', textAlign: 'center', padding: '1rem' }}>Cargando...</p>}
          {err && <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: '0.5rem 0' }}>{err}</p>}

          {cuenta && (
              <>
                <div className="pa-cuenta-alumno">
                  <div><span>Alumno</span><strong>{cuenta.nombres} {cuenta.apellidos}</strong></div>
                  <div><span>Carnet</span><strong>{cuenta.carnet}</strong></div>
                  <div><span>Carrera</span><strong>{cuenta.carrera || '—'}</strong></div>
                </div>

                <div className="pa-cuenta-actions">
                  <button
                      className="lab-btn-primary"
                      onClick={() => window.open(`/pagos-alumnos/estado-cuenta-pdf/${cuenta.carnet}`, '_blank')}
                  >
                    Estado de Cuenta PDF
                  </button>
                  <button
                      className="lab-btn-primary"
                      onClick={() => window.open(`/pagos-alumnos/constancia-solvencia/${cuenta.carnet}`, '_blank')}
                  >
                    Constancia de Solvencia
                  </button>
                </div>

                <div className="pa-recibo-divider" />

                <div style={{ overflowX: 'auto' }}>
                  <table className="lab-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Concepto</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Mora</th>
                      <th>Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(cuenta.movimientos || []).length === 0 ? (
                        <tr><td colSpan={6}>Sin movimientos registrados</td></tr>
                    ) : (cuenta.movimientos || []).map((m, i) => (
                        <tr key={i}>
                          <td>{m.mes}</td>
                          <td>{m.concepto}</td>
                          <td>{m.fecha}</td>
                          <td><strong>{m.monto}</strong></td>
                          <td style={{ color: parseFloat(m.mora) > 0 ? '#fca5a5' : 'inherit' }}>
                            {m.mora || 'Q0.00'}
                          </td>
                          <td>
                            <span className={`badge-${(m.estado || '').toLowerCase()}`}>
                              {m.estado}
                            </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </>
          )}

          <button
              className="lab-btn-primary lab-btn-danger"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
  )
}

/* ── Vista: Agenda ────────────────────────────────────────────────────────────── */
function VistaAgenda({ onClose }) {
  const hoyDate = new Date()
  const [anio,    setAnio]    = useState(hoyDate.getFullYear())
  const [mes,     setMes]     = useState(hoyDate.getMonth())
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    fetch('/pagos-alumnos/agenda/fechas-limite')
        .then(r => r.ok ? r.json() : [])
        .then(d => setEventos(d))
        .catch(() => setEventos([]))
  }, [])

  const primerDia = new Date(anio, mes, 1).getDay()
  const diasMes   = new Date(anio, mes + 1, 0).getDate()
  const celdas    = Array.from({ length: primerDia + diasMes }, (_, i) =>
      i < primerDia ? null : i - primerDia + 1
  )

  function eventosDelDia(dia) {
    if (!dia) return []
    const fecha = `${anio}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return eventos.filter(e => e.fecha === fecha)
  }

  function esHoy(dia) {
    return dia === hoyDate.getDate() && mes === hoyDate.getMonth() && anio === hoyDate.getFullYear()
  }

  function navMes(dir) {
    if (dir === -1) {
      if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1)
    } else {
      if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1)
    }
  }

  const colores = { mensualidad: '#f59e0b', matricula: '#3b82f6', parqueo: '#10b981' }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-agenda-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">📅 Agenda — Fechas Límite de Pago</h2>

          <div className="pa-agenda-nav">
            <button className="lab-btn-primary" onClick={() => navMes(-1)}>‹</button>
            <span>{MESES[mes]} {anio}</span>
            <button className="lab-btn-primary" onClick={() => navMes(1)}>›</button>
          </div>

          <div className="pa-agenda-legend">
            <span style={{ color: colores.mensualidad }}>● Mensualidad</span>
            <span style={{ color: colores.matricula }}>● Matrícula</span>
            <span style={{ color: colores.parqueo }}>● Parqueo</span>
          </div>

          <div className="pa-agenda-grid">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                <div key={d} className="pa-agenda-head">{d}</div>
            ))}
            {celdas.map((dia, i) => {
              const ev = eventosDelDia(dia)
              return (
                  <div
                      key={i}
                      className={[
                        'pa-agenda-cell',
                        esHoy(dia) ? 'pa-agenda-hoy'  : '',
                        !dia       ? 'pa-agenda-vacio' : ''
                      ].join(' ')}
                  >
                    {dia && <span className="pa-agenda-dia">{dia}</span>}
                    {ev.map((e, j) => (
                        <div
                            key={j}
                            className="pa-agenda-evento"
                            style={{ background: colores[e.tipo] || '#6b7280' }}
                            title={e.descripcion}
                        >
                          {e.descripcion?.slice(0, 12)}
                        </div>
                    ))}
                  </div>
              )
            })}
          </div>

          <div className="pa-agenda-proximos">
            <strong>Próximos vencimientos</strong>
            {eventos.filter(e => e.fecha >= hoy()).slice(0, 5).map((e, i) => (
                <div key={i} className="pa-agenda-prox-item">
                  <span style={{ color: colores[e.tipo] || '#6b7280' }}>●</span>
                  <span>{e.fecha}</span>
                  <span>{e.descripcion}</span>
                </div>
            ))}
            {eventos.filter(e => e.fecha >= hoy()).length === 0 && (
                <p style={{ color: 'var(--pa-muted)', fontSize: '0.8rem' }}>Sin vencimientos próximos</p>
            )}
          </div>

          <button
              className="lab-btn-primary lab-btn-danger"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
  )
}

/* ── Vista: Reportes ─────────────────────────────────────────────────────────── */
function VistaReportes({ onClose }) {
  const [reporte,  setReporte]  = useState(null)
  const [cargando, setCargando] = useState(true)
  const [err,      setErr]      = useState(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true); setErr(null)
      try {
        const res  = await fetch('/pagos-alumnos/reportes/financiero')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el reporte')
        setReporte(data)
      } catch (e) { setErr(e.message) }
      finally { setCargando(false) }
    }
    cargar()
  }, [])

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-reportes-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">📊 Reporte Financiero</h2>

          {cargando && <p className="pa-empty">Cargando reporte...</p>}
          {err      && <p className="pa-error">{err}</p>}

          {reporte && (
              <>
                <div className="pa-report-grid">
                  <div className="pa-report-card">
                    <span>Total ingresos</span>
                    <strong>{reporte.resumen.total_ingresos_formateado}</strong>
                  </div>
                  <div className="pa-report-card">
                    <span>Total mora</span>
                    <strong>{reporte.resumen.total_mora_formateado}</strong>
                  </div>
                  <div className="pa-report-card">
                    <span>Alumnos morosos</span>
                    <strong>{reporte.resumen.alumnos_morosos}</strong>
                  </div>
                  <div className="pa-report-card">
                    <span>Recibos emitidos</span>
                    <strong>{reporte.resumen.recibos_emitidos}</strong>
                  </div>
                </div>

                <div className="pa-section-subtitle">Ingresos por mes</div>
                <table className="lab-table">
                  <thead><tr><th>Mes</th><th>Total</th></tr></thead>
                  <tbody>
                  {reporte.ingresos_por_mes.length === 0 ? (
                      <tr><td colSpan={2} className="pa-empty-td">Sin ingresos registrados</td></tr>
                  ) : reporte.ingresos_por_mes.map((r, i) => (
                      <tr key={i}><td>{r.mes}</td><td><strong>{r.total_formateado}</strong></td></tr>
                  ))}
                  </tbody>
                </table>

                <div className="pa-section-subtitle">Ingresos por forma de pago</div>
                <table className="lab-table">
                  <thead><tr><th>Forma</th><th>Cantidad</th><th>Total</th></tr></thead>
                  <tbody>
                  {reporte.ingresos_por_forma_pago.length === 0 ? (
                      <tr><td colSpan={3} className="pa-empty-td">Sin datos</td></tr>
                  ) : reporte.ingresos_por_forma_pago.map((r, i) => (
                      <tr key={i}><td>{r.forma_pago}</td><td>{r.cantidad}</td><td><strong>{r.total_formateado}</strong></td></tr>
                  ))}
                  </tbody>
                </table>

                <div className="pa-section-subtitle">Morosidad</div>
                <table className="lab-table">
                  <thead><tr><th>Estado</th><th>Cantidad</th><th>Total pendiente</th></tr></thead>
                  <tbody>
                  {reporte.morosidad.length === 0 ? (
                      <tr><td colSpan={3} className="pa-empty-td">Sin morosidad registrada</td></tr>
                  ) : reporte.morosidad.map((r, i) => (
                      <tr key={i}><td>{r.estado_pago}</td><td>{r.cantidad}</td><td><strong>{r.total_pendiente_formateado}</strong></td></tr>
                  ))}
                  </tbody>
                </table>
              </>
          )}

          <button className="lab-btn-primary lab-btn-danger pa-full-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
  )
}

/* ── Modal Matrícula ─────────────────────────────────────────────────────────── */
function ModalMatricula({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/matricula/next-id')
  const [form, setForm] = useState({
    carnet: '', ciclo: '', anio: String(new Date().getFullYear()),
    precio: '', forma_pago: '', fecha: hoy()
  })
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/matricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (res.ok) { alert(`✓ Matrícula registrada — ID: ${d.id_matricula}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="🎓 Registrar Matrícula" onClose={onClose}>
        <ModalSection>Información del pago</ModalSection>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de formulario" />
        </ModalRow>

        <ModalSection>Alumno</ModalSection>
        <Inp className="pa-inp-full" placeholder="Carnet del alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>

        <ModalSection>Detalle</ModalSection>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.ciclo} onChange={e => set('ciclo', e.target.value)}>
            <option value="">Ciclo a pagar</option>
            <option value="1">Ciclo 1</option>
            <option value="2">Ciclo 2</option>
          </Sel>
          <Sel className="pa-inp-purple" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
            <option value="">Forma de pago</option>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </Sel>
        </ModalRow>
        <ModalRow>
          <Inp type="number" placeholder="Año"        value={form.anio}   onChange={e => set('anio',   e.target.value)} />
          <Inp type="number" placeholder="Precio (Q)" value={form.precio} onChange={e => set('precio', e.target.value)} />
        </ModalRow>

        <ModalBtns onClose={onClose} onGuardar={guardar} />
      </ModalBase>
  )
}

/* ── Modal Mensualidad ────────────────────────────────────────────────────────── */
function ModalMensualidad({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/mensualidad/next-id')
  const [form, setForm] = useState({
    carnet: '', mes: '', forma_pago: '', fecha_limite: ultimoDiaMes(),
    precio: '', estado_pago: 'Pendiente', dias_mora: 0, monto_mora: 0
  })
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/mensualidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (res.ok) { alert(`✓ Mensualidad registrada — ID: ${d.id_mensualidad}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="📄 Registrar Mensualidad" onClose={onClose}>
        <ModalSection>Información del pago</ModalSection>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de formulario" />
        </ModalRow>

        <ModalSection>Alumno</ModalSection>
        <Inp className="pa-inp-full" placeholder="Carnet del alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>

        <ModalSection>Detalle</ModalSection>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.mes} onChange={e => set('mes', e.target.value)}>
            <option value="">Mes a pagar</option>
            {MESES.map(m => <option key={m}>{m}</option>)}
          </Sel>
          <Sel className="pa-inp-purple" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
            <option value="">Forma de pago</option>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </Sel>
        </ModalRow>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={form.fecha_limite} onChange={e => set('fecha_limite', e.target.value)} />
          <Inp type="number" placeholder="Precio (Q)" value={form.precio} onChange={e => set('precio', e.target.value)} />
        </ModalRow>
        <Sel className="pa-inp-purple pa-inp-full" value={form.estado_pago} onChange={e => set('estado_pago', e.target.value)}>
          <option value="">Estado de cuota</option>
          {ESTADOS_CUOTA.map(s => <option key={s}>{s}</option>)}
        </Sel>

        <ModalSection>Mora</ModalSection>
        <ModalRow>
          <Inp type="number" placeholder="Días en mora" value={form.dias_mora} readOnly />
          <Inp className="pa-inp-green" type="number" placeholder="Mora (Q)" value={form.monto_mora} readOnly title="Se calcula automáticamente en backend" />
        </ModalRow>

        <ModalBtns onClose={onClose} onGuardar={guardar} />
      </ModalBase>
  )
}

/* ── Modal Pagos Varios ───────────────────────────────────────────────────────── */
function ModalPagosVarios({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/varios/next-id')
  const [form, setForm] = useState({ carnet: '', motivo_pago: '', forma_pago: '', precio: '' })
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/varios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (res.ok) { alert(`✓ Pago registrado — ID: ${d.id_pagos_varios}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="📋 Registrar Pagos Varios" onClose={onClose}>
        <ModalSection>Información del pago</ModalSection>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de formulario" />
        </ModalRow>

        <ModalSection>Alumno</ModalSection>
        <Inp className="pa-inp-full" placeholder="Carnet del alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>

        <ModalSection>Detalle</ModalSection>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.motivo_pago} onChange={e => set('motivo_pago', e.target.value)}>
            <option value="">Motivo de pago</option>
            {MOTIVOS_PAGO.map(m => <option key={m}>{m}</option>)}
          </Sel>
          <Sel className="pa-inp-purple" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
            <option value="">Forma de pago</option>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </Sel>
        </ModalRow>
        <Inp className="pa-inp-full" type="number" placeholder="Precio (Q)" value={form.precio} onChange={e => set('precio', e.target.value)} />

        <ModalBtns onClose={onClose} onGuardar={guardar} />
      </ModalBase>
  )
}

/* ── Modal Parqueo ────────────────────────────────────────────────────────────── */
function ModalParqueo({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/varios/next-id')
  const [form, setForm] = useState({
    carnet: '', visitante: '', tipo_tarifa: '', forma_pago: '',
    fecha_inicio: ahoraLocal(), fecha_fin: '', estado: '', precio: ''
  })
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  return (
      <ModalBase title="🚗 Registrar Pago Parqueo" onClose={onClose}>
        <ModalSection>Información del pago</ModalSection>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de formulario" />
        </ModalRow>

        <ModalSection>Identificación</ModalSection>
        <ModalRow>
          <Inp placeholder="Carnet alumno (opcional)"  value={form.carnet}    onChange={e => set('carnet',    e.target.value)} />
          <Inp placeholder="Visitante (opcional)"      value={form.visitante} onChange={e => set('visitante', e.target.value)} />
        </ModalRow>
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>

        <ModalSection>Tarifa y horario</ModalSection>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.tipo_tarifa} onChange={e => set('tipo_tarifa', e.target.value)}>
            <option value="">Tipo de tarifa</option>
            {TIPOS_PARQUEO.map(t => <option key={t}>{t}</option>)}
          </Sel>
          <Sel className="pa-inp-purple" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
            <option value="">Forma de pago</option>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </Sel>
        </ModalRow>
        <ModalRow>
          <Inp className="pa-inp-orange" type="datetime-local" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
          <Inp type="datetime-local" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} />
        </ModalRow>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.estado} onChange={e => set('estado', e.target.value)}>
            <option value="">Estado</option>
            {ESTADOS_PARQUEO.map(s => <option key={s}>{s}</option>)}
          </Sel>
          <Inp type="number" placeholder="Precio (Q)" value={form.precio} onChange={e => set('precio', e.target.value)} />
        </ModalRow>

        <ModalBtns onClose={onClose} onGuardar={() => { alert('Integración con Grupo 5 pendiente'); onClose() }} />
      </ModalBase>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   PORTAL DEL ALUMNO — vista completa cuando role === 'STUDENT'
   ══════════════════════════════════════════════════════════════════════════════ */
function PortalAlumno({ user }) {
  // El objeto user del login no trae carnet.
  // Lo resolvemos con GET /sistema-academico/alumnos/by-email?email=...
  const [carnet,       setCarnet]       = useState(null)
  const [carnetError,  setCarnetError]  = useState(null)
  const [vista,        setVista]        = useState(null)
  const [misPagos,     setMisPagos]     = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [filtroMes,    setFiltroMes]    = useState(mesActual())
  const [reciboActivo, setReciboActivo] = useState(null)

  // Paso 1 — resolver carnet desde el email
  useEffect(() => {
    if (!user?.email) {
      setCarnetError('No se encontró el email del usuario.')
      setCargando(false)
      return
    }
    fetch(`/sistema-academico/alumnos/by-email?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data?.carnet) {
            setCarnet(d.data.carnet)
          } else {
            setCarnetError('No se encontró el carnet para este usuario.')
            setCargando(false)
          }
        })
        .catch(() => {
          setCarnetError('Error de conexión al obtener el carnet.')
          setCargando(false)
        })
  }, [user?.email])

  // Paso 2 — cargar mis pagos una vez que tenemos el carnet
  useEffect(() => {
    if (!carnet) return
    setCargando(true)
    fetch(`/pagos-alumnos/con-pago?mes=${filtroMes}&carnet=${carnet}`)
        .then(r => r.ok ? r.json() : [])
        .then(d => setMisPagos(d))
        .catch(() => setMisPagos([]))
        .finally(() => setCargando(false))
  }, [carnet, filtroMes])

  const nombreCompleto = user?.nombre
      ? `${user.nombre} ${user.apellido || ''}`.trim()
      : 'Alumno'

  // Si hubo error resolviendo el carnet, mostrar mensaje claro
  if (carnetError) {
    return (
        <div className="pa-acceso-denegado">
          <div className="pa-acceso-icon">⚠️</div>
          <h2>No se pudo cargar tu perfil</h2>
          <p>{carnetError}</p>
        </div>
    )
  }

  return (
      <div className="uspg-page pa-wrap">

        {/* ── Header portal alumno ───────────────────────────────────────── */}
        <div className="pa-header">
          <div>
            <h1>Mi <span>Portal</span> Estudiantil</h1>
            <p className="pa-portal-sub">
              Carnet: <strong>{carnet || '...'}</strong> — {nombreCompleto}
            </p>
          </div>
          <nav className="pa-nav">
            <a onClick={() => setVista('agenda')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-calendar" /><span>Agenda</span>
            </a>
          </nav>
        </div>

        {/* ── Accesos rápidos ────────────────────────────────────────────── */}
        <div className="pa-portal-accesos">
          <button
              className="pa-portal-card"
              onClick={() => carnet && setVista('cuenta')}
              disabled={!carnet}
          >
            <div className="pa-portal-card-icon">📋</div>
            <div className="pa-portal-card-label">Estado de Cuenta</div>
            <div className="pa-portal-card-desc">Consulta tus pagos y movimientos</div>
          </button>

          <button
              className="pa-portal-card"
              onClick={() => carnet && window.open(`/pagos-alumnos/estado-cuenta-pdf/${carnet}`, '_blank')}
              disabled={!carnet}
          >
            <div className="pa-portal-card-icon">📄</div>
            <div className="pa-portal-card-label">Estado de Cuenta PDF</div>
            <div className="pa-portal-card-desc">Descarga tu estado en PDF</div>
          </button>

          <button
              className="pa-portal-card"
              onClick={() => carnet && window.open(`/pagos-alumnos/constancia-solvencia/${carnet}`, '_blank')}
              disabled={!carnet}
          >
            <div className="pa-portal-card-icon">✅</div>
            <div className="pa-portal-card-label">Constancia de Solvencia</div>
            <div className="pa-portal-card-desc">Genera tu constancia actualizada</div>
          </button>

          <button
              className="pa-portal-card"
              onClick={() => carnet && window.open(`/pagos-alumnos/carga-academica/${carnet}`, '_blank')}
              disabled={!carnet}
          >
            <div className="pa-portal-card-icon">📚</div>
            <div className="pa-portal-card-label">Mi Carga Académica</div>
            <div className="pa-portal-card-desc">Consulta tus cursos inscritos</div>
          </button>
        </div>

        {/* ── Mis pagos del mes ──────────────────────────────────────────── */}
        <div className="lab-table-wrap" style={{ marginTop: '1.5rem' }}>
          <div className="pa-table-header">
            <h3>Mis pagos del mes</h3>
            <div className="pa-table-controls">
              <input
                  type="month"
                  className="pa-search"
                  value={filtroMes}
                  onChange={e => setFiltroMes(e.target.value)}
                  style={{ width: '150px' }}
              />
            </div>
          </div>

          {cargando ? (
              <p style={{ textAlign: 'center', color: 'var(--pa-muted)', padding: '2.5rem' }}>
                Cargando...
              </p>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="lab-table">
                  <thead>
                  <tr>
                    <th>No.</th>
                    <th>Concepto</th>
                    <th>Descripción</th>
                    <th>Forma de pago</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Recibo</th>
                  </tr>
                  </thead>
                  <tbody>
                  {misPagos.length === 0 ? (
                      <tr><td colSpan={7}>No tienes pagos registrados este mes</td></tr>
                  ) : misPagos.map((p, i) => (
                      <tr key={`${p.concepto}-${p.id_ref}-${i}`}>
                        <td>{p.no}</td>
                        <td>{p.concepto}</td>
                        <td>{p.descripcion}</td>
                        <td>{p.forma}</td>
                        <td>{p.fecha}</td>
                        <td><strong>{p.monto}</strong></td>
                        <td>
                          <button
                              className="btn-recibo"
                              onClick={async () => {
                                if (!p.id_recibo) { alert('Este pago no tiene recibo asociado.'); return }
                                try {
                                  const res    = await fetch(`/pagos-alumnos/recibos/${p.id_recibo}`)
                                  const recibo = await res.json()
                                  if (!res.ok) throw new Error(recibo.error || 'No se pudo obtener el recibo')
                                  setReciboActivo({
                                    recibo: recibo.recibo, carnet: recibo.carnet,
                                    nombre: recibo.nombre, apellido: recibo.apellido,
                                    tipo: recibo.tipo, fecha: recibo.fecha,
                                    monto: recibo.monto_formateado, estado: recibo.estado,
                                    referencia: recibo.id_referencia
                                  })
                                } catch (err) { alert(err.message) }
                              }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* ── Vistas y modales ───────────────────────────────────────────── */}
        {vista === 'cuenta' && <VistaEstadoCuenta carnetFijo={carnet} onClose={() => setVista(null)} />}
        {vista === 'agenda' && <VistaAgenda onClose={() => setVista(null)} />}
        {reciboActivo && <ModalRecibo pago={reciboActivo} onClose={() => setReciboActivo(null)} />}
      </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   VISTA AUDITORÍA — solo ADMIN
   ══════════════════════════════════════════════════════════════════════════════ */
const ACCIONES_COLOR = {
  INSERT: 'badge-pagado',
  UPDATE: 'badge-pendiente',
  DELETE: 'badge-inactivo',
  SELECT: 'badge-emitido',
}

function badgeAccion(accion = '') {
  return ACCIONES_COLOR[accion.toUpperCase()] || 'badge-parcial'
}

function VistaAuditoria({ onClose }) {
  const [auditoria,  setAuditoria]  = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [err,        setErr]        = useState(null)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroPago,   setFiltroPago]   = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true); setErr(null)
    try {
      const res  = await fetch('/pagos-alumnos/auditoria')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setAuditoria(await res.json())
    } catch (e) { setErr(e.message) }
    finally { setCargando(false) }
  }

  // Valores únicos para filtros
  const acciones   = [...new Set(auditoria.map(r => r.tipo_accion).filter(Boolean))]
  const tiposPago  = [...new Set(auditoria.map(r => r.tipo_pago).filter(Boolean))]

  const filtrados = auditoria.filter(r => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
        r.carnet?.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        String(r.id_auditoria).includes(q)
    const matchA = !filtroAccion || r.tipo_accion === filtroAccion
    const matchP = !filtroPago  || r.tipo_pago   === filtroPago
    return matchQ && matchA && matchP
  })

  function formatFecha(f) {
    if (!f) return '—'
    return new Date(f).toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-audit-modal" onClick={e => e.stopPropagation()}>

          {/* ── Encabezado ── */}
          <div className="pa-audit-header">
            <div>
              <h2 className="pa-modal-title" style={{ margin: 0, textAlign: 'left' }}>
                 Auditoría de Pagos
              </h2>
              <p className="pa-audit-sub">
                Registro completo de acciones sobre el módulo de pagos
              </p>
            </div>
            <div className="pa-audit-header-actions">
              <span className="pa-audit-total">
                {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
              </span>
              <button
                  className="lab-btn-primary"
                  onClick={cargar}
                  disabled={cargando}
                  style={{ minWidth: 110 }}
              >
                {cargando ? '...' : '↻ Actualizar'}
              </button>
            </div>
          </div>

          {/* ── Filtros ── */}
          <div className="pa-audit-filtros">
            <input
                className="pa-search"
                placeholder="Buscar por carnet, descripción o ID…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ flex: 1 }}
            />
            <select
                className="pa-search pa-audit-select"
                value={filtroAccion}
                onChange={e => setFiltroAccion(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {acciones.map(a => <option key={a}>{a}</option>)}
            </select>
            <select
                className="pa-search pa-audit-select"
                value={filtroPago}
                onChange={e => setFiltroPago(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tiposPago.map(t => <option key={t}>{t}</option>)}
            </select>
            {(busqueda || filtroAccion || filtroPago) && (
                <button
                    className="pa-audit-clear"
                    onClick={() => { setBusqueda(''); setFiltroAccion(''); setFiltroPago('') }}
                    title="Limpiar filtros"
                >
                  ✕
                </button>
            )}
          </div>

          {/* ── Error ── */}
          {err && (
              <div className="pa-error-banner" style={{ marginBottom: '0.75rem' }}>
                <span>⚠️ {err}</span>
                <button onClick={cargar}>Reintentar</button>
              </div>
          )}

          {/* ── Tabla ── */}
          {cargando ? (
              <div className="pa-loading-screen" style={{ minHeight: 200 }}>
                <div className="pa-loading-spinner" />
              </div>
          ) : (
              <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
                <table className="lab-table">
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(18,18,42,0.98)', zIndex: 1 }}>
                  <tr>
                    <th>ID</th>
                    <th>Fecha y hora</th>
                    <th>Carnet</th>
                    <th>Acción</th>
                    <th>Tipo pago</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          {auditoria.length === 0
                              ? 'No hay registros de auditoría aún.'
                              : 'Ningún registro coincide con los filtros aplicados.'}
                        </td>
                      </tr>
                  ) : filtrados.map(item => (
                      <tr key={item.id_auditoria}>
                        <td>
                          <span className="pa-audit-id">#{item.id_auditoria}</span>
                        </td>
                        <td>
                          <span className="pa-audit-fecha">{formatFecha(item.fecha_hora)}</span>
                        </td>
                        <td>
                          <span className="pa-audit-carnet">{item.carnet || '—'}</span>
                        </td>
                        <td>
                          <span className={badgeAccion(item.tipo_accion)}>
                            {item.tipo_accion || '—'}
                          </span>
                        </td>
                        <td>
                          {item.tipo_pago
                              ? <span className="pa-audit-tipo">{item.tipo_pago}</span>
                              : <span style={{ color: 'var(--pa-muted)' }}>—</span>
                          }
                        </td>
                        <td>
                          <strong className="pa-audit-monto">
                            Q{Number(item.monto || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className="pa-audit-desc" title={item.descripcion}>
                            {item.descripcion || '—'}
                          </span>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}

          <button
              className="lab-btn-primary lab-btn-danger pa-full-btn"
              style={{ marginTop: '1.5rem' }}
              onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   VISTA BENCHMARK — solo ADMIN
   ══════════════════════════════════════════════════════════════════════════════ */

const BENCH_ENDPOINTS = [
  { nombre: 'Dashboard',          metodo: 'GET', url: '/pagos-alumnos/dashboard',               tipo: 'Resumen' },
  { nombre: 'Alumnos con pago',   metodo: 'GET', url: '/pagos-alumnos/con-pago?mes=2026-06',    tipo: 'Consulta' },
  { nombre: 'Alumnos sin pago',   metodo: 'GET', url: '/pagos-alumnos/sin-pago?mes=2026-06',    tipo: 'Consulta' },
  { nombre: 'Reporte financiero', metodo: 'GET', url: '/pagos-alumnos/reportes/financiero',     tipo: 'Reporte' },
]

const BENCH_CONFIG = { rondasSecuenciales: 5, usuariosConcurrentes: 10, rondasConcurrentes: 3 }

function fms(ms)  { return `${Number(ms || 0).toFixed(2)} ms` }
function fn2(n)   { return Number(n   || 0).toFixed(2) }

function percentil(vals, p) {
  if (!vals.length) return 0
  const s = [...vals].sort((a, b) => a - b)
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)]
}

function claseLatencia(ms) {
  if (ms <= 500)  return 'badge-pagado'
  if (ms <= 1000) return 'badge-pendiente'
  return 'badge-inactivo'
}

function clasificarLatencia(ms) {
  if (ms <= 200)  return 'Excelente'
  if (ms <= 500)  return 'Aceptable'
  if (ms <= 1000) return 'Mejorable'
  return 'Crítica'
}

function VistaBenchmark({ onClose }) {
  const [resultados,   setResultados]   = useState([])
  const [resumen,      setResumen]      = useState(null)
  const [porEndpoint,  setPorEndpoint]  = useState([])
  const [ejecutando,   setEjecutando]   = useState(false)
  const [fase,         setFase]         = useState('En espera')
  const [progreso,     setProgreso]     = useState(0)
  const totalPeticiones = BENCH_CONFIG.rondasSecuenciales * BENCH_ENDPOINTS.length
      + BENCH_CONFIG.rondasConcurrentes * BENCH_CONFIG.usuariosConcurrentes * BENCH_ENDPOINTS.length

  async function medirEndpoint(ep, modo, ronda, vu = 1) {
    const t0 = performance.now()
    try {
      const res    = await fetch(ep.url, { method: ep.metodo, cache: 'no-store' })
      const tiempo = performance.now() - t0
      return { ...ep, modo, ronda, usuario_virtual: vu, status: res.status, ok: res.ok,
        tiempo, tiempo_formateado: fms(tiempo),
        resultado: res.ok ? 'OK' : `Error ${res.status}`,
        clasificacion: clasificarLatencia(tiempo) }
    } catch (err) {
      const tiempo = performance.now() - t0
      return { ...ep, modo, ronda, usuario_virtual: vu, status: 'Fallo', ok: false,
        tiempo, tiempo_formateado: fms(tiempo), resultado: err.message, clasificacion: 'Crítica' }
    }
  }

  function calcularMetricas(datos, t0, t1) {
    const ts       = datos.map(d => d.tiempo)
    const exitosos = datos.filter(d => d.ok).length
    const dur      = Math.max((t1 - t0) / 1000, 0.001)
    const prom     = ts.reduce((s, v) => s + v, 0) / ts.length
    const seq      = datos.filter(d => d.modo === 'Secuencial')
    const con      = datos.filter(d => d.modo === 'Concurrente')
    const pSeq     = seq.length ? seq.reduce((s, d) => s + d.tiempo, 0) / seq.length : 0
    const pCon     = con.length ? con.reduce((s, d) => s + d.tiempo, 0) / con.length : 0
    const deg      = pSeq > 0 ? pCon / pSeq : 0
    const tErr     = ((datos.length - exitosos) / datos.length) * 100
    return {
      total: datos.length, exitosos, fallidos: datos.length - exitosos,
      promedio: prom, minimo: Math.min(...ts), maximo: Math.max(...ts),
      p95: percentil(ts, 95), p99: percentil(ts, 99),
      throughput: datos.length / dur, tasaExito: (exitosos / datos.length) * 100,
      tasaError: tErr, duracionSegundos: dur,
      promedioSecuencial: pSeq, promedioConcurrente: pCon, factorDegradacion: deg,
      elasticidad: deg > 2 || tErr > 5 ? 'Limitada' : deg > 1.4 ? 'Aceptable' : 'Buena',
      promedio_f: fms(prom), minimo_f: fms(Math.min(...ts)), maximo_f: fms(Math.max(...ts)),
      p95_f: fms(percentil(ts, 95)), p99_f: fms(percentil(ts, 99)),
      throughput_f: `${fn2(datos.length / dur)} req/s`,
      tasa_exito_f: `${fn2((exitosos / datos.length) * 100)}%`,
      tasa_error_f: `${fn2(tErr)}%`,
      duracion_f:   `${fn2(dur)} s`,
      seq_f: fms(pSeq), con_f: fms(pCon),
      deg_f: `${fn2(deg)}x`,
    }
  }

  function calcularPorEndpoint(datos) {
    return BENCH_ENDPOINTS.map(ep => {
      const items = datos.filter(d => d.nombre === ep.nombre)
      const ts    = items.map(i => i.tiempo)
      const ok    = items.filter(i => i.ok).length
      const prom  = ts.length ? ts.reduce((s, v) => s + v, 0) / ts.length : 0
      return {
        ...ep, total: items.length, exitosos: ok, fallidos: items.length - ok,
        promedio: prom,
        minimo: ts.length ? Math.min(...ts) : 0,
        maximo: ts.length ? Math.max(...ts) : 0,
        p95: percentil(ts, 95),
        tasa_exito: items.length ? (ok / items.length) * 100 : 0,
        promedio_f: fms(prom),
        minimo_f:   fms(ts.length ? Math.min(...ts) : 0),
        maximo_f:   fms(ts.length ? Math.max(...ts) : 0),
        p95_f:      fms(percentil(ts, 95)),
        tasa_f:     `${fn2(items.length ? (ok / items.length) * 100 : 0)}%`,
        clasificacion: clasificarLatencia(prom),
      }
    })
  }

  async function ejecutar() {
    setEjecutando(true); setResultados([]); setResumen(null)
    setPorEndpoint([]); setProgreso(0)
    const datos = []
    const t0    = performance.now()
    let hechas  = 0

    // ── Fase secuencial ──────────────────────────────────────────────────────
    setFase('Prueba secuencial')
    for (let r = 1; r <= BENCH_CONFIG.rondasSecuenciales; r++) {
      for (const ep of BENCH_ENDPOINTS) {
        datos.push(await medirEndpoint(ep, 'Secuencial', r, 1))
        hechas++
        setProgreso(Math.round((hechas / totalPeticiones) * 100))
        setResultados([...datos])
      }
    }

    // ── Fase concurrente ─────────────────────────────────────────────────────
    setFase('Prueba concurrente')
    for (let r = 1; r <= BENCH_CONFIG.rondasConcurrentes; r++) {
      const lote = []
      for (let u = 1; u <= BENCH_CONFIG.usuariosConcurrentes; u++)
        for (const ep of BENCH_ENDPOINTS)
          lote.push(medirEndpoint(ep, 'Concurrente', r, u))
      const batch = await Promise.all(lote)
      datos.push(...batch)
      hechas += batch.length
      setProgreso(Math.round((hechas / totalPeticiones) * 100))
      setResultados([...datos])
    }

    const t1 = performance.now()
    setResumen(calcularMetricas(datos, t0, t1))
    setPorEndpoint(calcularPorEndpoint(datos))
    setFase('Finalizado')
    setEjecutando(false)
    setProgreso(100)
  }

  const elasticidadColor = { Buena: '#4ade80', Aceptable: '#fbbf24', Limitada: '#f87171' }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-bench-modal" onClick={e => e.stopPropagation()}>

          {/* ── Título ── */}
          <div className="pa-bench-header">
            <div>
              <h2 className="pa-modal-title" style={{ margin: 0, textAlign: 'left' }}>
                ⚡ Benchmark de rendimiento
              </h2>
              <p className="pa-bench-sub">
                Latencia · Throughput · Concurrencia · Elasticidad
              </p>
            </div>
            <button
                className="lab-btn-primary"
                onClick={ejecutar}
                disabled={ejecutando}
                style={{ minWidth: 160, flexShrink: 0 }}
            >
              {ejecutando ? `Ejecutando… ${progreso}%` : 'Ejecutar benchmark'}
            </button>
          </div>

          {/* ── Barra de progreso ── */}
          {ejecutando && (
              <div className="pa-bench-progress-wrap">
                <div className="pa-bench-progress-bar" style={{ width: `${progreso}%` }} />
              </div>
          )}

          {/* ── Fase actual ── */}
          <div className="pa-bench-fase">
            <span className={`pa-bench-dot ${ejecutando ? 'pa-bench-dot-live' : ''}`} />
            {fase}
          </div>

          {/* ── Métricas globales ── */}
          {resumen && (
              <>
                <div className="pa-bench-section">Resumen global</div>
                <div className="pa-bench-grid pa-bench-grid-4">
                  <div className="pa-bench-card"><span>Solicitudes</span><strong>{resumen.total}</strong></div>
                  <div className="pa-bench-card"><span>Tasa de éxito</span><strong>{resumen.tasa_exito_f}</strong></div>
                  <div className="pa-bench-card"><span>Throughput</span><strong>{resumen.throughput_f}</strong></div>
                  <div className="pa-bench-card"><span>Duración total</span><strong>{resumen.duracion_f}</strong></div>
                </div>

                <div className="pa-bench-section">Latencia</div>
                <div className="pa-bench-grid pa-bench-grid-4">
                  <div className="pa-bench-card"><span>Promedio</span><strong>{resumen.promedio_f}</strong></div>
                  <div className="pa-bench-card"><span>p95</span><strong>{resumen.p95_f}</strong></div>
                  <div className="pa-bench-card"><span>p99</span><strong>{resumen.p99_f}</strong></div>
                  <div className="pa-bench-card"><span>Máxima</span><strong>{resumen.maximo_f}</strong></div>
                </div>

                <div className="pa-bench-section">Concurrencia y elasticidad</div>
                <div className="pa-bench-grid pa-bench-grid-4">
                  <div className="pa-bench-card"><span>Latencia secuencial</span><strong>{resumen.seq_f}</strong></div>
                  <div className="pa-bench-card"><span>Latencia concurrente</span><strong>{resumen.con_f}</strong></div>
                  <div className="pa-bench-card"><span>Factor degradación</span><strong>{resumen.deg_f}</strong></div>
                  <div className="pa-bench-card">
                    <span>Elasticidad</span>
                    <strong style={{ color: elasticidadColor[resumen.elasticidad] }}>
                      {resumen.elasticidad}
                    </strong>
                  </div>
                </div>

                {/* ── Interpretación ── */}
                <div className="pa-bench-interpretacion">
                  El módulo procesó <strong>{resumen.total}</strong> solicitudes en{' '}
                  <strong>{resumen.duracion_f}</strong>, con throughput de{' '}
                  <strong>{resumen.throughput_f}</strong>, tasa de éxito{' '}
                  <strong>{resumen.tasa_exito_f}</strong> y elasticidad estimada{' '}
                  <strong style={{ color: elasticidadColor[resumen.elasticidad] }}>
                    {resumen.elasticidad}
                  </strong>.
                  {resumen.fallidos > 0 && (
                      <> Se registraron <strong style={{ color: '#f87171' }}>{resumen.fallidos} fallo(s)</strong>.</>
                  )}
                </div>
              </>
          )}

          {/* ── Métricas por endpoint ── */}
          {porEndpoint.length > 0 && (
              <>
                <div className="pa-bench-section">Métricas por endpoint</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="lab-table">
                    <thead>
                    <tr>
                      <th>Endpoint</th><th>Tipo</th><th>Total</th><th>Éxito</th>
                      <th>Promedio</th><th>p95</th><th>Máx</th><th>Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {porEndpoint.map((r, i) => (
                        <tr key={i}>
                          <td>{r.nombre}</td>
                          <td><span className="pa-bench-tipo">{r.tipo}</span></td>
                          <td>{r.total}</td>
                          <td>{r.tasa_f}</td>
                          <td><strong>{r.promedio_f}</strong></td>
                          <td>{r.p95_f}</td>
                          <td>{r.maximo_f}</td>
                          <td><span className={claseLatencia(r.promedio)}>{r.clasificacion}</span></td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </>
          )}

          {/* ── Resultados detallados ── */}
          {resultados.length > 0 && (
              <>
                <div className="pa-bench-section">
                  Resultados detallados
                  <span className="pa-bench-count">{resultados.length} entradas</span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
                  <table className="lab-table" style={{ fontSize: '0.75rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(18,18,42,0.98)', zIndex: 1 }}>
                    <tr>
                      <th>Modo</th><th>Ronda</th><th>VU</th><th>Endpoint</th>
                      <th>Status</th><th>Tiempo</th><th>Resultado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {resultados.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <span className={r.modo === 'Secuencial' ? 'pa-bench-modo-seq' : 'pa-bench-modo-con'}>
                              {r.modo}
                            </span>
                          </td>
                          <td>{r.ronda}</td>
                          <td>{r.usuario_virtual}</td>
                          <td>{r.nombre}</td>
                          <td>
                            <span className={r.ok ? 'badge-pagado' : 'badge-inactivo'}>
                              {r.status}
                            </span>
                          </td>
                          <td><strong>{r.tiempo_formateado}</strong></td>
                          <td style={{ color: r.ok ? 'var(--pa-muted)' : '#f87171' }}>{r.resultado}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </>
          )}

          <button
              className="lab-btn-primary lab-btn-danger pa-full-btn"
              style={{ marginTop: '1.5rem' }}
              onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   VISTA ADMIN — dashboard completo
   ══════════════════════════════════════════════════════════════════════════════ */
function VistaAdmin() {
  const [modal,        setModal]        = useState(null)
  const [vista,        setVista]        = useState(null)
  const [busqueda,     setBusqueda]     = useState('')
  const [busquedaSin,  setBusquedaSin]  = useState('')
  const [filtroMes,    setFiltroMes]    = useState(mesActual())
  const [pagos,        setPagos]        = useState([])
  const [dashboard,    setDashboard]    = useState({
    ingresos_mes_formateado: 'Q0.00',
    pagos_registrados: 0,
    alumnos_mora: 0,
  })
  const [sinPagos,     setSinPagos]     = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)
  const [reciboActivo, setReciboActivo] = useState(null)

  async function cargarDatos() {
    setCargando(true); setError(null)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`/pagos-alumnos/con-pago?mes=${filtroMes}`),
        fetch(`/pagos-alumnos/sin-pago?mes=${filtroMes}`),
        fetch('/pagos-alumnos/dashboard')
      ])
      if (!r1.ok || !r2.ok || !r3.ok) throw new Error('Error al consultar la base de datos')
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])
      setPagos(d1); setSinPagos(d2); setDashboard(d3)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [filtroMes])

  function handleCloseModal() { setModal(null); cargarDatos() }

  const filtrados = pagos.filter(p =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.carnet?.includes(busqueda) ||
      p.apellidos?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const filtradosSin = sinPagos.filter(p =>
      p.nombre?.toLowerCase().includes(busquedaSin.toLowerCase()) ||
      p.carnet?.includes(busquedaSin) ||
      p.apellidos?.toLowerCase().includes(busquedaSin.toLowerCase())
  )

  return (
      <div className="uspg-page pa-wrap">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="pa-header">
          <h1>Sistema de <span>Pagos</span> Alumnos</h1>
          <nav className="pa-nav">
            <a onClick={() => setVista('reportes')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-bar-chart" /><span>Reportes</span>
            </a>
            <a onClick={() => setVista('cuenta')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-book" /><span>Estados de cuentas</span>
            </a>
            <a href="/sistema-academico" style={{ cursor: 'pointer' }}>
              <i className="fa fa-users" /><span>Gestión alumnos</span>
            </a>
            <a onClick={() => setVista('agenda')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-calendar" /><span>Agenda</span>
            </a>
            <a onClick={() => setVista('auditoria')} style={{ cursor: 'pointer' }} className="pa-nav-auditoria">
              <i className="fa fa-history" /><span>Auditoría</span>
            </a>
            <a onClick={() => setVista('benchmark')} style={{ cursor: 'pointer' }} className="pa-nav-benchmark">
              <i className="fa fa-tachometer" /><span>Benchmark</span>
            </a>
          </nav>
        </div>

        {/* ── Stats + Registrar ─────────────────────────────────────────────── */}
        <div className="pa-stats">
          <div className="pa-stat">
            <div className="val">{dashboard.ingresos_mes_formateado}</div>
            <div className="lbl">Ingresos del Mes</div>
          </div>
          <div className="pa-stat">
            <div className="val">{cargando ? '—' : dashboard.pagos_registrados}</div>
            <div className="lbl">Pagos Registrados</div>
          </div>
          <div className="pa-stat">
            <div className="val">{cargando ? '—' : dashboard.alumnos_mora}</div>
            <div className="lbl">Alumnos en Mora</div>
          </div>
          <div
              className="pa-stat pa-stat-auditoria"
              style={{ cursor: 'pointer' }}
              onClick={() => setVista('auditoria')}
              title="Ver auditoría de pagos"
          >
            <div className="val pa-stat-icon-val">
              <i className="fa fa-history" />
            </div>
            <div className="lbl">Auditoría</div>
          </div>
          <div className="pa-reg">
            <div className="reg-title">Registrar Pagos</div>
            <div className="pa-reg-btns">
              <button className="pa-reg-btn" onClick={() => setModal('matricula')}>
                <i className="fa fa-id-card" /><span>Matrícula</span>
              </button>
              <button className="pa-reg-btn" onClick={() => setModal('mensualidad')}>
                <i className="fa fa-file-text" /><span>Mensualidad</span>
              </button>
              <button className="pa-reg-btn" onClick={() => setModal('varios')}>
                <i className="fa fa-list" /><span>Pagos Varios</span>
              </button>
              <button className="pa-reg-btn" onClick={() => setModal('parqueo')}>
                <i className="fa fa-car" /><span>Parqueo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {error && (
            <div className="pa-error-banner">
              <span>⚠️ {error}</span>
              <button onClick={cargarDatos}>Reintentar</button>
            </div>
        )}

        {/* ── Tabla CON pagos ───────────────────────────────────────────────── */}
        <div className="lab-table-wrap" style={{ marginBottom: '1rem' }}>
          <div className="pa-table-header">
            <h3>Alumnos con pagos del mes</h3>
            <div className="pa-table-controls">
              <input
                  type="month" className="pa-search" value={filtroMes}
                  onChange={e => setFiltroMes(e.target.value)}
                  title="Filtrar por mes" style={{ width: '150px' }}
              />
              <input
                  className="pa-search" placeholder="Buscar por carnet o nombre..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
              <p style={{ textAlign: 'center', color: 'var(--pa-muted)', padding: '2.5rem' }}>Cargando...</p>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="lab-table">
                  <thead>
                  <tr>
                    <th>No.</th><th>Carnet</th><th>Nombre</th><th>Apellidos</th>
                    <th>Forma de pago</th><th>Concepto</th><th>Descripción</th>
                    <th>Fecha</th><th>Monto</th><th>Recibo</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtrados.length === 0 ? (
                      <tr><td colSpan={10}>Sin pagos registrados este mes</td></tr>
                  ) : filtrados.map((p, i) => (
                      <tr key={`${p.concepto}-${p.id_ref}-${i}`}>
                        <td>{p.no}</td>
                        <td>{p.carnet}</td>
                        <td>{p.nombre}</td>
                        <td>{p.apellidos}</td>
                        <td>{p.forma}</td>
                        <td>{p.concepto}</td>
                        <td>{p.descripcion}</td>
                        <td>{p.fecha}</td>
                        <td><strong>{p.monto}</strong></td>
                        <td>
                          <button
                              className="btn-recibo"
                              onClick={async () => {
                                if (!p.id_recibo) { alert('Este pago no tiene recibo asociado.'); return }
                                try {
                                  const res    = await fetch(`/pagos-alumnos/recibos/${p.id_recibo}`)
                                  const recibo = await res.json()
                                  if (!res.ok) throw new Error(recibo.error || 'No se pudo obtener el recibo')
                                  setReciboActivo({
                                    recibo: recibo.recibo, carnet: recibo.carnet,
                                    nombre: recibo.nombre, apellido: recibo.apellido,
                                    tipo: recibo.tipo, fecha: recibo.fecha,
                                    monto: recibo.monto_formateado, estado: recibo.estado,
                                    referencia: recibo.id_referencia
                                  })
                                } catch (err) { alert(err.message) }
                              }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* ── Tabla SIN pagos ───────────────────────────────────────────────── */}
        <div className="lab-table-wrap">
          <div className="pa-table-header">
            <h3>Alumnos sin pagos del mes</h3>
            <div className="pa-table-controls">
              <input
                  className="pa-search" placeholder="Buscar por carnet o nombre..."
                  value={busquedaSin} onChange={e => setBusquedaSin(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
              <p style={{ textAlign: 'center', color: 'var(--pa-muted)', padding: '2.5rem' }}>Cargando...</p>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="lab-table">
                  <thead>
                  <tr>
                    <th>No.</th><th>Carnet</th><th>Nombre</th><th>Apellidos</th>
                    <th>Carrera</th><th>Estado</th><th>Sin pagar</th>
                    <th>Atraso Mensualidad / Matrícula</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtradosSin.length === 0 ? (
                      <tr><td colSpan={8}>✅ Todos los alumnos tienen pagos este mes</td></tr>
                  ) : filtradosSin.map((p, i) => (
                      <tr key={`sinpago-${p.carnet}-${i}`}>
                        <td>{p.no}</td>
                        <td>{p.carnet}</td>
                        <td>{p.nombre}</td>
                        <td>{p.apellidos}</td>
                        <td>{p.carrera}</td>
                        <td>
                          <span className={`badge-${(p.estado || '').toLowerCase()}`}>{p.estado}</span>
                        </td>
                        <td>{p.forma}</td>
                        <td><strong>{p.sin_pagar}</strong></td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* ── Modales de registro ───────────────────────────────────────────── */}
        {modal === 'matricula'   && <ModalMatricula   onClose={handleCloseModal} />}
        {modal === 'mensualidad' && <ModalMensualidad onClose={handleCloseModal} />}
        {modal === 'varios'      && <ModalPagosVarios onClose={handleCloseModal} />}
        {modal === 'parqueo'     && <ModalParqueo     onClose={handleCloseModal} />}

        {/* ── Vistas de nav ─────────────────────────────────────────────────── */}
        {vista === 'cuenta'     && <VistaEstadoCuenta onClose={() => setVista(null)} />}
        {vista === 'agenda'     && <VistaAgenda       onClose={() => setVista(null)} />}
        {vista === 'reportes'   && <VistaReportes     onClose={() => setVista(null)} />}
        {vista === 'benchmark'  && <VistaBenchmark    onClose={() => setVista(null)} />}
        {vista === 'auditoria'  && <VistaAuditoria    onClose={() => setVista(null)} />}

        {/* ── Modal recibo ──────────────────────────────────────────────────── */}
        {reciboActivo && <ModalRecibo pago={reciboActivo} onClose={() => setReciboActivo(null)} />}
      </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE RAÍZ — lee el rol y decide qué vista renderizar
   ══════════════════════════════════════════════════════════════════════════════ */
export default function PagosAlumnos() {
  const [user,    setUser]    = useState(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch { /* si localStorage falla, user queda null */ }
    finally { setCargado(true) }
  }, [])

  // Esperar hasta leer localStorage para evitar flash de contenido incorrecto
  if (!cargado) {
    return (
        <div className="pa-loading-screen">
          <div className="pa-loading-spinner" />
        </div>
    )
  }

  const esAdmin  = user?.role === 'ADMIN'
  const esAlumno = user?.role === 'STUDENT'

  if (esAlumno) return <PortalAlumno user={user} />
  if (esAdmin)  return <VistaAdmin />

  // Rol desconocido o sin sesión — acceso denegado
  return (
      <div className="pa-acceso-denegado">
        <div className="pa-acceso-icon">🔒</div>
        <h2>Acceso no autorizado</h2>
        <p>No tienes permisos para ver esta sección.</p>
        <a href="/login" className="lab-btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Iniciar sesión
        </a>
      </div>
  )
}
