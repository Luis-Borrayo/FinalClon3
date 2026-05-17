"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import CampusMapPicker from "@/components/parqueo/CampusMapPicker";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("es-GT", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  }) : "—";

const STATUS_MAP = {
  CONFIRMED: { label:"Confirmada", cls:"badge-success"   },
  PENDING:   { label:"Pendiente",  cls:"badge-warning"   },
  CANCELLED: { label:"Cancelada",  cls:"badge-danger"    },
  EXPIRED:   { label:"Expirada",   cls:"badge-secondary" },
  USED:      { label:"Usada",      cls:"badge-info"      },
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

// ── Traducciones ──────────────────────────────────────────────────────────────
const TIPO_RESERVA = {
  STANDARD:      "Estándar",
  PERSONAL:      "Personal",
  EVENT:         "Evento",
  SPECIAL_VISIT: "Visita especial",
  VIP:           "VIP",
  MAINTENANCE:   "Mantenimiento",
};

// ── Traducción de tipos de espacio ────────────────────────────────────────────
const TIPO_ESPACIO = {
  STANDARD:    "Estándar",
  HANDICAPPED: "Discapacitado",
  ELECTRIC:    "Eléctrico",
  RESERVED:    "Reservado",
  VIP:         "VIP",
  MOTORCYCLE:  "Motocicleta",
};

// ── Datos demo para reservas ──────────────────────────────────────────────────
function demoReservations() {
  const now = Date.now();
  const h = 3600000;
  return [
    { id:"d1", space:{ code:"A-001", zone:"A" }, zone:"A", type:"STANDARD",  status:"CONFIRMED", start_time:new Date(now + 1*h).toISOString(), end_time:new Date(now + 3*h).toISOString(), event_name:"Graduación 2026" },
    { id:"d2", space:{ code:"B-005", zone:"B" }, zone:"B", type:"EVENT",     status:"CONFIRMED", start_time:new Date(now + 2*h).toISOString(), end_time:new Date(now + 5*h).toISOString(), event_name:"Conferencia TI"  },
    { id:"d3", space:{ code:"A-012", zone:"A" }, zone:"A", type:"PERSONAL",  status:"PENDING",   start_time:new Date(now - 1*h).toISOString(), end_time:new Date(now + 1*h).toISOString(), event_name:null },
    { id:"d4", space:{ code:"C-003", zone:"C" }, zone:"C", type:"STANDARD",  status:"CANCELLED", start_time:new Date(now - 5*h).toISOString(), end_time:new Date(now - 3*h).toISOString(), event_name:null },
    { id:"d5", space:{ code:"D-007", zone:"D" }, zone:"D", type:"SPECIAL_VISIT", status:"USED", start_time:new Date(now - 8*h).toISOString(), end_time:new Date(now - 6*h).toISOString(), event_name:"Visita rector" },
  ];
}

// ── Espacios demo cuando no hay BD ───────────────────────────────────────────
function demoSpaces(zone) {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `demo-${zone}-${i + 1}`,
    code: `${zone}-${String(i + 1).padStart(3, "0")}`,
    zone,
    type: i === 0 ? "VIP" : i < 3 ? "HANDICAP" : "STANDARD",
  }));
}


// ── Modal: Nueva reserva ──────────────────────────────────────────────────────
function NewReservaModal({ onClose, onDone }) {
  const soon = new Date(Date.now() + 5 * 60000);
  const pad = (n) => String(n).padStart(2,"0");
  const defaultStart = `${soon.getFullYear()}-${pad(soon.getMonth()+1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;

  const [form, setForm] = useState({
    selected_codes: [],
    start_time:  defaultStart,
    end_time:    "",
    type:        "STANDARD",
    event_name:  "",
    notes:       "",
  });
  // spaces agrupados por zona {A:[], B:[], C:[], D:[]}
  const [spaces,    setSpaces]    = useState({ A:[], B:[], C:[], D:[] });
  const [zoneStats, setZoneStats] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Cargar todos los espacios disponibles agrupados por zona
  useEffect(() => {
    const load = async () => {
      try {
        const [spacesRes, statusRes] = await Promise.all([
          api.get("/spaces?status=AVAILABLE&limit=600"),
          api.get("/spaces/status"),
        ]);
        const all = spacesRes.data.data || [];
        const grouped = { A:[], B:[], C:[], D:[] };
        all.forEach(sp => { if (grouped[sp.zone] !== undefined) grouped[sp.zone].push(sp); });
        // fallback demo si está vacío
        if (!all.length) {
          ["A","B","C","D"].forEach(z => { grouped[z] = demoSpaces(z); });
        }
        setSpaces(grouped);
        setZoneStats(statusRes.data.data?.by_zone || {});
      } catch {
        const grouped = { A:[], B:[], C:[], D:[] };
        ["A","B","C","D"].forEach(z => { grouped[z] = demoSpaces(z); });
        setSpaces(grouped);
      }
    };
    load();
  }, []);

  // Mapa de code → objeto space (para submit)
  const allSpaces = Object.values(spaces).flat();

  const toggleSpace = (code) => {
    set("selected_codes", form.selected_codes.includes(code)
      ? form.selected_codes.filter(c => c !== code)
      : [...form.selected_codes, code]
    );
  };

  const submit = async () => {
    if (form.selected_codes.length === 0) { setError("Selecciona al menos un espacio en el mapa."); return; }
    if (!form.start_time) { setError("Indica la fecha y hora de inicio."); return; }
    if (!form.end_time)   { setError("Indica la fecha y hora de fin."); return; }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("La hora de fin debe ser posterior al inicio."); return;
    }
    // Validación de conflictos: espacios RESERVED o OCCUPIED no disponibles
    const conflicting = form.selected_codes.filter(code => {
      const sp = allSpaces.find(s => s.code === code);
      return sp && (sp.status === "OCCUPIED" || sp.status === "RESERVED" || sp.status === "MAINTENANCE");
    });
    if (conflicting.length > 0) {
      setError(`Los siguientes espacios no están disponibles: ${conflicting.join(", ")}. Por favor selecciona otros.`);
      return;
    }
    setLoading(true); setError("");
    try {
      const selected = allSpaces.filter(s => form.selected_codes.includes(s.code)
        && !String(s.id || "").startsWith("demo-"));
      await Promise.all(selected.map(space =>
        api.post("/reservations", {
          space_id:   space.id,
          space_code: space.code,
          zone:       space.zone,
          start_time: new Date(form.start_time).toISOString(),
          end_time:   new Date(form.end_time).toISOString(),
          type:       form.type,
          event_name: form.event_name.trim() || undefined,
          notes:      form.notes.trim()      || undefined,
        })
      ));
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
      background:"rgba(0,0,0,0.70)", alignItems:"flex-start", justifyContent:"center",
      overflowY:"auto", padding:"24px 16px",
    }} onClick={onClose}>
      <div style={{ maxWidth:860, width:"100%", margin:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-calendar-plus-o" style={{ marginRight:8 }} />
              Nueva reserva
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>

          <div className="modal-body" style={{ padding:"1rem" }}>
            {/* Contador de seleccionados */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#800020" }}>
                <i className="fa fa-map" style={{ marginRight:6 }} />
                Selecciona espacios en el mapa
              </span>
              {form.selected_codes.length > 0 && (
                <span style={{ fontSize:12, background:"rgba(128,0,32,0.12)", color:"#800020",
                  fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
                  {form.selected_codes.length} espacio{form.selected_codes.length > 1 ? "s" : ""} seleccionado{form.selected_codes.length > 1 ? "s" : ""}:&nbsp;
                  {form.selected_codes.join(", ")}
                </span>
              )}
            </div>

            {/* Mapa satelital */}
            <div style={{ marginBottom:16, borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
              <CampusMapPicker
                spaces={spaces}
                zoneStats={zoneStats}
                selectedCodes={form.selected_codes}
                onToggle={toggleSpace}
              />
            </div>

            {/* Campos del formulario */}
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Inicio *</label>
                  <input type="datetime-local" className="form-control form-control-sm"
                    value={form.start_time} onChange={e => set("start_time", e.target.value)} />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Fin *</label>
                  <input type="datetime-local" className="form-control form-control-sm"
                    value={form.end_time} onChange={e => set("end_time", e.target.value)} />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Tipo de reserva</label>
                  <select className="form-control form-control-sm"
                    value={form.type} onChange={e => set("type", e.target.value)}>
                    <option value="STANDARD">Estándar</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="EVENT">Evento</option>
                    <option value="SPECIAL_VISIT">Visita especial</option>
                  </select>
                </div>
              </div>
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
              <div className="col-12">
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label style={{ fontSize:13, fontWeight:600 }}>
                    Notas <span style={{ color:"#7d8490", fontWeight:400 }}>(opcional)</span>
                  </label>
                  <textarea className="form-control form-control-sm" rows={2}
                    placeholder="Instrucciones adicionales..."
                    value={form.notes} onChange={e => set("notes", e.target.value)} />
                </div>
              </div>
            </div>
            {error && <p style={{ color:"#db2828", fontSize:12, marginTop:8, marginBottom:0 }}>{error}</p>}
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

// ── Modal: Enviar QR por correo ───────────────────────────────────────────────
function SendQRModal({ reservation, onClose, onSent }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  if (!reservation) return null;

  const spaceCode = reservation.space?.code || reservation.space_code || "—";
  const zone      = reservation.space?.zone  || reservation.zone      || "—";

  const send = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo válido."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/parqueo/qr/send-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reservation: {
            id:                 reservation.id,
            spaceCode,
            zone,
            type:               reservation.type,
            eventName:          reservation.event_name || null,
            startTime:          reservation.start_time,
            endTime:            reservation.end_time,
            startTimeFormatted: fmtDate(reservation.start_time),
            endTimeFormatted:   fmtDate(reservation.end_time),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar.");
      setSuccess(true);
      onSent?.(reservation.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1070,
      background:"rgba(0,0,0,0.70)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:400, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-qrcode" style={{ marginRight:8 }} />
              Enviar QR por correo
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            {success ? (
              <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                <i className="fa fa-check-circle fa-3x" style={{ color:"#21ba45", display:"block", marginBottom:12 }} />
                <p style={{ fontWeight:700, marginBottom:4 }}>¡Correo enviado!</p>
                <p style={{ color:"#7d8490", fontSize:13, marginBottom:0 }}>
                  El QR de la reserva <strong>{spaceCode}</strong> fue enviado a <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  background:"rgba(128,0,32,0.06)", border:"1px solid rgba(128,0,32,0.2)",
                  borderRadius:6, padding:"10px 14px", marginBottom:16,
                }}>
                  <div style={{ fontWeight:700, color:"#800020", fontSize:14 }}>{spaceCode}</div>
                  <div style={{ fontSize:12, color:"#7d8490", marginTop:2 }}>
                    Zona {zone} · {fmtDate(reservation.start_time)} → {fmtDate(reservation.end_time)}
                  </div>
                  {reservation.event_name && (
                    <div style={{ fontSize:12, color:"#7d8490", marginTop:2 }}>
                      <i className="fa fa-calendar-o" style={{ marginRight:4 }} />{reservation.event_name}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label style={{ fontSize:13, fontWeight:600 }}>Correo destino</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && send()}
                    autoFocus
                  />
                </div>
                {error && <p style={{ color:"#db2828", fontSize:12, marginTop:6, marginBottom:0 }}>{error}</p>}
              </>
            )}
          </div>
          <div className="modal-footer">
            {success ? (
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={send} disabled={loading}>
                  {loading
                    ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                    : <i className="fa fa-paper-plane" style={{ marginRight:6 }} />}
                  Enviar QR
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
              </>
            )}
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

// ── Modal: Enviar QRs por lote ────────────────────────────────────────────────
function SendBatchModal({ reservations, onClose }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const send = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo válido."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/parqueo/qr/send-batch", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reservations: reservations.map(r => ({
            id:                 r.id,
            spaceCode:          r.space?.code || r.space_code || "—",
            zone:               r.space?.zone || r.zone || "—",
            type:               r.type,
            eventName:          r.event_name || null,
            startTime:          r.start_time,
            endTime:            r.end_time,
            startTimeFormatted: fmtDate(r.start_time),
            endTimeFormatted:   fmtDate(r.end_time),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar.");
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1070,
      background:"rgba(0,0,0,0.70)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:460, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-paper-plane" style={{ marginRight:8 }} />
              Enviar {reservations.length} QR{reservations.length > 1 ? "s" : ""} por correo
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            {success ? (
              <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                <i className="fa fa-check-circle fa-3x" style={{ color:"#21ba45", display:"block", marginBottom:12 }} />
                <p style={{ fontWeight:700, marginBottom:4 }}>¡Correo enviado!</p>
                <p style={{ color:"#7d8490", fontSize:13, marginBottom:0 }}>
                  Se enviaron <strong>{reservations.length} QR{reservations.length > 1 ? "s" : ""}</strong> a <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Lista de reservas seleccionadas */}
                <div style={{ maxHeight:200, overflowY:"auto", marginBottom:14,
                  border:"1px solid rgba(255,255,255,0.08)", borderRadius:6 }}>
                  {reservations.map(r => (
                    <div key={r.id} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div>
                        <span style={{ fontWeight:700, color:"#800020", fontSize:13 }}>
                          {r.space?.code || r.space_code || "—"}
                        </span>
                        <span style={{ color:"#7d8490", fontSize:11, marginLeft:8 }}>
                          Zona {r.space?.zone || r.zone}
                        </span>
                      </div>
                      <span style={{ fontSize:11, color:"#7d8490" }}>{fmtDate(r.start_time)}</span>
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label style={{ fontSize:13, fontWeight:600 }}>Correo destino</label>
                  <input type="email" className="form-control form-control-sm"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && send()}
                    autoFocus />
                </div>
                {error && <p style={{ color:"#db2828", fontSize:12, marginTop:6, marginBottom:0 }}>{error}</p>}
              </>
            )}
          </div>
          <div className="modal-footer">
            {success ? (
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={send} disabled={loading}>
                  {loading
                    ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                    : <i className="fa fa-paper-plane" style={{ marginRight:6 }} />}
                  Enviar {reservations.length} QR{reservations.length > 1 ? "s" : ""}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
              </>
            )}
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
  const [showNew,        setShowNew]        = useState(false);
  const [cancelTarget,   setCancelTarget]   = useState(null);
  const [qrTarget,       setQrTarget]       = useState(null);
  const [selected,       setSelected]       = useState(new Set());
  const [showBatch,      setShowBatch]      = useState(false);
  const [showBatchCancel,setShowBatchCancel]= useState(false);
  const [batchCancelling,setBatchCancelling]= useState(false);
  const [sentQrIds,      setSentQrIds]      = useState(new Set());
  const [filterZone,   setFilterZone]   = useState("ALL");
  const [filterType,   setFilterType]   = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("CONFIRMED");
  const [filterDate,   setFilterDate]   = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      const res = await api.get(`/reservations?${params.toString()}`);
      const d = res.data.data;
      const all = Array.isArray(d) ? d : (d?.data ?? []);
      const list = all.length ? all : demoReservations();
      setReservations(
        filterStatus !== "ALL" ? list.filter(r => r.status === filterStatus) : list
      );
    } catch (e) {
      const demo = demoReservations();
      setReservations(filterStatus !== "ALL" ? demo.filter(r => r.status === filterStatus) : demo);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { setShowNew(false); setCancelTarget(null); load(); };

  const handleBatchCancel = async () => {
    setBatchCancelling(true);
    const ids = [...selected].filter(id =>
      filtered.find(r => r.id === id && (r.status === "CONFIRMED" || r.status === "PENDING"))
    );
    await Promise.allSettled(ids.map(id => api.post(`/reservations/${id}/cancel`, {})));
    setBatchCancelling(false);
    setShowBatchCancel(false);
    setSelected(new Set());
    load();
  };

  const toggleRow = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

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

  // Selección de filas (va después de filtered)
  const sendableIds = filtered
    .filter(r => r.status === "CONFIRMED" || r.status === "PENDING")
    .map(r => r.id);
  const allChecked  = sendableIds.length > 0 && sendableIds.every(id => selected.has(id));
  const someChecked = sendableIds.some(id => selected.has(id));
  const toggleAll   = () => setSelected(allChecked
    ? new Set([...selected].filter(id => !sendableIds.includes(id)))
    : new Set([...selected, ...sendableIds])
  );
  const selectedReservations = filtered.filter(r => selected.has(r.id));

  // Próximas a expirar (confirmadas/pendientes con menos de 30 min)
  const expiringSoon = filtered.filter(r => {
    if (r.status !== "CONFIRMED" && r.status !== "PENDING") return false;
    const diff = new Date(r.end_time).getTime() - Date.now();
    return diff > 0 && diff < 30 * 60 * 1000;
  });

  const activeCount  = reservations.filter(r => r.status === "CONFIRMED").length;
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
          { label:"Confirmadas",         value:activeCount,        color:"#21ba45", icon:"fa-calendar-check-o" },
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
                  <option value="PERSONAL">Personal</option>
                  <option value="EVENT">Evento</option>
                  <option value="SPECIAL_VISIT">Visita especial</option>
                </select>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="ALL">Todos los estados</option>
                  <option value="CONFIRMED">Confirmadas</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="EXPIRED">Expiradas</option>
                  <option value="USED">Usadas</option>
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
                      <th style={{ width:36, textAlign:"center" }}>
                        <input type="checkbox"
                          checked={allChecked}
                          ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                          onChange={toggleAll}
                          title="Seleccionar todas las enviables"
                        />
                      </th>
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
                        <td colSpan={10} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                          <i className="fa fa-calendar-o fa-2x" style={{ display:"block", marginBottom:8, color:"#343a40" }} />
                          Sin reservas que coincidan con los filtros
                        </td>
                      </tr>
                    ) : (
                      filtered.map(r => {
                        const zone    = r.space?.zone || r.zone || "—";
                        const code    = r.space?.code || r.space_code || "—";
                        const isLive  = r.status === "CONFIRMED" || r.status === "PENDING";
                        const notEnded= new Date(r.end_time).getTime() > Date.now();
                        const isSendable = r.status === "CONFIRMED" || r.status === "PENDING";
                        return (
                          <tr key={r.id} style={{ background: selected.has(r.id) ? "rgba(128,0,32,0.06)" : undefined }}>
                            <td style={{ textAlign:"center" }}>
                              {isSendable && (
                                <input type="checkbox"
                                  checked={selected.has(r.id)}
                                  onChange={() => toggleRow(r.id)}
                                />
                              )}
                            </td>
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
                                r.type === "VIP"           ? "badge-danger"  :
                                r.type === "EVENT"         ? "badge-info"    :
                                r.type === "SPECIAL_VISIT" ? "badge-warning" : "badge-default"
                              }`}>{TIPO_RESERVA[r.type] || r.type || "—"}</span>
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
                              <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center" }}>
                                {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                                  <button className="btn btn-info btn-sm"
                                    title="Enviar QR por correo"
                                    onClick={() => setQrTarget(r)}>
                                    <i className="fa fa-qrcode" />
                                  </button>
                                )}
                                {sentQrIds.has(r.id) && (
                                  <span title="QR enviado" style={{ color:"#21ba45", fontSize:16, lineHeight:1 }}>
                                    <i className="fa fa-check-circle" />
                                  </span>
                                )}
                                {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                                  <button className="btn btn-danger btn-sm"
                                    title="Cancelar reserva"
                                    onClick={() => setCancelTarget(r)}>
                                    <i className="fa fa-times" />
                                  </button>
                                )}
                              </div>
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

      {/* ── Barra flotante de selección ───────────────────────────────────────── */}
      {selected.size > 0 && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          zIndex:1040, background:"#1a1a2e", borderRadius:12,
          padding:"12px 20px", boxShadow:"0 8px 32px rgba(0,0,0,0.45)",
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
        }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:14, marginRight:4 }}>
            <i className="fa fa-check-square-o" style={{ marginRight:8, color:"#800020" }} />
            {selected.size} reserva{selected.size > 1 ? "s" : ""} seleccionada{selected.size > 1 ? "s" : ""}
          </span>
          <button className="btn btn-sm" onClick={() => setShowBatch(true)}
            style={{ background:"#17a2b8", color:"#fff", fontWeight:600, border:"none", borderRadius:8 }}>
            <i className="fa fa-paper-plane" style={{ marginRight:6 }} />
            Enviar QRs
          </button>
          <button className="btn btn-sm" onClick={() => setShowBatchCancel(true)}
            style={{ background:"#db2828", color:"#fff", fontWeight:600, border:"none", borderRadius:8 }}>
            <i className="fa fa-trash" style={{ marginRight:6 }} />
            Cancelar reservas
          </button>
          <button onClick={() => setSelected(new Set())}
            style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20, lineHeight:1, padding:"0 4px", marginLeft:4 }}>
            ×
          </button>
        </div>
      )}

      {/* ── Modal confirmación cancelación masiva ─────────────────────────────── */}
      {showBatchCancel && (
        <div className="modal" style={{
          display:"flex", position:"fixed", inset:0, zIndex:1080,
          background:"rgba(0,0,0,0.72)", alignItems:"center", justifyContent:"center",
        }} onClick={() => !batchCancelling && setShowBatchCancel(false)}>
          <div className="modal-dialog" style={{ maxWidth:400, width:"100%", margin:0 }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color:"#db2828" }}>
                  <i className="fa fa-trash" style={{ marginRight:8 }} />
                  Cancelar {selected.size} reserva{selected.size > 1 ? "s" : ""}
                </h5>
                <button className="close" onClick={() => setShowBatchCancel(false)} disabled={batchCancelling}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{
                  background:"rgba(219,40,40,0.08)", border:"1px solid rgba(219,40,40,0.3)",
                  borderRadius:6, padding:"10px 14px", marginBottom:12,
                  maxHeight:200, overflowY:"auto",
                }}>
                  {selectedReservations.map(r => (
                    <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0",
                      borderBottom:"1px solid rgba(219,40,40,0.1)", fontSize:13 }}>
                      <span style={{ fontWeight:700, color:"#800020" }}>
                        {r.space?.code || r.space_code || "—"}
                      </span>
                      <span style={{ color:"#7d8490" }}>
                        {fmtDate(r.start_time)}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:13, color:"#7d8490", marginBottom:0 }}>
                  Esta acción cancelará todas las reservas seleccionadas y liberará los espacios. ¿Confirmas?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger btn-sm" onClick={handleBatchCancel} disabled={batchCancelling}>
                  {batchCancelling
                    ? <><i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />Cancelando...</>
                    : <><i className="fa fa-trash" style={{ marginRight:6 }} />Sí, cancelar todas</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowBatchCancel(false)} disabled={batchCancelling}>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showNew      && <NewReservaModal  onClose={() => setShowNew(false)}      onDone={handleDone} />}
      {cancelTarget && <CancelModal      reservation={cancelTarget} onClose={() => setCancelTarget(null)} onDone={handleDone} />}
      {qrTarget     && <SendQRModal      reservation={qrTarget}     onClose={() => setQrTarget(null)} onSent={id => setSentQrIds(prev => new Set([...prev, id]))} />}
      {showBatch    && <SendBatchModal   reservations={selectedReservations} onClose={() => setShowBatch(false)} />}
    </>
  );
}
