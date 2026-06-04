'use client'

import { useState, useEffect, useRef } from 'react'
import './pagos_alumnos.css'

const hoy        = () => new Date().toISOString().split('T')[0]
const ahoraLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const ultimoDiaMes = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}
const mesActual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const FORMAS_PAGO     = ['Efectivo', 'Tarjeta', 'Transferencia']
const MESES           = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ESTADOS_CUOTA   = ['Pendiente', 'Pagado', 'Parcial', 'Vencido']
const MOTIVOS_PAGO    = ['Título', 'Reposición de carnet', 'Constancia de estudios', 'Certificado de notas', 'Laboratorio', 'Material didáctico', 'Otro']
const TIPOS_PARQUEO   = ['Hora', 'Día', 'Mes']
const ESTADOS_PARQUEO = ['Activo', 'Finalizado', 'Reservado']

function useNextId(endpoint) {
  const [nextId, setNextId] = useState(null)
  const refresh = async () => {
    try {
      const res = await fetch(endpoint)
      if (res.ok) { const d = await res.json(); setNextId(d.next_id ?? '—') }
      else setNextId('ERR')
    } catch { setNextId('—') }
  }
  useEffect(() => { refresh() }, [])
  return [nextId, refresh]
}

function useAlumno(carnet) {
  const [alumno, setAlumno] = useState({ nombres: '', apellidos: '' })
  const timer = useRef(null)
  useEffect(() => {
    if (!carnet || carnet.length < 4) { setAlumno({ nombres: '', apellidos: '' }); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setAlumno({ nombres: '...', apellidos: '' })
      try {
        const res = await fetch(`/pagos-alumnos/alumnos/${carnet}`)
        if (res.ok) {
          const d = await res.json()
          setAlumno({ nombres: d.nombres || d.nombre || '', apellidos: d.apellidos || d.apellido || '' })
        } else { setAlumno({ nombres: 'No encontrado', apellidos: '' }) }
      } catch { setAlumno({ nombres: '', apellidos: '' }) }
    }, 500)
  }, [carnet])
  return alumno
}

function Inp({ className = '', ...props }) {
  return <input className={`lab-input ${className}`} {...props} />
}
function Sel({ className = '', children, ...props }) {
  return <select className={`lab-input ${className}`} {...props}>{children}</select>
}
function ModalRow({ children }) { return <div className="pa-modal-row">{children}</div> }
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

// ─── Modal Recibo ─────────────────────────────────────────────────────────────
function ModalRecibo({ pago, onClose }) {
  if (!pago) return null
  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-recibo-modal" onClick={e => e.stopPropagation()}>
          <div className="pa-recibo-header">
            <div className="pa-recibo-logo">USPG</div>
            <div className="pa-recibo-title-block">
              <div className="pa-recibo-title">RECIBO OFICIAL</div>
              <div className="pa-recibo-sub">Sistema de Pagos Alumnos</div>
            </div>
          </div>

          {/* DATOS PRINCIPALES (No. Recibo y Fecha) */}
          <div className="pa-recibo-meta-grid">
            <div className="pa-recibo-item highlight">
              <span>No. Recibo:</span>
              <strong>#{pago.id_ref || '—'}</strong>
            </div>
            <div className="pa-recibo-item highlight text-right">
              <span>Fecha emisión:</span>
              <strong>{pago.fecha || '—'}</strong>
            </div>
          </div>

          <div className="pa-recibo-divider" />

          {/* INFORMACIÓN DEL ALUMNO */}
          <div className="pa-recibo-section-title">Datos del Alumno</div>
          <div className="pa-recibo-info-grid">
            <div className="pa-recibo-item"><span>Carnet:</span><strong>{pago.carnet}</strong></div>
            <div className="pa-recibo-item"><span>Alumno:</span><strong>{pago.nombre} {pago.apellidos}</strong></div>
          </div>

          <div className="pa-recibo-divider-dashed" />

          {/* DETALLES DEL PAGO */}
          <div className="pa-recibo-section-title">Detalle del Pago</div>
          <div className="pa-recibo-info-grid">
            <div className="pa-recibo-item"><span>Concepto:</span><strong>{pago.concepto}</strong></div>
            <div className="pa-recibo-item"><span>Descripción:</span><strong>{pago.descripcion}</strong></div>
            <div className="pa-recibo-item"><span>Forma de pago:</span><strong>{pago.forma}</strong></div>
            <div className="pa-recibo-item"><span>Fecha de pago:</span><strong>{pago.fecha || '—'}</strong></div>
          </div>

          <div className="pa-recibo-divider" />

          {/* TOTAL */}
          <div className="pa-recibo-total-block">
            <span className="total-label">TOTAL PROCESADO</span>
            <strong className="total-amount">{pago.monto}</strong>
          </div>
          <div className="pa-recibo-footer">
            <p>Universidad San Pablo Guatemala</p>
            <p className="footer-sub">Documento generado electrónicamente de forma segura</p>
          </div>
          <button className="lab-btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
  )
}

// ─── Vista: Estado de Cuenta ──────────────────────────────────────────────────
function VistaEstadoCuenta({ onClose }) {
  const [carnet,  setCarnet]  = useState('')
  const [cuenta,  setCuenta]  = useState(null)
  const [buscando,setBuscando]= useState(false)
  const [err,     setErr]     = useState(null)

  async function buscar() {
    if (!carnet.trim()) return
    setBuscando(true); setErr(null); setCuenta(null)
    try {
      const res = await fetch(`/pagos-alumnos/estado-cuenta/${carnet.trim()}`)
      if (res.ok) { setCuenta(await res.json()) }
      else { setErr('Alumno no encontrado o sin movimientos.') }
    } catch { setErr('Error de conexión.') }
    finally { setBuscando(false) }
  }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-cuenta-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">📋 Estado de Cuenta</h2>

          <div className="pa-cuenta-search-row">
            <Inp
                className="pa-inp-full"
                placeholder="Ingresa el carnet del alumno..."
                value={carnet}
                onChange={e => setCarnet(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
            />
            <button className="lab-btn-primary" onClick={buscar} disabled={buscando}>
              {buscando ? '...' : '🔍 Buscar'}
            </button>
          </div>

          {err && <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0.5rem 0' }}>{err}</p>}

          {cuenta && (
              <>
                <div className="pa-cuenta-alumno">
                  <div><span>Alumno:</span> <strong>{cuenta.nombres} {cuenta.apellidos}</strong></div>
                  <div><span>Carnet:</span> <strong>{cuenta.carnet}</strong></div>
                  <div><span>Carrera:</span> <strong>{cuenta.carrera || '—'}</strong></div>
                </div>
                <div className="pa-recibo-divider" />
                <div style={{ overflowX: 'auto' }}>
                  <table className="lab-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                    <tr>
                      <th>Mes</th><th>Concepto</th><th>Fecha</th>
                      <th>Monto</th><th>Mora</th><th>Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(cuenta.movimientos || []).length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign:'center', padding:'1rem', color:'var(--uspg-muted)' }}>Sin movimientos registrados</td></tr>
                    ) : (cuenta.movimientos || []).map((m, i) => (
                        <tr key={i}>
                          <td>{m.mes}</td>
                          <td>{m.concepto}</td>
                          <td>{m.fecha}</td>
                          <td><strong>{m.monto}</strong></td>
                          <td style={{ color: parseFloat(m.mora) > 0 ? '#fca5a5' : 'inherit' }}>{m.mora || 'Q0.00'}</td>
                          <td>
                            <span className={`badge-${(m.estado || '').toLowerCase()}`}>{m.estado}</span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </>
          )}

          <button className="lab-btn-primary lab-btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
  )
}

// ─── Vista: Agenda ────────────────────────────────────────────────────────────
function VistaAgenda({ onClose }) {
  const hoyDate = new Date()
  const [anio,  setAnio]  = useState(hoyDate.getFullYear())
  const [mes,   setMes]   = useState(hoyDate.getMonth())
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

  const colores = { mensualidad: '#f59e0b', matricula: '#3b82f6', parqueo: '#10b981' }

  return (
      <div className="lab-modal-overlay" onClick={onClose}>
        <div className="lab-modal pa-agenda-modal" onClick={e => e.stopPropagation()}>
          <h2 className="pa-modal-title">📅 Agenda — Fechas Límite de Pago</h2>

          <div className="pa-agenda-nav">
            <button className="lab-btn-primary" onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a-1) } else setMes(m => m-1) }}>‹</button>
            <span>{MESES[mes]} {anio}</span>
            <button className="lab-btn-primary" onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a+1) } else setMes(m => m+1) }}>›</button>
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
                  <div key={i} className={`pa-agenda-cell ${esHoy(dia) ? 'pa-agenda-hoy' : ''} ${!dia ? 'pa-agenda-vacio' : ''}`}>
                    {dia && <span className="pa-agenda-dia">{dia}</span>}
                    {ev.map((e, j) => (
                        <div key={j} className="pa-agenda-evento" style={{ background: colores[e.tipo] || '#6b7280' }} title={e.descripcion}>
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
                <p style={{ color: 'var(--uspg-muted)', fontSize: '0.8rem' }}>Sin vencimientos próximos</p>
            )}
          </div>

          <button className="lab-btn-primary lab-btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
  )
}

// ─── Modal Matrícula ──────────────────────────────────────────────────────────
function ModalMatricula({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/matricula/next-id')
  const [form, setForm] = useState({ carnet: '', ciclo: '', anio: String(new Date().getFullYear()), precio: '', forma_pago: '', fecha: hoy() })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/matricula', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (res.ok) { alert(`✓ Matrícula registrada — ID: ${d.id_matricula}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="Registrar Matrícula" onClose={onClose}>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de forms" />
        </ModalRow>
        <Inp className="pa-inp-full" placeholder="Carnet alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.ciclo} onChange={e => set('ciclo', e.target.value)}>
            <option value="">Ciclo a pagar</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </Sel>
          <Sel className="pa-inp-purple" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
            <option value="">Forma de pago</option>
            {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
          </Sel>
        </ModalRow>
        <ModalRow>
          <Inp type="number" placeholder="Año"        value={form.anio}   onChange={e => set('anio', e.target.value)} />
          <Inp type="number" placeholder="Precio (Q)" value={form.precio} onChange={e => set('precio', e.target.value)} />
        </ModalRow>
        <ModalBtns onClose={onClose} onGuardar={guardar} />
      </ModalBase>
  )
}

// ─── Modal Mensualidad ────────────────────────────────────────────────────────
function ModalMensualidad({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/mensualidad/next-id')
  const [form, setForm] = useState({ carnet: '', mes: '', forma_pago: '', fecha_limite: ultimoDiaMes(), precio: '', estado_pago: 'Pendiente', dias_mora: 0, monto_mora: 0 })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  function handleDiasMora(v) {
    const dias = parseInt(v) || 0
    const mora = dias > 5 ? Math.min((dias - 5) * 10, 260) : 0
    setForm(f => ({ ...f, dias_mora: v, monto_mora: mora }))
  }

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/mensualidad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (res.ok) { alert(`✓ Mensualidad registrada — ID: ${d.id_mensualidad}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="Registrar Mensualidad" onClose={onClose}>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de forms" />
        </ModalRow>
        <Inp className="pa-inp-full" placeholder="Carnet alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>
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
        <ModalRow>
          <Inp type="number" placeholder="Días en mora" value={form.dias_mora} onChange={e => handleDiasMora(e.target.value)} />
          <Inp className="pa-inp-green" type="number" placeholder="Mora (Q)" value={form.monto_mora} readOnly title="Q10/día desde día 6, máx Q260" />
        </ModalRow>
        <ModalBtns onClose={onClose} onGuardar={guardar} />
      </ModalBase>
  )
}

// ─── Modal Pagos Varios ───────────────────────────────────────────────────────
function ModalPagosVarios({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/varios/next-id')
  const [form, setForm] = useState({ carnet: '', motivo_pago: '', forma_pago: '', precio: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  async function guardar() {
    try {
      const res = await fetch('/pagos-alumnos/registros/varios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (res.ok) { alert(`✓ Pago registrado — ID: ${d.id_pagos_varios}`); onClose() }
      else alert('Error: ' + d.error)
    } catch { alert('Error de conexión') }
  }

  return (
      <ModalBase title="Registrar Pagos Varios" onClose={onClose}>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de forms" />
        </ModalRow>
        <Inp className="pa-inp-full" placeholder="Carnet alumno" value={form.carnet} onChange={e => set('carnet', e.target.value)} />
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>
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

// ─── Modal Parqueo ────────────────────────────────────────────────────────────
function ModalParqueo({ onClose }) {
  const [nextId] = useNextId('/pagos-alumnos/registros/varios/next-id')
  const [form, setForm] = useState({ carnet: '', visitante: '', tipo_tarifa: '', forma_pago: '', fecha_inicio: ahoraLocal(), fecha_fin: '', estado: '', precio: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const alumno = useAlumno(form.carnet)

  return (
      <ModalBase title="Registrar Pago Parqueo" onClose={onClose}>
        <ModalRow>
          <Inp className="pa-inp-orange" type="date" value={hoy()} readOnly />
          <Inp className="pa-inp-id" readOnly value={nextId !== null ? (nextId === '—' ? 'cargando...' : `#${nextId}`) : 'cargando...'} placeholder="No. de forms" />
        </ModalRow>
        <ModalRow>
          <Inp placeholder="Carnet alumno (opcional)" value={form.carnet}    onChange={e => set('carnet', e.target.value)} />
          <Inp placeholder="Visitante (opcional)"     value={form.visitante} onChange={e => set('visitante', e.target.value)} />
        </ModalRow>
        <ModalRow>
          <Inp className="pa-inp-green" placeholder="Nombres"   value={alumno.nombres}   readOnly />
          <Inp className="pa-inp-green" placeholder="Apellidos" value={alumno.apellidos} readOnly />
        </ModalRow>
        <ModalRow>
          <Sel className="pa-inp-purple" value={form.tipo_tarifa} onChange={e => set('tipo_tarifa', e.target.value)}>
            <option value="">Pago por hora/día/mes</option>
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

export default function PagosAlumnos() {
  const [modal,       setModal]       = useState(null)
  const [vista,       setVista]       = useState(null)   // 'cuenta' | 'agenda'
  const [busqueda,    setBusqueda]    = useState('')
  const [busquedaSin, setBusquedaSin] = useState('')
  const [filtromes,   setFiltroMes]   = useState(mesActual())
  const [pagos,       setPagos]       = useState([])
  const [sinPagos,    setSinPagos]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [reciboActivo,setReciboActivo]= useState(null)

  async function cargarDatos() {
    setCargando(true); setError(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/pagos-alumnos/con-pago?mes=${filtromes}`),
        fetch(`/pagos-alumnos/sin-pago?mes=${filtromes}`),
      ])
      if (!r1.ok || !r2.ok) throw new Error('Error al consultar la base de datos')
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setPagos(d1); setSinPagos(d2)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [filtromes])

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

  const totalMes = pagos.reduce((acc, p) => acc + parseFloat(p.monto?.replace(/[^0-9.]/g, '') || 0), 0)

  return (
      <div className="uspg-page pa-wrap">

        {/* ── Header ── */}
        <div className="pa-header">
          <h1>Sistema de pagos alumnos</h1>
          <nav className="pa-nav">
            <a onClick={() => setVista('cuenta')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-book" /><span>Estados de cuentas</span>
            </a>
            <a href="/sistema-academico" style={{ cursor: 'pointer' }}>
              <i className="fa fa-users" /><span>Gestión alumnos</span>
            </a>
            <a onClick={() => setVista('agenda')} style={{ cursor: 'pointer' }}>
              <i className="fa fa-calendar" /><span>Agenda</span>
            </a>
          </nav>
        </div>

        {/* ── Stats + Registrar ── */}
        <div className="pa-stats">
          <div className="pa-stat">
            <div className="val">Q{totalMes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
            <div className="lbl">Ingresos del Mes</div>
          </div>
          <div className="pa-stat">
            <div className="val">{cargando ? '...' : pagos.length}</div>
            <div className="lbl">Pagos Registrados</div>
          </div>
          <div className="pa-stat">
            <div className="val">{cargando ? '...' : sinPagos.length}</div>
            <div className="lbl">Alumnos en Mora</div>
          </div>
          <div className="pa-reg">
            <div className="reg-title">REGISTRAR PAGOS</div>
            <div className="pa-reg-btns">
              <button className="pa-reg-btn" onClick={() => setModal('matricula')}><i className="fa fa-id-card" />Matricula</button>
              <button className="pa-reg-btn" onClick={() => setModal('mensualidad')}><i className="fa fa-file-text" />Mensualidad</button>
              <button className="pa-reg-btn" onClick={() => setModal('varios')}><i className="fa fa-list" />Pagos Varios</button>
              <button className="pa-reg-btn" onClick={() => setModal('parqueo')}><i className="fa fa-car" />Parqueo</button>
            </div>
          </div>
        </div>

        {error && (
            <div style={{ background: 'rgba(185,28,28,0.15)', color: '#fca5a5', borderRadius: 8, padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(185,28,28,0.3)' }}>
              ⚠️ {error} — <button onClick={cargarDatos} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Reintentar</button>
            </div>
        )}

        {/* ── Tabla CON pagos ── */}
        <div className="lab-table-wrap" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div className="pa-table-header">
            <h3>🔍 Búsqueda alumnos con pagos del mes</h3>
            <div className="pa-table-controls">
              <input
                  type="month"
                  className="pa-search"
                  value={filtromes}
                  onChange={e => setFiltroMes(e.target.value)}
                  title="Filtrar por mes"
                  style={{ width: '140px' }}
              />
              <input
                  className="pa-search"
                  placeholder="🔍 Buscar por carnet o nombre..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          {cargando ? (
              <p style={{ textAlign: 'center', color: 'var(--uspg-muted)', padding: '2rem' }}>Cargando...</p>
          ) : (
              <table className="lab-table">
                <thead>
                <tr>
                  <th>No.</th><th>Carnet</th><th>Nombre</th><th>Apellidos</th>
                  <th>Forma de pago</th><th>Concepto</th><th>Descripción</th>
                  <th>Fecha</th><th>Monto</th><th>Ver recibo</th>
                </tr>
                </thead>
                <tbody>
                {filtrados.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--uspg-muted)' }}>Sin pagos registrados este mes</td></tr>
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
                            className="lab-btn-primary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={() => setReciboActivo(p)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>

        {/* ── Tabla SIN pagos ── */}
        <div className="lab-table-wrap" style={{ padding: '1rem' }}>
          <div className="pa-table-header">
            <h3>Búsqueda alumno sin pagos del mes</h3>
            <div className="pa-table-controls">
              <input
                  className="pa-search"
                  placeholder="🔍 Buscar por carnet o nombre..."
                  value={busquedaSin}
                  onChange={e => setBusquedaSin(e.target.value)}
              />
            </div>
          </div>
          {cargando ? (
              <p style={{ textAlign: 'center', color: 'var(--uspg-muted)', padding: '2rem' }}>Cargando...</p>
          ) : (
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
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--uspg-muted)' }}>✅ Todos los alumnos tienen pagos este mes</td></tr>
                ) : filtradosSin.map((p, i) => (
                    <tr key={`sinpago-${p.carnet}-${i}`}>
                      <td>{p.no}</td>
                      <td>{p.carnet}</td>
                      <td>{p.nombre}</td>
                      <td>{p.apellidos}</td>
                      <td>{p.carrera}</td>
                      <td><span className={`badge-${(p.estado || '').toLowerCase()}`}>{p.estado}</span></td>
                      <td>{p.forma}</td>
                      <td><strong>{p.sin_pagar}</strong></td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>

        {/* ── Modales de registro ── */}
        {modal === 'matricula'   && <ModalMatricula   onClose={handleCloseModal} />}
        {modal === 'mensualidad' && <ModalMensualidad onClose={handleCloseModal} />}
        {modal === 'varios'      && <ModalPagosVarios onClose={handleCloseModal} />}
        {modal === 'parqueo'     && <ModalParqueo     onClose={handleCloseModal} />}

        {/* ── Vistas de nav ── */}
        {vista === 'cuenta' && <VistaEstadoCuenta onClose={() => setVista(null)} />}
        {vista === 'agenda' && <VistaAgenda       onClose={() => setVista(null)} />}

        {/* ── Modal recibo ── */}
        {reciboActivo && <ModalRecibo pago={reciboActivo} onClose={() => setReciboActivo(null)} />}
      </div>
  )
}