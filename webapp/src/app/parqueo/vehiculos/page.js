"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ── Modal: Agregar vehículo ───────────────────────────────────────────────────
function AddVehicleModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    placa: "", brand: "", model: "", color: "", year: "",
    type: "STANDARD", owner_carnet: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.placa.trim()) { setError("La placa es obligatoria."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/vehicles", {
        ...form,
        placa: form.placa.trim().toUpperCase(),
        year:  form.year ? Number(form.year) : undefined,
        owner_carnet: form.owner_carnet.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Error al registrar el vehículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1050,
      background:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:480, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-car" style={{ marginRight:8 }} />Agregar vehículo
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Placa *</label>
                  <input className="form-control form-control-sm"
                    placeholder="P-001ABC"
                    value={form.placa}
                    onChange={e => set("placa", e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Tipo</label>
                  <select className="form-control form-control-sm"
                    value={form.type} onChange={e => set("type", e.target.value)}>
                    {["STANDARD","MOTORCYCLE","HANDICAPPED","ELECTRIC","VIP","TEACHER"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Marca</label>
                  <input className="form-control form-control-sm" placeholder="Toyota"
                    value={form.brand} onChange={e => set("brand", e.target.value)} />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Modelo</label>
                  <input className="form-control form-control-sm" placeholder="Corolla"
                    value={form.model} onChange={e => set("model", e.target.value)} />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Color</label>
                  <input className="form-control form-control-sm" placeholder="Blanco"
                    value={form.color} onChange={e => set("color", e.target.value)} />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>Año</label>
                  <input className="form-control form-control-sm" placeholder="2020" type="number"
                    value={form.year} onChange={e => set("year", e.target.value)} />
                </div>
              </div>
              <div className="col-12">
                <div className="form-group">
                  <label style={{ fontSize:13, fontWeight:600 }}>
                    Carnet del propietario <span style={{ color:"#7d8490", fontWeight:400 }}>(opcional)</span>
                  </label>
                  <input className="form-control form-control-sm" placeholder="202300001"
                    value={form.owner_carnet} onChange={e => set("owner_carnet", e.target.value)} />
                </div>
              </div>
            </div>
            {error && <p style={{ color:"#db2828", fontSize:12, marginTop:4 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
              {loading ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} /> : <i className="fa fa-plus" style={{ marginRight:6 }} />}
              Registrar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Blacklist ──────────────────────────────────────────────────────────
function BlacklistModal({ vehicle, onClose, onDone }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  if (!vehicle) return null;
  const isAdding = !vehicle.blacklisted;

  const submit = async () => {
    if (isAdding && !reason.trim()) { setError("El motivo es obligatorio."); return; }
    setLoading(true); setError("");
    try {
      if (isAdding) {
        await api.post(`/vehicles/${vehicle.id}/blacklist`, { reason: reason.trim() });
      } else {
        await api.delete(`/vehicles/${vehicle.id}/blacklist`);
      }
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Error al actualizar blacklist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1060,
      background:"rgba(0,0,0,0.7)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:400, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color: isAdding ? "#db2828" : "#21ba45" }}>
              <i className={`fa ${isAdding ? "fa-ban" : "fa-check-circle"}`} style={{ marginRight:8 }} />
              {isAdding ? "Agregar a blacklist" : "Remover de blacklist"}
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div style={{
              background: isAdding ? "rgba(219,40,40,0.08)" : "rgba(33,186,69,0.08)",
              border: `1px solid ${isAdding ? "rgba(219,40,40,0.3)" : "rgba(33,186,69,0.3)"}`,
              borderRadius:6, padding:"10px 14px", marginBottom:16,
            }}>
              <div style={{ fontWeight:800, fontSize:18, color:"#800020" }}>{vehicle.placa}</div>
              <div style={{ fontSize:12, color:"#7d8490" }}>
                {[vehicle.brand, vehicle.model, vehicle.color, vehicle.year].filter(Boolean).join(" · ")}
              </div>
            </div>
            {isAdding ? (
              <div className="form-group">
                <label style={{ fontSize:13, fontWeight:600 }}>Motivo *</label>
                <textarea className="form-control form-control-sm" rows={3}
                  placeholder="Describe el motivo para agregar este vehículo a la blacklist..."
                  value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            ) : (
              <p style={{ fontSize:13, color:"#7d8490" }}>
                ¿Confirmas que deseas <strong>remover</strong> este vehículo de la lista negra?
                Podrá acceder al campus nuevamente.
              </p>
            )}
            {error && <p style={{ color:"#db2828", fontSize:12 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button
              className={`btn btn-sm ${isAdding ? "btn-danger" : "btn-success"}`}
              onClick={submit} disabled={loading}>
              {loading
                ? <i className="fa fa-spinner fa-spin" style={{ marginRight:6 }} />
                : <i className={`fa ${isAdding ? "fa-ban" : "fa-check"}`} style={{ marginRight:6 }} />}
              {isAdding ? "Agregar a blacklist" : "Remover de blacklist"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Detalle del vehículo ───────────────────────────────────────────────
function DetailModal({ vehicle, onClose }) {
  if (!vehicle) return null;
  const rows = [
    ["Placa",       vehicle.placa],
    ["Tipo",        vehicle.type],
    ["Marca",       vehicle.brand || "—"],
    ["Modelo",      vehicle.model || "—"],
    ["Color",       vehicle.color || "—"],
    ["Año",         vehicle.year  || "—"],
    ["Propietario", vehicle.user ? `${vehicle.user.first_name} ${vehicle.user.last_name}` : "—"],
    ["Carnet",      vehicle.user?.carnet || "—"],
    ["Rol",         vehicle.user?.role   || "—"],
    ["Autorizado",  vehicle.is_authorized ? "Sí" : "No"],
    ["Blacklist",   vehicle.blacklisted   ? "Sí" : "No"],
    ["Registrado",  vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString("es-GT") : "—"],
  ];
  return (
    <div className="modal" style={{
      display:"flex", position:"fixed", inset:0, zIndex:1050,
      background:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth:420, width:"100%", margin:0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color:"#800020" }}>
              <i className="fa fa-car" style={{ marginRight:8 }} />
              {vehicle.placa}
              {vehicle.blacklisted && (
                <span className="badge badge-danger" style={{ marginLeft:8, fontSize:11 }}>
                  <i className="fa fa-ban" style={{ marginRight:4 }} />BLACKLIST
                </span>
              )}
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <table className="table table-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color:"#7d8490", width:130 }}>{k}</td>
                    <td><strong>{String(v)}</strong></td>
                  </tr>
                ))}
                {vehicle.blacklist_reason && (
                  <tr>
                    <td style={{ color:"#db2828" }}>Motivo BL</td>
                    <td style={{ color:"#db2828", fontSize:12 }}>{vehicle.blacklist_reason}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GestionVehiculos() {
  const [vehicles,  setVehicles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterRole,setFilterRole]= useState("ALL");
  const [filterAuth,setFilterAuth]= useState("ALL");
  const [filterBL,  setFilterBL]  = useState("ALL");
  const [showAdd,   setShowAdd]   = useState(false);
  const [blTarget,  setBlTarget]  = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [toggling,  setToggling]  = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/vehicles?limit=500");
      setVehicles(res.data.data?.vehicles || res.data.data || []);
    } catch (e) {
      console.error("Error cargando vehículos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { setShowAdd(false); setBlTarget(null); load(); };

  const toggleAuth = async (v) => {
    setToggling(v.id);
    try {
      await api.patch(`/vehicles/${v.id}`, { is_authorized: !v.is_authorized });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  // Filtrado
  const filtered = vehicles.filter(v => {
    if (filterRole !== "ALL" && v.user?.role !== filterRole) return false;
    if (filterAuth === "YES" && !v.is_authorized) return false;
    if (filterAuth === "NO"  &&  v.is_authorized) return false;
    if (filterBL   === "YES" && !v.blacklisted)   return false;
    if (filterBL   === "NO"  &&  v.blacklisted)   return false;
    if (search) {
      const q = search.toUpperCase();
      const plate = (v.placa || "").toUpperCase();
      const name  = `${v.user?.first_name || ""} ${v.user?.last_name || ""}`.toUpperCase();
      const car   = `${v.brand || ""} ${v.model || ""}`.toUpperCase();
      if (!plate.includes(q) && !name.includes(q) && !car.includes(q)) return false;
    }
    return true;
  });

  const blCount   = vehicles.filter(v => v.blacklisted).length;
  const authCount = vehicles.filter(v => v.is_authorized).length;

  if (loading) return (
    <div className="text-center" style={{ padding:"3rem" }}>
      <i className="fa fa-spinner fa-spin fa-2x" style={{ color:"#800020" }} />
      <p style={{ color:"#7d8490", marginTop:"1rem" }}>Cargando vehículos...</p>
    </div>
  );

  return (
    <>
      {/* ── Stat strip ────────────────────────────────────────────────────────── */}
      <div className="row clearfix" style={{ marginBottom:"0.5rem" }}>
        {[
          { label:"Total registrados", value:vehicles.length,  color:"#800020", icon:"fa-car" },
          { label:"Autorizados",       value:authCount,         color:"#21ba45", icon:"fa-check-circle" },
          { label:"No autorizados",    value:vehicles.length - authCount, color:"#fbbd08", icon:"fa-clock-o" },
          { label:"En blacklist",      value:blCount,           color:"#db2828", icon:"fa-ban" },
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

      {/* ── Filtros + acciones ─────────────────────────────────────────────────── */}
      <div className="row clearfix">
        <div className="col-12">
          <div className="card" style={{ marginBottom:"1rem" }}>
            <div className="card-body" style={{ padding:"0.85rem 1.25rem" }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                <div className="input-group" style={{ maxWidth:240 }}>
                  <div className="input-group-prepend">
                    <span className="input-group-text"><i className="fa fa-search" /></span>
                  </div>
                  <input className="form-control form-control-sm"
                    placeholder="Placa, nombre o modelo..."
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="ALL">Todos los roles</option>
                  <option value="STUDENT">Estudiante</option>
                  <option value="TEACHER">Docente</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SECURITY">Seguridad</option>
                </select>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterAuth} onChange={e => setFilterAuth(e.target.value)}>
                  <option value="ALL">Autorización: todos</option>
                  <option value="YES">Autorizados</option>
                  <option value="NO">No autorizados</option>
                </select>

                <select className="form-control form-control-sm" style={{ maxWidth:140 }}
                  value={filterBL} onChange={e => setFilterBL(e.target.value)}>
                  <option value="ALL">Blacklist: todos</option>
                  <option value="YES">En blacklist</option>
                  <option value="NO">Sin blacklist</option>
                </select>

                <button className="btn btn-primary btn-sm" style={{ marginLeft:"auto" }}
                  onClick={() => setShowAdd(true)}>
                  <i className="fa fa-plus" style={{ marginRight:6 }} />
                  Agregar vehículo
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
                <i className="fa fa-car" style={{ marginRight:6 }} />
                Vehículos registrados
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
                      <th>Placa</th>
                      <th>Propietario</th>
                      <th>Rol</th>
                      <th>Vehículo</th>
                      <th>Tipo</th>
                      <th style={{ textAlign:"center" }}>Autorizado</th>
                      <th style={{ textAlign:"center" }}>Blacklist</th>
                      <th style={{ textAlign:"center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center" style={{ padding:"2.5rem", color:"#7d8490" }}>
                          <i className="fa fa-car fa-2x" style={{ display:"block", marginBottom:8, color:"#343a40" }} />
                          Sin vehículos que coincidan
                        </td>
                      </tr>
                    ) : (
                      filtered.map(v => (
                        <tr key={v.id} style={ v.blacklisted ? { background:"rgba(219,40,40,0.04)" } : {} }>
                          <td>
                            <strong style={{ color:"#800020", fontSize:14 }}>{v.placa}</strong>
                            {v.blacklisted && (
                              <span className="badge badge-danger" style={{ marginLeft:6, fontSize:10 }}>
                                <i className="fa fa-ban" style={{ marginRight:3 }} />BL
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize:13 }}>
                            {v.user
                              ? `${v.user.first_name} ${v.user.last_name}`
                              : <span style={{ color:"#7d8490" }}>Sin propietario</span>}
                          </td>
                          <td>
                            {v.user?.role ? (
                              <span className={`badge ${
                                v.user.role === "ADMIN"    ? "badge-danger"  :
                                v.user.role === "TEACHER"  ? "badge-primary" :
                                v.user.role === "SECURITY" ? "badge-warning" : "badge-default"
                              }`}>{v.user.role}</span>
                            ) : "—"}
                          </td>
                          <td style={{ fontSize:12 }}>
                            {[v.brand, v.model, v.color, v.year].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td>
                            <span className="badge badge-default" style={{ fontSize:11 }}>{v.type}</span>
                          </td>
                          <td style={{ textAlign:"center" }}>
                            {v.is_authorized
                              ? <span className="badge badge-success"><i className="fa fa-check" /> Sí</span>
                              : <span className="badge badge-secondary"><i className="fa fa-times" /> No</span>}
                          </td>
                          <td style={{ textAlign:"center" }}>
                            {v.blacklisted
                              ? <span className="badge badge-danger"><i className="fa fa-ban" /> Sí</span>
                              : <span className="badge badge-default"><i className="fa fa-minus" /> No</span>}
                          </td>
                          <td style={{ textAlign:"center", whiteSpace:"nowrap" }}>
                            {/* Ver detalle */}
                            <button className="btn btn-info btn-sm" style={{ marginRight:3 }}
                              title="Ver detalle" onClick={() => setDetail(v)}>
                              <i className="fa fa-eye" />
                            </button>
                            {/* Autorizar / desautorizar */}
                            <button
                              className={`btn btn-sm ${v.is_authorized ? "btn-warning" : "btn-success"}`}
                              style={{ marginRight:3 }}
                              title={v.is_authorized ? "Desautorizar" : "Autorizar"}
                              disabled={toggling === v.id}
                              onClick={() => toggleAuth(v)}>
                              {toggling === v.id
                                ? <i className="fa fa-spinner fa-spin" />
                                : <i className={`fa ${v.is_authorized ? "fa-ban" : "fa-check"}`} />}
                            </button>
                            {/* Blacklist */}
                            <button
                              className={`btn btn-sm ${v.blacklisted ? "btn-success" : "btn-danger"}`}
                              title={v.blacklisted ? "Remover de blacklist" : "Agregar a blacklist"}
                              onClick={() => setBlTarget(v)}>
                              <i className={`fa ${v.blacklisted ? "fa-check-circle" : "fa-ban"}`} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {filtered.length > 0 && (
              <div className="card-footer" style={{ fontSize:12, color:"#7d8490", padding:"0.65rem 1.25rem" }}>
                Mostrando {filtered.length} de {vehicles.length} vehículos ·
                {blCount > 0 && (
                  <span style={{ color:"#db2828", marginLeft:8 }}>
                    <i className="fa fa-ban" style={{ marginRight:4 }} />
                    {blCount} en blacklist
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showAdd  && <AddVehicleModal onClose={() => setShowAdd(false)} onDone={handleDone} />}
      {blTarget && <BlacklistModal  vehicle={blTarget} onClose={() => setBlTarget(null)} onDone={handleDone} />}
      {detail   && <DetailModal     vehicle={detail}   onClose={() => setDetail(null)} />}
    </>
  );
}
