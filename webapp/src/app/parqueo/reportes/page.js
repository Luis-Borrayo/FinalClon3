"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const fmtQ = (v) => `Q ${Number(v || 0).toFixed(2)}`;
const fmtMin = (m) => {
  const mins = Math.round(m || 0);
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// ── Gráfica de barras inline (SVG) ────────────────────────────────────────────
function BarChart({ data = [], color = "#800020", label = "Valor" }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100 / data.length;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 9, color: "#7d8490" }}>{d.value > 0 ? d.label2 || "" : ""}</div>
            <div title={`${d.label}: ${d.label2 || d.value}`} style={{
              width: "100%", height: `${Math.max(pct, 2)}%`,
              background: color, borderRadius: "3px 3px 0 0",
              transition: "height 0.4s ease",
              minHeight: d.value > 0 ? 4 : 1,
              opacity: 0.85,
            }} />
            <div style={{ fontSize: 8, color: "#7d8490", textAlign: "center", lineHeight: 1.2 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Gráfica de área inline (SVG) ──────────────────────────────────────────────
function AreaChart({ data = [], color = "#800020" }) {
  if (!data.length) return <Empty />;
  const max  = Math.max(...data, 1);
  const W    = 600;
  const H    = 120;
  const padX = 8;
  const pts  = data.map((v, i) => {
    const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
    const y = H - 8 - ((v / max) * (H - 20));
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `${padX},${H} ${polyline} ${W - padX},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#ag)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {/* Etiquetas hora */}
      {data.map((v, i) => {
        if (i % 4 !== 0) return null;
        const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
        return (
          <text key={i} x={x} y={H - 1} textAnchor="middle" fontSize={9} fill="#7d8490">
            {String(i).padStart(2, "0")}h
          </text>
        );
      })}
    </svg>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0", color: "#7d8490" }}>
      <i className="fa fa-bar-chart fa-2x" style={{ display: "block", marginBottom: 8, color: "#343a40" }} />
      <span style={{ fontSize: 12 }}>Sin datos para el rango seleccionado</span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Reportes() {
  const [dateFrom,  setDateFrom]  = useState(daysAgo(6));
  const [dateTo,    setDateTo]    = useState(today());
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [revRes, occRes, topRes, predRes] = await Promise.allSettled([
        api.get(`/reports/revenue?from=${dateFrom}&to=${dateTo}`),
        api.get(`/reports/occupancy?from=${dateFrom}&to=${dateTo}`),
        api.get("/reports/top-users?limit=10"),
        api.get("/reports/prediction"),
      ]);

      const rev  = revRes.status  === "fulfilled" ? revRes.value.data.data  : null;
      const occ  = occRes.status  === "fulfilled" ? occRes.value.data.data  : null;
      const top  = topRes.status  === "fulfilled" ? topRes.value.data.data  : null;
      const pred = predRes.status === "fulfilled" ? predRes.value.data.data : null;

      if (rev || occ) {
        setReport({
          stats: {
            total_entries:          rev?.total_entries  ?? occ?.total_entries  ?? 0,
            unique_vehicles:        rev?.unique_vehicles ?? 0,
            total_revenue:          rev?.total           ?? 0,
            avg_revenue_per_session:rev?.avg_per_session ?? 0,
            avg_duration_minutes:   occ?.avg_duration    ?? 0,
            max_duration_minutes:   occ?.max_duration    ?? 0,
            avg_occupancy_rate:     occ?.avg_rate        ?? 0,
            peak_occupancy_rate:    occ?.peak_rate       ?? 0,
          },
          daily_income:        rev?.daily      || [],
          hourly_occupancy:    occ?.hourly     || Array(24).fill(0),
          by_zone:             occ?.by_zone    || {},
          top_users:           top?.users      || top || [],
          prediction:          pred            || {},
        });
      } else {
        setReport(buildDemo(dateFrom, dateTo));
        setError("Mostrando datos de ejemplo — API de reportes no disponible.");
      }
    } catch (e) {
      setReport(buildDemo(dateFrom, dateTo));
      setError("Mostrando datos de ejemplo — API de reportes no disponible.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Atajos de rango
  const setRange = (days) => { setDateFrom(daysAgo(days - 1)); setDateTo(today()); };

  const r = report || {};
  const stats      = r.stats      || {};
  const dailyIncome= r.daily_income|| [];
  const hourlyOcc  = r.hourly_occupancy || Array(24).fill(0);
  const byZone     = r.by_zone    || {};
  const topUsers   = r.top_users  || [];
  const prediction = r.prediction || {};

  // Preparar datos para BarChart de ingresos
  const incomeData = dailyIncome.map(d => ({
    label:  new Date(d.date + "T12:00").toLocaleDateString("es-GT", { day:"2-digit", month:"2-digit" }),
    label2: fmtQ(d.total),
    value:  Number(d.total || 0),
  }));

  return (
    <>
      {/* ── Selector de rango ─────────────────────────────────────────────────── */}
      <div className="row clearfix">
        <div className="col-12">
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-body" style={{ padding: "0.85rem 1.25rem" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <i className="fa fa-calendar" style={{ color: "#7d8490" }} />
                <input type="date" className="form-control form-control-sm" style={{ maxWidth: 150 }}
                  value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo} />
                <span style={{ color: "#7d8490", fontSize: 13 }}>→</span>
                <input type="date" className="form-control form-control-sm" style={{ maxWidth: 150 }}
                  value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom} max={today()} />

                {/* Atajos */}
                {[
                  { label:"Hoy",       days:1  },
                  { label:"7 días",    days:7  },
                  { label:"30 días",   days:30 },
                  { label:"90 días",   days:90 },
                ].map(({ label, days }) => (
                  <button key={days} className="btn btn-default btn-sm"
                    onClick={() => setRange(days)}>{label}</button>
                ))}

                <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
                  {loading
                    ? <i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />
                    : <i className="fa fa-search" style={{ marginRight: 6 }} />}
                  Generar reporte
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#fbbd08" }}>
                  <i className="fa fa-exclamation-triangle" style={{ marginRight: 4 }} />{error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: "3rem" }}>
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "#800020" }} />
          <p style={{ color: "#7d8490", marginTop: "1rem" }}>Generando reporte...</p>
        </div>
      ) : (
        <>
          {/* ── Stat cards ────────────────────────────────────────────────────── */}
          <div className="row clearfix">
            {[
              { label:"Total entradas",    value: stats.total_entries    ?? 0,                        color:"#800020", icon:"fa-sign-in",            sub: `${stats.unique_vehicles ?? 0} vehículos únicos` },
              { label:"Ingresos totales",  value: fmtQ(stats.total_revenue),                          color:"#21ba45", icon:"fa-money",               sub: `Prom. ${fmtQ(stats.avg_revenue_per_session)} / sesión` },
              { label:"Tiempo promedio",   value: fmtMin(stats.avg_duration_minutes),                 color:"#17a2b8", icon:"fa-clock-o",             sub: `Máx: ${fmtMin(stats.max_duration_minutes)}` },
              { label:"Ocupación promedio",value: `${Math.round(stats.avg_occupancy_rate ?? 0)}%`,    color:"#fbbd08", icon:"fa-map-marker",          sub: `Pico: ${Math.round(stats.peak_occupancy_rate ?? 0)}%` },
            ].map(({ label, value, color, icon, sub }) => (
              <div className="col-lg-3 col-md-6 col-sm-12" key={label}>
                <div className="card" style={{ borderLeft: `4px solid ${color}`, marginBottom: "1rem" }}>
                  <div className="card-body" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem" }}>
                    <div style={{ width:44, height:44, borderRadius:"50%", background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <i className={`fa ${icon}`} style={{ color, fontSize:18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize:22, fontWeight:700, lineHeight:1 }}>{value}</div>
                      <div style={{ fontSize:12, color:"#7d8490", marginTop:2 }}>{label}</div>
                      {sub && <div style={{ fontSize:11, color:"#aaa", marginTop:1 }}>{sub}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Gráficas ──────────────────────────────────────────────────────── */}
          <div className="row clearfix">
            {/* Ingresos por día */}
            <div className="col-lg-6 col-md-12">
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa fa-bar-chart" style={{ marginRight: 6 }} />
                    Ingresos por día
                  </h3>
                </div>
                <div className="card-body" style={{ padding: "1rem" }}>
                  <BarChart data={incomeData} color="#800020" label="Ingreso diario" />
                </div>
              </div>
            </div>

            {/* Ocupación por hora */}
            <div className="col-lg-6 col-md-12">
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa fa-area-chart" style={{ marginRight: 6 }} />
                    Ocupación promedio por hora
                  </h3>
                </div>
                <div className="card-body" style={{ padding: "0.5rem 1rem 1rem" }}>
                  <AreaChart data={hourlyOcc} color="#17a2b8" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Desglose por zona + Predicción ────────────────────────────────── */}
          <div className="row clearfix">
            {/* Por zona */}
            <div className="col-lg-7 col-md-12">
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa fa-map-marker" style={{ marginRight: 6 }} />
                    Desglose por zona
                  </h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr style={{ background: "rgba(128,0,32,0.08)" }}>
                        <th>Zona</th>
                        <th>Entradas</th>
                        <th>Ingresos</th>
                        <th>Tiempo prom.</th>
                        <th>Ocupación prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["A","B","C","D"].map(z => {
                        const zd = byZone[z] || {};
                        const pct = Math.round(zd.avg_occupancy ?? 0);
                        const color = pct > 85 ? "#db2828" : pct > 60 ? "#fbbd08" : "#21ba45";
                        return (
                          <tr key={z}>
                            <td><span className="badge badge-default" style={{ fontSize:12 }}>Zona {z}</span></td>
                            <td>{zd.entries ?? 0}</td>
                            <td style={{ color:"#21ba45", fontWeight:600 }}>{fmtQ(zd.revenue)}</td>
                            <td>{fmtMin(zd.avg_duration)}</td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:4, height:6, overflow:"hidden" }}>
                                  <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:4 }} />
                                </div>
                                <span style={{ color, fontSize:12, fontWeight:600, minWidth:32 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Predicción */}
            <div className="col-lg-5 col-md-12">
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa fa-magic" style={{ marginRight: 6 }} />
                    Predicción — próxima hora
                  </h3>
                </div>
                <div className="card-body" style={{ padding: "1.25rem" }}>
                  {prediction.hour != null ? (
                    <>
                      <div style={{ textAlign:"center", marginBottom:16 }}>
                        <div style={{ fontSize:13, color:"#7d8490", marginBottom:4 }}>
                          Estimado para las {String(prediction.hour).padStart(2,"0")}:00 hrs
                        </div>
                        <div style={{ fontSize:42, fontWeight:800,
                          color: prediction.occupancy_pct > 85 ? "#db2828" :
                                 prediction.occupancy_pct > 60 ? "#fbbd08" : "#21ba45",
                          lineHeight:1 }}>
                          {Math.round(prediction.occupancy_pct ?? 0)}%
                        </div>
                        <div style={{ fontSize:12, color:"#7d8490", marginTop:4 }}>ocupación esperada</div>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, height:10, overflow:"hidden", marginBottom:12 }}>
                        <div style={{
                          width:`${prediction.occupancy_pct ?? 0}%`, height:"100%", borderRadius:8,
                          background: prediction.occupancy_pct > 85 ? "#db2828" :
                                      prediction.occupancy_pct > 60 ? "#fbbd08" : "#21ba45",
                          transition:"width 0.5s",
                        }} />
                      </div>

                      {[
                        { label:"Entradas esperadas", value: prediction.expected_entries ?? "—" },
                        { label:"Salidas esperadas",  value: prediction.expected_exits   ?? "—" },
                        { label:"Zona más congestionada", value: prediction.busiest_zone  ?? "—" },
                        { label:"Confianza",          value: prediction.confidence ? `${Math.round(prediction.confidence * 100)}%` : "—" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{
                          display:"flex", justifyContent:"space-between",
                          padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)",
                          fontSize:13,
                        }}>
                          <span style={{ color:"#7d8490" }}>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ textAlign:"center", padding:"2rem 0", color:"#7d8490" }}>
                      <i className="fa fa-magic fa-2x" style={{ display:"block", marginBottom:8, color:"#343a40" }} />
                      <span style={{ fontSize:12 }}>Sin datos de predicción disponibles</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Top 10 usuarios ───────────────────────────────────────────────── */}
          <div className="row clearfix">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa fa-trophy" style={{ marginRight: 6 }} />
                    Top 10 usuarios más frecuentes
                  </h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="table table-hover table-striped mb-0">
                    <thead>
                      <tr style={{ background:"rgba(128,0,32,0.08)" }}>
                        <th style={{ width:40 }}>#</th>
                        <th>Nombre</th>
                        <th>Carnet</th>
                        <th>Rol</th>
                        <th>Visitas</th>
                        <th>Tiempo total</th>
                        <th>Gasto total</th>
                        <th>Zona favorita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center" style={{ padding:"2rem", color:"#7d8490" }}>
                            Sin datos de usuarios
                          </td>
                        </tr>
                      ) : (
                        topUsers.map((u, i) => (
                          <tr key={u.id || i}>
                            <td>
                              <span style={{
                                fontWeight:700, fontSize:14,
                                color: i === 0 ? "#fbbd08" : i === 1 ? "#7d8490" : i === 2 ? "#cd7f32" : "#aaa",
                              }}>
                                {i < 3 ? <i className="fa fa-trophy" /> : i + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight:600 }}>
                              {u.first_name} {u.last_name}
                            </td>
                            <td style={{ fontSize:12, color:"#7d8490" }}>{u.carnet || "—"}</td>
                            <td>
                              <span className={`badge ${
                                u.role === "ADMIN"   ? "badge-danger"  :
                                u.role === "TEACHER" ? "badge-primary" : "badge-default"
                              }`}>{u.role || "—"}</span>
                            </td>
                            <td><strong style={{ color:"#800020" }}>{u.visits ?? 0}</strong></td>
                            <td style={{ fontSize:12 }}>{fmtMin(u.total_minutes)}</td>
                            <td style={{ fontWeight:600, color:"#21ba45" }}>{fmtQ(u.total_spent)}</td>
                            <td>
                              {u.favorite_zone
                                ? <span className="badge badge-default">Zona {u.favorite_zone}</span>
                                : "—"}
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
        </>
      )}
    </>
  );
}

// ── Datos demo si la API no existe ────────────────────────────────────────────
function buildDemo(from, to) {
  const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(from); d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0,10), total: Math.random() * 800 + 200 };
  });
  return {
    stats: {
      total_entries: days * 42, unique_vehicles: days * 28,
      total_revenue: daily.reduce((s, d) => s + d.total, 0),
      avg_revenue_per_session: 18.5,
      avg_duration_minutes: 95, max_duration_minutes: 480,
      avg_occupancy_rate: 62, peak_occupancy_rate: 89,
    },
    daily_income: daily,
    hourly_occupancy: Array.from({ length:24 }, (_, h) =>
      h < 6 ? 2 : h < 9 ? 30 + h*8 : h < 12 ? 75 + (h-9)*5 : h < 14 ? 88 : h < 18 ? 70 - (h-14)*5 : 20
    ),
    by_zone: Object.fromEntries(["A","B","C","D"].map(z => [z, {
      entries: Math.round(days * 10 + Math.random()*20),
      revenue: Math.random()*2000 + 800,
      avg_duration: 80 + Math.random()*40,
      avg_occupancy: 50 + Math.random()*40,
    }])),
    top_users: Array.from({ length:8 }, (_, i) => ({
      id: i, first_name: ["Ana","Luis","María","Carlos","Jorge","Sofía","Diego","Elena"][i],
      last_name: ["López","García","Martínez","Pérez","Rodríguez","González","Hernández","Díaz"][i],
      carnet: `20230000${i+1}`, role: i < 2 ? "TEACHER" : "STUDENT",
      visits: 40 - i*4, total_minutes: (40-i*4)*95, total_spent: (40-i*4)*18.5,
      favorite_zone: ["A","B","A","C","B","D","A","C"][i],
    })),
    prediction: {
      hour: new Date().getHours() + 1,
      occupancy_pct: 68, expected_entries: 12, expected_exits: 8,
      busiest_zone: "A", confidence: 0.74,
    },
  };
}
