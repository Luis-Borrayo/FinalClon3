"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleString("es-GT", {
    day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit",
  }) : "—";

const SEVERITY = {
  HIGH:   { cls:"badge-danger",   color:"#db2828", label:"Alto"  },
  MEDIUM: { cls:"badge-warning",  color:"#fbbd08", label:"Medio" },
  LOW:    { cls:"badge-secondary",color:"#7d8490", label:"Bajo"  },
  CRITICAL:{ cls:"badge-danger",  color:"#db2828", label:"Crítico"},
  INFO:   { cls:"badge-info",     color:"#17a2b8", label:"Info"  },
};

function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.LOW;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ── Modal: remover de blacklist ───────────────────────────────────────────────
function RemoveBlacklistModal({ vehicle, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  if (!vehicle) return null;

  const confirm = async () => {
    setLoading(true); setError("");
    try {
      await api.delete(`/vehicles/${vehicle.id}/blacklist`);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Error al remover de blacklist.");
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
            <h5 className="modal-title" style={{ color:"#21ba45" }}>
              <i className="fa fa-check-circle" style={{ marginRight:8 }} />
              Remover de blacklist
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div style={{
              background:"rgba(33,186,69,0.08)", border:"1px solid rgba(33,186,69,0.3)",
              borderRadius:6, padding:"12px 14px", marginBottom:12,
            }}>
              <div style={{ fontWeight:800, fontSize:18, color:"#800020" }}>{vehicle.placa}</div>
              <div style={{ fontSize:12, color:"#7d8490" }}>
                {[vehicle.brand, vehicle.model, vehicle.color].filter(Boolean).join(" · ") || "Sin datos adicionales"}
              </div>
              {vehicle.blacklist_reason && (
                <div style={{ marginTop:8, fontSize:12, color:"#db2828" }}>
                  <i className="fa fa-ban" style={{ marginRight:4 }} />
                  Motivo: {vehicle.blacklist_reason}
                </div>
              )}
            </div>
            <p style={{ fontSize:13, color:"#7d8490", marginBottom:0 }}>
              Al remover este vehículo de la lista negra, podrá acceder al campus nuevamente.
              Esta acción queda registrada en el log de auditoría.
            </p>
            {error && <p style={{ color:"#db2828", fontSize:12, marginTop:8 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-success btn-sm" onClick={confirm} disabled={loading}>
              {loading
                ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                : <i className="fa fa-check" style={{ marginRight:6 }} />}
              Confirmar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Seguridad() {
  // Logs
  const [logs,        setLogs]        = useState([]);
  const [logsTotal,   setLogsTotal]   = useState(0);
  const [logsPage,    setLogsPage]    = useState(1);
  const [filterSev,   setFilterSev]   = useState("ALL");
  const [filterType,  setFilterType]  = useState("ALL");
  const [logSearch,   setLogSearch]   = useState("");

  // Blacklist
  const [blacklist,   setBlacklist]   = useState([]);
  const [blTarget,    setBlTarget]    = useState(null);

  // Intentos fallidos
  const [failed,      setFailed]      = useState([]);

  // Alertas activas
  const [alerts,      setAlerts]      = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("logs");

  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, blRes, failRes, alertRes] = await Promise.allSettled([
        api.get(`/security/audit-logs?page=${logsPage}&limit=${PER_PAGE}&severity=${filterSev !== "ALL" ? filterSev : ""}&type=${filterType !== "ALL" ? filterType : ""}&q=${logSearch}`),
        api.get("/vehicles?blacklisted=true&limit=200"),
        api.get("/security/failed-attempts?limit=50"),
        api.get("/dashboard/alerts"),
      ]);

      if (logsRes.status === "fulfilled") {
        const d = logsRes.value.data.data;
        setLogs(d?.logs || d || []);
        setLogsTotal(d?.total || 0);
      } else {
        setLogs(buildDemoLogs());
        setLogsTotal(120);
      }

      if (blRes.status === "fulfilled") {
        const d = blRes.value.data.data;
        setBlacklist((d?.vehicles || d || []).filter(v => v.blacklisted));
      }

      if (failRes.status === "fulfilled") {
        setFailed(failRes.value.data.data?.attempts || failRes.value.data.data || []);
      } else {
        setFailed(buildDemoFailed());
      }

      if (alertRes.status === "fulfilled") {
        setAlerts(alertRes.value.data.data?.alerts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [logsPage, filterSev, filterType, logSearch]);

  useEffect(() => { load(); }, [load]);

  const handleBlDone = () => { setBlTarget(null); load(); };

  const totalPages = Math.ceil(logsTotal / PER_PAGE);

  // Conteos para stats
  const criticalCount = alerts.filter(a => a.severity === "CRITICAL" || a.severity === "HIGH").length;
  const blCount       = blacklist.length;
  const failCount     = failed.length;

  return (
    <>
      {/* ── Alertas activas (siempre visibles) ────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="row clearfix">
          <div className="col-12">
            <div className="card" style={{ borderLeft:"4px solid #db2828", marginBottom:"1rem" }}>
              <div className="card-header" style={{ background:"rgba(219,40,40,0.08)" }}>
                <h3 className="card-title" style={{ color:"#db2828" }}>
                  <i className="fa fa-exclamation-circle" style={{ marginRight:6 }} />
                  Alertas de seguridad activas
                  <span className="badge badge-danger" style={{ marginLeft:8 }}>{alerts.length}</span>
                </h3>
              </div>
              <div className="card-body" style={{ padding:"1rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {alerts.map((a, i) => {
                    const sv = SEVERITY[a.severity] || SEVERITY.LOW;
                    return (
                      <div key={i} style={{
                        display:"flex", alignItems:"flex-start", gap:10,
                        padding:"10px 12px",
                        borderLeft:`3px solid ${sv.color}`,
                        background:`${sv.color}12`,
                        borderRadius:"0 6px 6px 0",
                      }}>
                        <i className="fa fa-bell" style={{ color:sv.color, marginTop:2 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:sv.color }}>
                            {(a.type || "ALERTA").replace(/_/g," ")}
                          </div>
                          <div style={{ fontSize:12, color:"#7d8490" }}>{a.message}</div>
                        </div>
                        <SeverityBadge severity={a.severity} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="row clearfix" style={{ marginBottom:"0.5rem" }}>
        {[
          { label:"Alertas críticas",    value:criticalCount, color:"#db2828", icon:"fa-exclamation-circle" },
          { label:"En blacklist",        value:blCount,       color:"#800020", icon:"fa-ban"                },
          { label:"Intentos fallidos",   value:failCount,     color:"#fbbd08", icon:"fa-times-circle"       },
          { label:"Eventos en log",      value:logsTotal,     color:"#7d8490", icon:"fa-list-alt"           },
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

      {/* ── Tabs internos ─────────────────────────────────────────────────────── */}
      <div className="row clearfix">
        <div className="col-12">
          <ul className="nav nav-tabs" style={{ borderBottom:"2px solid rgba(255,255,255,0.08)", marginBottom:"1rem" }}>
            {[
              { id:"logs",     label:"Log de auditoría",    icon:"fa-list-alt"    },
              { id:"blacklist",label:"Blacklist",            icon:"fa-ban"         },
              { id:"failed",   label:"Intentos fallidos",   icon:"fa-times-circle"},
            ].map(t => (
              <li className="nav-item" key={t.id}>
                <button
                  className={`nav-link${activeTab === t.id ? " active" : ""}`}
                  style={{
                    color: activeTab === t.id ? "#800020" : "#7d8490",
                    borderBottom: activeTab === t.id ? "2px solid #800020" : "2px solid transparent",
                    background:"transparent", border:"none",
                    fontWeight: activeTab === t.id ? 600 : 400,
                    padding:"8px 16px", fontSize:13, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:6,
                  }}
                  onClick={() => setActiveTab(t.id)}>
                  <i className={`fa ${t.icon}`} />
                  {t.label}
                  {t.id === "blacklist" && blCount > 0 && (
                    <span className="badge badge-danger" style={{ marginLeft:4, fontSize:10 }}>{blCount}</span>
                  )}
                  {t.id === "failed" && failCount > 0 && (
                    <span className="badge badge-warning" style={{ marginLeft:4, fontSize:10 }}>{failCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ══ TAB: Log de auditoría ════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="row clearfix">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  <h3 className="card-title" style={{ marginBottom:0 }}>
                    <i className="fa fa-list-alt" style={{ marginRight:6 }} />
                    Registro de eventos
                  </h3>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div className="input-group" style={{ maxWidth:200 }}>
                      <div className="input-group-prepend">
                        <span className="input-group-text"><i className="fa fa-search" /></span>
                      </div>
                      <input className="form-control form-control-sm"
                        placeholder="Buscar..."
                        value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogsPage(1); }} />
                    </div>
                    <select className="form-control form-control-sm" style={{ maxWidth:120 }}
                      value={filterSev} onChange={e => { setFilterSev(e.target.value); setLogsPage(1); }}>
                      <option value="ALL">Severidad</option>
                      <option value="CRITICAL">Crítico</option>
                      <option value="HIGH">Alto</option>
                      <option value="MEDIUM">Medio</option>
                      <option value="LOW">Bajo</option>
                      <option value="INFO">Info</option>
                    </select>
                    <select className="form-control form-control-sm" style={{ maxWidth:150 }}
                      value={filterType} onChange={e => { setFilterType(e.target.value); setLogsPage(1); }}>
                      <option value="ALL">Tipo de evento</option>
                      <option value="ACCESS_DENIED">Acceso denegado</option>
                      <option value="BLACKLIST_ATTEMPT">Intento blacklist</option>
                      <option value="FORCED_ENTRY">Entrada forzada</option>
                      <option value="OVERSTAY">Tiempo excedido</option>
                      <option value="PAYMENT_FAILED">Pago fallido</option>
                      <option value="MANUAL_OVERRIDE">Override manual</option>
                    </select>
                    <button className="btn btn-default btn-sm" onClick={load}>
                      <i className="fa fa-refresh" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding:0 }}>
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead>
                      <tr style={{ background:"rgba(128,0,32,0.08)" }}>
                        <th>Fecha / Hora</th>
                        <th>Tipo de evento</th>
                        <th>Placa</th>
                        <th>Espacio</th>
                        <th>Descripción</th>
                        <th>Operador</th>
                        <th style={{ textAlign:"center" }}>Severidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center" style={{ padding:"2rem" }}>
                            <i className="fa fa-spinner fa-spin" style={{ color:"#800020" }} />
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                            <i className="fa fa-list-alt fa-2x" style={{ display:"block", marginBottom:8, color:"#343a40" }} />
                            Sin eventos registrados
                          </td>
                        </tr>
                      ) : (
                        logs.map((log, i) => {
                          const sv = SEVERITY[log.severity] || SEVERITY.LOW;
                          return (
                            <tr key={log.id || i} style={
                              log.severity === "CRITICAL" || log.severity === "HIGH"
                                ? { background:"rgba(219,40,40,0.04)" } : {}
                            }>
                              <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{fmt(log.created_at || log.timestamp)}</td>
                              <td>
                                <span style={{ fontSize:12, fontWeight:600, color:sv.color }}>
                                  {(log.event_type || log.type || "—").replace(/_/g," ")}
                                </span>
                              </td>
                              <td>
                                {log.vehicle?.placa || log.placa
                                  ? <strong style={{ color:"#800020" }}>{log.vehicle?.placa || log.placa}</strong>
                                  : <span style={{ color:"#7d8490" }}>—</span>}
                              </td>
                              <td style={{ fontSize:12 }}>
                                {log.space?.code || log.space_code
                                  ? <span className="badge badge-default">{log.space?.code || log.space_code}</span>
                                  : "—"}
                              </td>
                              <td style={{ fontSize:12, color:"#7d8490", maxWidth:280 }}>
                                <span title={log.description || log.message}>
                                  {(log.description || log.message || "—").slice(0,80)}
                                  {(log.description || log.message || "").length > 80 ? "…" : ""}
                                </span>
                              </td>
                              <td style={{ fontSize:12 }}>
                                {log.operator?.name || log.operator || "Sistema"}
                              </td>
                              <td style={{ textAlign:"center" }}>
                                <SeverityBadge severity={log.severity} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="card-footer" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.65rem 1.25rem" }}>
                  <span style={{ fontSize:12, color:"#7d8490" }}>
                    Página {logsPage} de {totalPages} · {logsTotal} eventos
                  </span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="btn btn-default btn-sm"
                      disabled={logsPage === 1}
                      onClick={() => setLogsPage(1)}>
                      <i className="fa fa-angle-double-left" />
                    </button>
                    <button className="btn btn-default btn-sm"
                      disabled={logsPage === 1}
                      onClick={() => setLogsPage(p => p - 1)}>
                      <i className="fa fa-angle-left" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(logsPage - 2, totalPages - 4));
                      const p = start + i;
                      return (
                        <button key={p}
                          className={`btn btn-sm ${p === logsPage ? "btn-primary" : "btn-default"}`}
                          onClick={() => setLogsPage(p)}>{p}</button>
                      );
                    })}
                    <button className="btn btn-default btn-sm"
                      disabled={logsPage === totalPages}
                      onClick={() => setLogsPage(p => p + 1)}>
                      <i className="fa fa-angle-right" />
                    </button>
                    <button className="btn btn-default btn-sm"
                      disabled={logsPage === totalPages}
                      onClick={() => setLogsPage(totalPages)}>
                      <i className="fa fa-angle-double-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Blacklist ═══════════════════════════════════════════════════════ */}
      {activeTab === "blacklist" && (
        <div className="row clearfix">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color:"#db2828" }}>
                  <i className="fa fa-ban" style={{ marginRight:6 }} />
                  Vehículos en lista negra
                  <span className="badge badge-danger" style={{ marginLeft:8 }}>{blacklist.length}</span>
                </h3>
              </div>
              <div className="card-body" style={{ padding:0 }}>
                <table className="table table-hover table-striped mb-0">
                  <thead>
                    <tr style={{ background:"rgba(219,40,40,0.10)" }}>
                      <th>Placa</th>
                      <th>Propietario</th>
                      <th>Vehículo</th>
                      <th>Motivo</th>
                      <th>Fecha BL</th>
                      <th style={{ textAlign:"center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklist.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                          <i className="fa fa-check-circle fa-2x" style={{ display:"block", marginBottom:8, color:"#21ba45" }} />
                          Sin vehículos en blacklist
                        </td>
                      </tr>
                    ) : (
                      blacklist.map(v => (
                        <tr key={v.id} style={{ background:"rgba(219,40,40,0.04)" }}>
                          <td>
                            <strong style={{ color:"#db2828", fontSize:15 }}>{v.placa}</strong>
                            <span className="badge badge-danger" style={{ marginLeft:6, fontSize:10 }}>
                              <i className="fa fa-ban" style={{ marginRight:3 }} />BL
                            </span>
                          </td>
                          <td style={{ fontSize:13 }}>
                            {v.user ? `${v.user.first_name} ${v.user.last_name}` : "—"}
                            {v.user?.carnet && <div style={{ fontSize:11, color:"#7d8490" }}>{v.user.carnet}</div>}
                          </td>
                          <td style={{ fontSize:12 }}>
                            {[v.brand, v.model, v.color, v.year].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td style={{ fontSize:12, color:"#db2828", maxWidth:220 }}>
                            <span title={v.blacklist_reason}>{(v.blacklist_reason || "Sin motivo registrado").slice(0, 60)}{(v.blacklist_reason||"").length > 60 ? "…" : ""}</span>
                          </td>
                          <td style={{ fontSize:12 }}>{fmt(v.blacklisted_at)}</td>
                          <td style={{ textAlign:"center" }}>
                            <button className="btn btn-success btn-sm"
                              title="Remover de blacklist"
                              onClick={() => setBlTarget(v)}>
                              <i className="fa fa-check" style={{ marginRight:4 }} />
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Intentos fallidos ═══════════════════════════════════════════════ */}
      {activeTab === "failed" && (
        <div className="row clearfix">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color:"#fbbd08" }}>
                  <i className="fa fa-times-circle" style={{ marginRight:6 }} />
                  Intentos de acceso fallidos recientes
                </h3>
              </div>
              <div className="card-body" style={{ padding:0 }}>
                <table className="table table-hover table-striped mb-0">
                  <thead>
                    <tr style={{ background:"rgba(251,189,8,0.08)" }}>
                      <th>Fecha / Hora</th>
                      <th>Placa / Código</th>
                      <th>Motivo de rechazo</th>
                      <th>Método</th>
                      <th>Punto de acceso</th>
                      <th style={{ textAlign:"center" }}>Severidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                          <i className="fa fa-check-circle fa-2x" style={{ display:"block", marginBottom:8, color:"#21ba45" }} />
                          Sin intentos fallidos recientes
                        </td>
                      </tr>
                    ) : (
                      failed.map((f, i) => (
                        <tr key={f.id || i} style={
                          f.reason === "BLACKLISTED" ? { background:"rgba(219,40,40,0.06)" } : {}
                        }>
                          <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{fmt(f.timestamp || f.created_at)}</td>
                          <td>
                            <strong style={{ color: f.reason === "BLACKLISTED" ? "#db2828" : "#800020" }}>
                              {f.placa || f.code || "—"}
                            </strong>
                            {f.reason === "BLACKLISTED" && (
                              <span className="badge badge-danger" style={{ marginLeft:6, fontSize:10 }}>BL</span>
                            )}
                          </td>
                          <td style={{ fontSize:12 }}>
                            <span style={{
                              color: f.reason === "BLACKLISTED" ? "#db2828" :
                                     f.reason === "UNAUTHORIZED" ? "#fbbd08" : "#7d8490",
                              fontWeight: f.reason === "BLACKLISTED" ? 700 : 400,
                            }}>
                              {(f.reason || f.reject_reason || "—").replace(/_/g," ")}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-default">{f.method || "—"}</span>
                          </td>
                          <td style={{ fontSize:12 }}>{f.access_point || f.gate || "—"}</td>
                          <td style={{ textAlign:"center" }}>
                            <SeverityBadge severity={
                              f.reason === "BLACKLISTED" ? "HIGH" :
                              f.reason === "UNAUTHORIZED" ? "MEDIUM" : "LOW"
                            } />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {failed.length > 0 && (
                <div className="card-footer" style={{ fontSize:12, color:"#7d8490", padding:"0.65rem 1.25rem" }}>
                  {failed.length} intentos fallidos ·
                  <span style={{ color:"#db2828", marginLeft:6 }}>
                    {failed.filter(f => f.reason === "BLACKLISTED").length} de vehículos en blacklist
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal remover blacklist ────────────────────────────────────────────── */}
      {blTarget && (
        <RemoveBlacklistModal
          vehicle={blTarget}
          onClose={() => setBlTarget(null)}
          onDone={handleBlDone}
        />
      )}
    </>
  );
}

// ── Datos demo ────────────────────────────────────────────────────────────────
function buildDemoLogs() {
  const types = ["ACCESS_DENIED","BLACKLIST_ATTEMPT","OVERSTAY","MANUAL_OVERRIDE","PAYMENT_FAILED","FORCED_ENTRY"];
  const sevs  = ["HIGH","MEDIUM","LOW","CRITICAL","INFO"];
  const placas= ["P-001ABC","P-123XYZ","P-456DEF","O-789GHI","P-321JKL"];
  return Array.from({ length:20 }, (_, i) => ({
    id: i,
    created_at: new Date(Date.now() - i * 1800000).toISOString(),
    event_type: types[i % types.length],
    severity:   sevs[i % sevs.length],
    placa:      placas[i % placas.length],
    space_code: `A-${String(i+1).padStart(3,"0")}`,
    description:`Evento de seguridad registrado automáticamente por el sistema de control de acceso.`,
    operator:   i % 3 === 0 ? "Admin" : "Sistema",
  }));
}

function buildDemoFailed() {
  const reasons = ["BLACKLISTED","UNAUTHORIZED","INVALID_QR","EXPIRED_PASS","NOT_REGISTERED"];
  const placas  = ["P-999ZZZ","P-777AAA","P-555BBB","P-333CCC","P-111DDD"];
  return Array.from({ length:12 }, (_, i) => ({
    id: i,
    timestamp:  new Date(Date.now() - i * 900000).toISOString(),
    placa:      placas[i % placas.length],
    reason:     reasons[i % reasons.length],
    method:     ["QR","RFID","MANUAL"][i % 3],
    access_point: `Caseta ${(i % 3) + 1}`,
  }));
}
