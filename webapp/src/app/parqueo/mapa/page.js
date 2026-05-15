"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ── Colores por estado (usando colores de la plantilla) ───────────────────────
const STATUS_COLOR = {
  AVAILABLE:   { fill: "#21ba45", stroke: "#1a9438", label: "Disponible" },
  OCCUPIED:    { fill: "#db2828", stroke: "#b52020", label: "Ocupado"    },
  RESERVED:    { fill: "#fbbd08", stroke: "#d4a007", label: "Reservado"  },
  MAINTENANCE: { fill: "#7d8490", stroke: "#5a5f66", label: "Mantenim."  },
};

const TYPE_OVERRIDE = {
  HANDICAPPED: { fill: "#17a2b8", stroke: "#138496", label: "Discapacidad" },
  ELECTRIC:    { fill: "#6435c9", stroke: "#4d28a0", label: "Eléctrico"   },
  VIP:         { fill: "#800020", stroke: "#5a0016", label: "VIP"         },
  TEACHER:     { fill: "#800020", stroke: "#5a0016", label: "Docente"     },
};

// ── Zona SVG: grilla de espacios ──────────────────────────────────────────────
function ZoneGrid({ zone, spaces, onSpaceClick, W = 380, H = 300 }) {
  const COLS = 10;
  const PAD  = 28;
  const GAP  = 3;
  const cellW = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
  const rows  = Math.ceil(spaces.length / COLS);
  const cellH = Math.min(cellW * 0.7, (H - PAD * 2 - GAP * (rows - 1)) / rows);

  return (
    <g>
      {/* Fondo de zona */}
      <rect x={0} y={0} width={W} height={H}
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"
        strokeWidth={1.5} rx={8} />

      {/* Etiqueta de zona */}
      <text x={W / 2} y={16} textAnchor="middle"
        fill="#800020" fontSize={13} fontWeight={700}>
        ZONA {zone}
      </text>

      {/* Pasillo central horizontal */}
      <rect x={PAD} y={H / 2 - 6} width={W - PAD * 2} height={12}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)"
        strokeWidth={1} rx={2} />
      <text x={W / 2} y={H / 2 + 4} textAnchor="middle"
        fill="rgba(255,255,255,0.2)" fontSize={8}>▶ pasillo ▶</text>

      {/* Espacios */}
      {spaces.map((sp, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const half = Math.floor(rows / 2);
        // Partir en dos bloques con pasillo en medio
        const rowOffset = row >= half ? row + 1 : row;
        const x = PAD + col * (cellW + GAP);
        const y = PAD + rowOffset * (cellH + GAP);

        const c = (sp.status !== "AVAILABLE" && TYPE_OVERRIDE[sp.type])
          ? TYPE_OVERRIDE[sp.type]
          : STATUS_COLOR[sp.status] || STATUS_COLOR.AVAILABLE;

        return (
          <g key={sp.id}
            onClick={() => onSpaceClick(sp)}
            style={{ cursor: "pointer" }}>
            <rect x={x} y={y} width={cellW} height={cellH}
              fill={c.fill} stroke={c.stroke} strokeWidth={1} rx={2}
              opacity={0.85}
            />
            <text x={x + cellW / 2} y={y + cellH / 2 + 3}
              textAnchor="middle" fill="#fff" fontSize={6.5} fontWeight={600}>
              {sp.code.split("-")[1]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── Modal de detalle de espacio ───────────────────────────────────────────────
function SpaceModal({ space, onClose, onAssign }) {
  if (!space) return null;
  const session = space._session;
  const isOccupied = space.status === "OCCUPIED";

  const dur = session
    ? Math.floor((Date.now() - new Date(session.entry_time).getTime()) / 60000)
    : 0;
  const monto = session
    ? ((dur / 60) * 5).toFixed(2)
    : "0.00";

  return (
    <div className="modal" style={{
      display: "flex", position: "fixed", inset: 0, zIndex: 1050,
      background: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 440, width: "100%", margin: 0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h5 className="modal-title" style={{ color: "#800020" }}>
              <i className="fa fa-map-marker" style={{ marginRight: 8 }} />
              Espacio {space.code} — Zona {space.zone}
            </h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {/* Estado y tipo */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span className={`badge ${
                space.status === "AVAILABLE" ? "badge-success" :
                space.status === "OCCUPIED"  ? "badge-danger"  :
                space.status === "RESERVED"  ? "badge-warning" : "badge-secondary"
              }`}>{STATUS_COLOR[space.status]?.label || space.status}</span>
              <span className="badge badge-default">{space.type}</span>
              {space.floor !== undefined && (
                <span className="badge badge-info">Nivel {space.floor}</span>
              )}
            </div>

            {isOccupied && session ? (
              <table className="table table-sm">
                <tbody>
                  <tr><td style={{ color: "#7d8490", width: 140 }}>Placa</td>
                    <td><strong style={{ color: "#800020" }}>{session.vehicle?.placa || "—"}</strong></td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Propietario</td>
                    <td>{session.user ? `${session.user.first_name} ${session.user.last_name}` : "—"}</td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Vehículo</td>
                    <td>{[session.vehicle?.brand, session.vehicle?.model, session.vehicle?.color].filter(Boolean).join(" ") || "—"}</td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Hora entrada</td>
                    <td>{session.entry_time ? new Date(session.entry_time).toLocaleTimeString("es-GT") : "—"}</td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Tiempo</td>
                    <td><strong>{dur < 60 ? `${dur}m` : `${Math.floor(dur / 60)}h ${dur % 60}m`}</strong></td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Monto acumulado</td>
                    <td><strong style={{ color: "#21ba45" }}>Q {monto}</strong></td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Método entrada</td>
                    <td><span className="badge badge-info">{session.entry_method || "MANUAL"}</span></td></tr>
                  <tr><td style={{ color: "#7d8490" }}>Pago</td>
                    <td><span className={`badge ${session.is_paid ? "badge-success" : "badge-warning"}`}>
                      {session.is_paid ? "Pagado" : "Pendiente"}
                    </span></td></tr>
                </tbody>
              </table>
            ) : !isOccupied ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <i className="fa fa-check-circle fa-3x" style={{ color: "#21ba45", display: "block", marginBottom: 12 }} />
                <p style={{ color: "#7d8490", marginBottom: 0 }}>Espacio disponible para asignación</p>
              </div>
            ) : (
              <p style={{ color: "#7d8490" }}>Sin datos de sesión activa.</p>
            )}
          </div>
          <div className="modal-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {!isOccupied && (
              <button className="btn btn-success btn-sm" onClick={() => onAssign(space)}>
                <i className="fa fa-plus" style={{ marginRight: 6 }} />
                Asignar manualmente
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal asignación manual ────────────────────────────────────────────────────
function AssignModal({ space, onClose, onSubmit }) {
  const [plate, setPlate]   = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [found, setFound]   = useState(null);

  const searchVehicle = async () => {
    if (!plate.trim()) return;
    try {
      const res = await api.get(`/vehicles/search?plate=${plate.toUpperCase()}`);
      const v = res.data.data;
      setFound(v);
      setVehicleId(v.id);
      setMsg("");
    } catch {
      setFound(null);
      setVehicleId("");
      setMsg("Vehículo no encontrado.");
    }
  };

  const submit = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      await api.post("/parking-sessions/entry", {
        vehicle_id: vehicleId,
        space_id: space.id,
        entry_method: "MANUAL",
      });
      onSubmit();
    } catch (e) {
      setMsg(e.response?.data?.message || "Error al registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{
      display: "flex", position: "fixed", inset: 0, zIndex: 1060,
      background: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 400, width: "100%", margin: 0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color: "#800020" }}>
              Asignar espacio {space.code}
            </h5>
            <button className="close" onClick={onClose}><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Buscar por placa</label>
              <div className="input-group">
                <input className="form-control form-control-sm"
                  placeholder="Ej: P-001ABC"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && searchVehicle()}
                />
                <div className="input-group-append">
                  <button className="btn btn-primary btn-sm" onClick={searchVehicle}>
                    <i className="fa fa-search" />
                  </button>
                </div>
              </div>
            </div>

            {found && (
              <div style={{
                background: "rgba(33,186,69,0.1)", border: "1px solid #21ba45",
                borderRadius: 6, padding: "10px 12px", marginTop: 8,
              }}>
                <div style={{ fontWeight: 700, color: "#800020" }}>{found.placa}</div>
                <div style={{ fontSize: 12, color: "#7d8490" }}>
                  {[found.brand, found.model, found.color, found.year].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Propietario:{" "}
                  <strong>{found.user ? `${found.user.first_name} ${found.user.last_name}` : "—"}</strong>
                </div>
                {found.blacklisted && (
                  <div style={{ color: "#db2828", fontWeight: 700, marginTop: 4, fontSize: 12 }}>
                    <i className="fa fa-ban" style={{ marginRight: 4 }} /> EN LISTA NEGRA
                  </div>
                )}
              </div>
            )}
            {msg && <p style={{ color: "#db2828", fontSize: 12, marginTop: 8 }}>{msg}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-success btn-sm" disabled={!vehicleId || loading} onClick={submit}>
              {loading ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-sign-in" />}
              {" "}Registrar entrada
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal del mapa ─────────────────────────────────────────────────
export default function MapaParqueo() {
  const [spaces, setSpaces]         = useState({ A: [], B: [], C: [], D: [] });
  const [zoneStats, setZoneStats]   = useState({});
  const [selected, setSelected]     = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [assigning, setAssigning]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const [spacesRes, statusRes, sessionsRes] = await Promise.all([
        api.get("/parking-spaces?limit=600"),
        api.get("/parking-spaces/status"),
        api.get("/parking-sessions/active"),
      ]);

      const allSpaces = spacesRes.data.data || [];
      const activeSessions = sessionsRes.data.data?.sessions || [];
      setSessions(activeSessions);

      // Indexar sesiones por space_id
      const sessMap = {};
      activeSessions.forEach(s => { sessMap[s.space_id] = s; });

      // Agrupar por zona y enriquecer con sesión
      const grouped = { A: [], B: [], C: [], D: [] };
      allSpaces.forEach(sp => {
        if (grouped[sp.zone] !== undefined) {
          grouped[sp.zone].push({ ...sp, _session: sessMap[sp.id] || null });
        }
      });

      setSpaces(grouped);
      setZoneStats(statusRes.data.data?.by_zone || {});
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Error cargando mapa:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const handleSpaceClick = (sp) => setSelected(sp);
  const handleAssignClick = (sp) => { setSelected(null); setAssigning(sp); };
  const handleAssignDone  = () => { setAssigning(null); load(); };

  const totalStats = Object.values(zoneStats).reduce(
    (acc, z) => ({
      total: acc.total + (z.total || 0),
      available: acc.available + (z.available || 0),
      occupied: acc.occupied + (z.occupied || 0),
    }),
    { total: 0, available: 0, occupied: 0 }
  );

  if (loading) return (
    <div className="text-center" style={{ padding: "3rem" }}>
      <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "#800020" }} />
    </div>
  );

  return (
    <>
      <div className="row clearfix">
        {/* ── Panel lateral izquierdo ─────────────────────────────────── */}
        <div className="col-lg-3 col-md-12">
          {/* Resumen global */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa fa-map" style={{ marginRight: 6 }} />Resumen campus</h3>
            </div>
            <div className="card-body" style={{ padding: "1rem" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#800020", lineHeight: 1 }}>
                  {totalStats.available}
                </div>
                <div style={{ fontSize: 12, color: "#7d8490" }}>espacios disponibles</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  width: `${totalStats.total ? Math.round((totalStats.occupied / totalStats.total) * 100) : 0}%`,
                  height: "100%", background: "#db2828", borderRadius: 6,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7d8490" }}>
                <span>{totalStats.occupied} ocupados</span>
                <span>{totalStats.total} total</span>
              </div>
            </div>
          </div>

          {/* Stats por zona */}
          {["A", "B", "C", "D"].map(z => {
            const zs = zoneStats[z] || {};
            const pct = zs.total ? Math.round(((zs.occupied || 0) / zs.total) * 100) : 0;
            const color = pct > 85 ? "#db2828" : pct > 60 ? "#fbbd08" : "#21ba45";
            return (
              <div className="card" key={z} style={{ marginBottom: "0.75rem" }}>
                <div className="card-body" style={{ padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Zona {z}</span>
                    <span style={{ fontSize: 12, color, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, margin: "6px 0", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#7d8490" }}>
                    <span><span style={{ color: "#21ba45" }}>●</span> {zs.available || 0}</span>
                    <span><span style={{ color: "#db2828" }}>●</span> {zs.occupied || 0}</span>
                    <span style={{ color: "#7d8490" }}>{zs.total || 0} total</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Leyenda */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: 13 }}>Leyenda</h3>
            </div>
            <div className="card-body" style={{ padding: "0.75rem 1rem" }}>
              {[
                ...Object.entries(STATUS_COLOR).map(([k, v]) => ({ color: v.fill, label: v.label })),
                ...Object.entries(TYPE_OVERRIDE).filter(([k]) => ["HANDICAPPED", "ELECTRIC"].includes(k))
                  .map(([k, v]) => ({ color: v.fill, label: v.label })),
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 14, height: 14, background: color, borderRadius: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#7d8490" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {lastUpdate && (
            <p style={{ fontSize: 11, color: "#7d8490", textAlign: "center", marginTop: 8 }}>
              <i className="fa fa-refresh" style={{ marginRight: 4 }} />
              Actualizado {lastUpdate.toLocaleTimeString("es-GT")}
            </p>
          )}
        </div>

        {/* ── Mapa SVG ──────────────────────────────────────────────── */}
        <div className="col-lg-9 col-md-12">
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">
                <i className="fa fa-map-o" style={{ marginRight: 6 }} />
                Plano de parqueo — Campus Central USPG
              </h3>
              <button className="btn btn-default btn-sm" onClick={load}>
                <i className="fa fa-refresh" />
              </button>
            </div>
            <div className="card-body" style={{ padding: "1rem", overflowX: "auto" }}>
              <svg
                viewBox="0 0 820 680"
                style={{ width: "100%", minWidth: 600, background: "rgba(0,0,0,0.15)", borderRadius: 8 }}
              >
                {/* Fondo del campus */}
                <rect x={0} y={0} width={820} height={680} fill="rgba(0,0,0,0.1)" />

                {/* Etiqueta campus */}
                <text x={410} y={24} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={11}>
                  Campus Central USPG · 14.5847°N, 90.5085°W
                </text>

                {/* Avenida central vertical */}
                <rect x={395} y={30} width={30} height={620} fill="rgba(255,255,255,0.06)" />
                <text x={410} y={340} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9}
                  transform="rotate(-90 410 340)">AV. PRINCIPAL</text>

                {/* Calle central horizontal */}
                <rect x={10} y={330} width={800} height={20} fill="rgba(255,255,255,0.06)" />

                {/* Zona A — arriba izquierda */}
                <g transform="translate(10, 35)">
                  <ZoneGrid zone="A" spaces={spaces.A} onSpaceClick={handleSpaceClick} W={370} H={280} />
                </g>

                {/* Zona B — arriba derecha */}
                <g transform="translate(440, 35)">
                  <ZoneGrid zone="B" spaces={spaces.B} onSpaceClick={handleSpaceClick} W={370} H={280} />
                </g>

                {/* Zona C — abajo izquierda */}
                <g transform="translate(10, 360)">
                  <ZoneGrid zone="C" spaces={spaces.C} onSpaceClick={handleSpaceClick} W={370} H={280} />
                </g>

                {/* Zona D — abajo derecha */}
                <g transform="translate(440, 360)">
                  <ZoneGrid zone="D" spaces={spaces.D} onSpaceClick={handleSpaceClick} W={370} H={280} />
                </g>
              </svg>

              <p style={{ fontSize: 11, color: "#7d8490", textAlign: "center", marginTop: 8 }}>
                Click en cualquier espacio para ver detalles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {selected && (
        <SpaceModal
          space={selected}
          onClose={() => setSelected(null)}
          onAssign={handleAssignClick}
        />
      )}
      {assigning && (
        <AssignModal
          space={assigning}
          onClose={() => setAssigning(null)}
          onSubmit={handleAssignDone}
        />
      )}
    </>
  );
}
