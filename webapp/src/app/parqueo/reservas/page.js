"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("es-GT", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  }) : "—";

const STATUS_MAP = {
  ACTIVE:    { label:"Activa",    cls:"badge-success"  },
  PENDING:   { label:"Pendiente", cls:"badge-warning"  },
  EXPIRED:   { label:"Expirada",  cls:"badge-secondary"},
  CANCELLED: { label:"Cancelada", cls:"badge-danger"   },
  COMPLETED: { label:"Completada",cls:"badge-info"     },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls:"badge-secondary" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ── Contador regresivo ────────────────────────────────────────────────────────
function Countdown({ endTime }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expirada"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const diff = new Date(endTime).getTime() - Date.now();
  const urgent = diff > 0 && diff < 30 * 60 * 1000; // menos de 30 min

  return (
    <span style={{ color: urgent ? "#db2828" : "#17a2b8", fontWeight: urgent ? 700 : 400, fontSize: 12 }}>
      {urgent && <i className="fa fa-exclamation-triangle" style={{ marginRight:4 }} />}
      {remaining}
    </span>
  );
}

// ── Modal: Nueva reserva ──────────────────────────────────────────────────────
function NewReservaModal({ onClose, onDone }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2,"0");
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    space_code:  "",
    zone:        "A",
    start_time:  defaultStart,
    end_time:    "",
    type:        "STANDARD",
    event_name:  "",
    notes:       "",
  });
  const [spaces,  setSpaces]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Cargar espacios disponibles de la zona seleccionada
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/parking-spaces?zone=${form.zone}&status=AVAILABLE&limit=200`);
        setSpaces(res.data.data || []);
      } catch { setSpaces([]); }
    };
    fetch();
  }, [form.zone]);

  const submit = async () => {
    if (!form.space_code) { setError("Selecciona un espacio."); return; }
    if (!form.start_time) { setError("Indica la fecha y hora de inicio."); return; }
    if (!form.end_time)   { setError("Indica la fecha y hora de fin."); return; }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("La hora de fin debe ser posterior al inicio."); return;
    }
    setLoading(true); setError("");
    try {
      const space = spaces.find(s => s.code === form.space_code) ||
                    { code: form.space_code, zone: form.zone };
      await api.post("/reservations", {
        space_id:   space.id || undefined,
        space_code: form.space_code,
        zone:       form.zone,
        start_time: new Date(form.start_time).toISOString(),
        end_time:   new Date(form.end_time).toISOString(),
        type:       form.type,
        event_name: form.event_name.trim() || undefined,
        notes:      form.notes.trim()      || undefined,
      });
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Error al crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1050,
      background:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:500, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-calendar-plus-o" style={{ marginRight:8 }} />
              Nueva reserva
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div className="row">
              {/* Zona */}
              <div className="col-4">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Zona</label>
                  <select className="form-control form-control-sm"
                    value={form.zone} onChange={e => { set("zone", e.target.value); set("space_code",""); }}>
                    {["A","B","C","D"].map(z => <option key={z} value={z}>Zona {z}</option>)}
                  </select>
                </div>
              </div>
              {/* Espacio */}
              <div className="col-8">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Espacio *</label>
                  <select className="form-control form-control-sm"
                    value={form.space_code} onChange={e => set("space_code", e.target.value)}>
                    <option value="">— Selecciona un espacio —</option>
                    {spaces.map(s => (
                      <option key={s.id} value={s.code}>{s.code} · {s.type}</option>
                    ))}
                  </select>
                  {spaces.length === 0 && (
                    <small style={{ color:"#fbbd08" }}>No hay espacios disponibles en zona {form.zone}</small>
                  )}
                </div>
              </div>
              {/* Inicio */}
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Inicio *</label>
                  <input type="datetime-local" className="form-control form-control-sm"
                    value={form.start_time} onChange={e => set("start_time", e.target.value)} />
                </div>
              </div>
              {/* Fin */}
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Fin *</label>
                  <input type="datetime-local" className="form-control form-control-sm"
                    value={form.end_time} onChange={e => set("end_time", e.target.value)} />
                </div>
              </div>
              {/* Tipo */}
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Tipo de reserva</label>
                  <select className="form-control form-control-sm"
                    value={form.type} onChange={e => set("type", e.target.value)}>
                    <option value="STANDARD">Estándar</option>
                    <option value="EVENT">Evento</option>
                    <option value="VIP">VIP</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="VISITOR">Visitante</option>
                  </select>
                </div>
              </div>
              {/* Nombre del evento */}
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>
                    Nombre del evento <span style={{ color:"#7d8490", fontWeight:400 }}>(opcional)</span>
                  </label>
                  <input className="form-control form-control-sm"
                    placeholder="Graduación, Conferencia..."
                    value={form.event_name} onChange={e => set("event_name", e.target.value)} />
                </div>
              </div>
              {/* Notas */}
              <div className="col-12">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>
                    Notas <span style={{ color:"#7d8490", fontWeight:400 }}>(opcional)</span>
                  </label>
                  <textarea className="form-control form-control-sm" rows={2}
                    placeholder="Instrucciones adicionales..."
                    value={form.notes} onChange={e => set("notes", e.target.value)} />
                </div>
              </div>
            </div>
            {error && <p style={{ color:"#db2828", fontSize:12, marginTop:4 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
              {loading
                ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                : <i className="fa fa-calendar-check-o" style={{ marginRight:6 }} />}
              Crear reserva
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Cancelar reserva ───────────────────────────────────────────────────
function CancelModal({ reservation, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  if (!reservation) return null;

  const confirm = async () => {
    setLoading(true); setError("");
    try {
      await api.post(`/reservations/${reservation.id}/cancel`, {});
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Error al cancelar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1060,
      background:"rgba(0,0,0,0.7)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:380, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#db2828" }}>
              <i className="fa fa-times-circle" style={{ marginRight:8 }} />
              Cancelar reserva
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div style={{
              background:"rgba(219,40,40,0.08)", border:"1px solid rgba(219,40,40,0.3)",
              borderRadius:6, padding:"10px 14px", marginBottom:12,
            }}>
              <div style={{ fontWeight:700, color:"#800020" }}>
                {reservation.space?.code || reservation.space_code || "—"}
                <span style={{ color:"#7d8490", fontWeight:400, marginLeft:8, fontSize:13 }}>
                  Zona {reservation.space?.zone || reservation.zone}
                </span>
              </div>
              {reservation.event_name && (
                <div style={{ fontSize:12, color:"#7d8490", marginTop:2 }}>
                  <i className="fa fa-calendar" style={{ marginRight:4 }} />
                  {reservation.event_name}
                </div>
              )}
              <div style={{ fontSize:12, color:"#7d8490", marginTop:4 }}>
                {fmtDate(reservation.start_time)} → {fmtDate(reservation.end_time)}
              </div>
            </div>
            <p style={{ fontSize:13, color:"#7d8490", marginBottom:0 }}>
              Esta acción liberará el espacio reservado. ¿Confirmas la cancelación?
            </p>
            {error && <p style={{ color:"#db2828", fontSize:12, marginTop:8 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-danger btn-sm" onClick={confirm} disabled={loading}>
              {loading
                ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                : <i className="fa fa-times" style={{ marginRight:6 }} />}
              Sí, cancelar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Volver</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Reservas() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [filterZone,   setFilterZone]   = useState("ALL");
  const [filterType,   setFilterType]   = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [filterDate,   setFilterDate]   = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit:"200" });
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      // Backend only exposes /reservations/active — use it when filtering for active/pending,
      // otherwise fall back to the user's own reservations list.
      const endpoint = (filterStatus === "ACTIVE" || filterStatus === "ALL")
        ? "/reservations/active"
        : "/reservations/my";
      const res = await api.get(endpoint);
      const all = res.data.data?.reservations || res.data.data || [];
      // Apply status filter client-side since backend doesn't support arbitrary status param
      setReservations(
        filterStatus !== "ALL"
          ? all.filter(r => r.status === filterStatus)
          : all
      );
    } catch (e) {
      console.error("Error cargando reservas:", e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { setShowNew(false); setCancelTarget(null); load(); };

  // Filtrado local
  const filtered = reservations.filter(r => {
    if (filterZone !== "ALL" && (r.space?.zone || r.zone) !== filterZone) return false;
    if (filterType !== "ALL" && r.type !== filterType) return false;
    if (filterDate) {
      const d = filterDate;
      const start = (r.start_time || "").slice(0,10);
      const end   = (r.end_time   || "").slice(0,10);
      if (start > d || end < d) return false;
    }
    return true;
  });

  // Próximas a expirar (activas con menos de 30 min)
  const expiringSoon = filtered.filter(r => {
    if (r.status !== "ACTIVE" && r.status !== "PENDING") return false;
    const diff = new Date(r.end_time).getTime() - Date.now();
    return diff > 0 && diff < 30 * 60 * 1000;
  });

  const activeCount  = reservations.filter(r => r.status === "ACTIVE").length;
  const pendingCount = reservations.filter(r => r.status === "PENDING").length;
  const todayCount   = reservations.filter(r => (r.start_time||"").slice(0,10) === new Date().toISOString().slice(0,10)).length;

  if (loading) return (
    <div className="text-center" style={{ padding:"3rem" }}>
      <i className="fa fa-spinner fa-spin fa-2x" style={{ color:"#800020" }} />
      <p style={{ color:"#7d8490", marginTop:"1rem" }}>Cargando reservas...</p>
    </div>
  );

  return (
    <>
      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="row clearfix" style={{ marginBottom:"0.5rem" }}>
        {[
          { label:"Activas ahora",      value:activeCount,        color:"#21ba45", icon:"fa-calendar-check-o" },
          { label:"Pendientes",         value:pendingCount,       color:"#fbbd08", icon:"fa-clock-o"          },
          { label:"Hoy",                value:todayCount,         color:"#17a2b8", icon:"fa-calendar"         },
          { label:"Próximas a expirar", value:expiringSoon.length, color:expiringSoon.length > 0 ? "#db2828" : "#7d8490", icon:"fa-exclamation-triangle" },
        ].map(({ label, value, color, icon }) => (
          <div className="col-lg-3 col-md-6 col-sm-12" key={label}>
            <div className="card" style={{ borderLeft:`4px solid ${color}`, marginBottom:"1rem" }}>
              <div className="card-body" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <i className={`fa ${icon}`} style={{ color, fontSize:18 }} />
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:700, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:12, color:"#7d8490", marginTop:2 }}>{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alerta reservas próximas a expirar ────────────────────────────────── */}
      {expiringSoon.length > 0 && (
        <div className="row clearfix">
          <div className="col-12">
            <div style={{
              background:"rgba(219,40,40,0.10)", border:"1px solid rgba(219,40,40,0.4)",
              borderRadius:6, padding:"10px 16px", marginBottom:"1rem",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <i className="fa fa-exclamation-circle" style={{ color:"#db2828", fontSize:18 }} />
              <span style={{ fontSize:13, color:"#db2828", fontWeight:600 }}>
                {expiringSoon.length} reserva{expiringSoon.length > 1 ? "s" : ""} expira{expiringSoon.length === 1 ? "" : "n"} en menos de 30 minutos:
              </span>
              <span style={{ fontSize:13, color:"#7d8490" }}>
                {expiringSoon.map(r => r.space?.code || r.space_code || r.id.slice(0,8)).join(", ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros ───────────────────────────────────────────────────────────── */}
      <div className="row clearfix">
        <div className="col-12">
          <div className="card" style={{ marginBottom:"1rem" }}>
            <div className="card-body" style={{ padding:"0.85rem 1.25rem" }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                <select className="form-control form-control-sm" style={{ maxWidth:130 }}
                  value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                  <option value="ALL">Todas las zonas</option>
                  {["A","B","C","D"].map(z => <option key={z} value={z}>Zona {z}</option>)}
                </select>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="ALL">Todos los tipos</option>
                  <option value="STANDARD">Estándar</option>
                  <option value="EVENT">Evento</option>
                  <option value="VIP">VIP</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="VISITOR">Visitante</option>
                </select>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="ALL">Todos los estados</option>
                  <option value="ACTIVE">Activas</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="EXPIRED">Expiradas</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="COMPLETED">Completadas</option>
                </select>

                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <label style={{ fontSize:12, color:"#7d8490", marginBottom:0 }}>Fecha:</label>
                  <input type="date" className="form-control form-control-sm" style={{ maxWidth:150 }}
                    value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                  {filterDate && (
                    <button className="btn btn-default btn-sm" onClick={() => setFilterDate("")}>
                      <i className="fa fa-times" />
                    </button>
                  )}
                </div>

                <button className="btn btn-primary btn-sm" style={{ marginLeft:"auto" }}
                  onClick={() => setShowNew(true)}>
                  <i className="fa fa-calendar-plus-o" style={{ marginRight:6 }} />
                  Nueva reserva
                </button>
                <button className="btn btn-default btn-sm" onClick={load}>
                  <i className="fa fa-refresh" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────────── */}
      <div className="row clearfix">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa fa-calendar" style={{ marginRight:6 }} />
                Reservas
                <span className="badge badge-secondary" style={{ marginLeft:8, fontSize:12 }}>
                  {filtered.length}
                </span>
              </h3>
            </div>
            <div className="card-body" style={{ padding:0 }}>
              <div className="table-responsive">
                <table className="table table-hover table-striped mb-0">
                  <thead>
                    <tr style={{ background:"rgba(128,0,32,0.08)" }}>
                      <th>Espacio</th>
                      <th>Zona</th>
                      <th>Tipo</th>
                      <th>Evento</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Tiempo restante</th>
                      <th>Estado</th>
                      <th style={{ textAlign:"center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                          <i className="fa fa-calendar-o fa-2x" style={{ display:"block", marginBottom:8, color:"#343a40" }} />
                          Sin reservas que coincidan con los filtros
                        </td>
                      </tr>
                    ) : (
                      filtered.map(r => {
                        const zone    = r.space?.zone || r.zone || "—";
                        const code    = r.space?.code || r.space_code || "—";
                        const isLive  = r.status === "ACTIVE" || r.status === "PENDING";
                        const notEnded= new Date(r.end_time).getTime() > Date.now();
                        return (
                          <tr key={r.id}>
                            <td>
                              <span className="badge" style={{ background:"rgba(128,0,32,0.15)", color:"#800020", fontSize:12 }}>
                                {code}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-default">Zona {zone}</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                r.type === "VIP"         ? "badge-danger"  :
                                r.type === "EVENT"       ? "badge-info"    :
                                r.type === "MAINTENANCE" ? "badge-warning" : "badge-default"
                              }`}>{r.type || "—"}</span>
                            </td>
                            <td style={{ fontSize:13 }}>
                              {r.event_name
                                ? <><i className="fa fa-calendar-o" style={{ marginRight:4, color:"#7d8490" }} />{r.event_name}</>
                                : <span style={{ color:"#7d8490" }}>—</span>}
                            </td>
                            <td style={{ fontSize:12 }}>{fmtDate(r.start_time)}</td>
                            <td style={{ fontSize:12 }}>{fmtDate(r.end_time)}</td>
                            <td>
                              {isLive && notEnded
                                ? <Countdown endTime={r.end_time} />
                                : <span style={{ color:"#7d8490", fontSize:12 }}>—</span>}
                            </td>
                            <td><StatusBadge status={r.status} /></td>
                            <td style={{ textAlign:"center" }}>
                              {(r.status === "ACTIVE" || r.status === "PENDING") && (
                                <button className="btn btn-danger btn-sm"
                                  title="Cancelar reserva"
                                  onClick={() => setCancelTarget(r)}>
                                  <i className="fa fa-times" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {filtered.length > 0 && (
              <div className="card-footer" style={{ fontSize:12, color:"#7d8490", padding:"0.65rem 1.25rem" }}>
                Mostrando {filtered.length} reservas
                {filterStatus !== "ALL" && ` · estado: ${filterStatus}`}
                {filterZone   !== "ALL" && ` · zona: ${filterZone}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showNew      && <NewReservaModal  onClose={() => setShowNew(false)}      onDone={handleDone} />}
      {cancelTarget && <CancelModal      reservation={cancelTarget} onClose={() => setCancelTarget(null)} onDone={handleDone} />}
    </>
  );
}
