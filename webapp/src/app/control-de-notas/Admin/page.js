"use client";

import { useEffect, useState } from "react";

// ── APIs que consumimos ───────────────────────────────────────────────────────
// GET /api/control-de-notas/notas/:carnet
// GET /api/control-de-notas/notas/:carnet/solvencia-estado
// GET /api/control-de-notas/graduacion/requisitos/:carnet
// GET /api/sistema-academico/alumnos        (Grupo 1)
// GET /api/sistema-academico/catedraticos   (Grupo 1)
// GET /api/sistema-academico/cursos         (Grupo 1)
// ─────────────────────────────────────────────────────────────────────────────

// ── Modal confirmación ────────────────────────────────────────────────────────
function ModalConfirm({ titulo, mensaje, onConfirmar, onCancelar }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "white", borderRadius: "12px", padding: "28px",
        maxWidth: "380px", width: "90%", boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      }}>
        <h5 style={{ marginBottom: "10px" }}>{titulo}</h5>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}>{mensaje}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn" onClick={onCancelar}
            style={{ border: "1.5px solid #ccc", background: "white", color: "#444" }}>
            Cancelar
          </button>
          <button className="btn" onClick={onConfirmar}
            style={{ background: "#c62828", color: "white", fontWeight: 700 }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal detalle alumno ──────────────────────────────────────────────────────
function ModalDetalleAlumno({ carnet, nombre, onCerrar }) {
  const [notas,       setNotas]       = useState(null);
  const [solvencia,   setSolvencia]   = useState(null);
  const [graduacion,  setGraduacion]  = useState(null);
  const [cargando,    setCargando]    = useState(true);
  const [tabActiva,   setTabActiva]   = useState("notas");

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`/api/control-de-notas/notas/${carnet}`),
          fetch(`/api/control-de-notas/notas/${carnet}/solvencia-estado`),
          fetch(`/api/control-de-notas/graduacion/requisitos/${carnet}`),
        ]);
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        if (d1.success) setNotas(d1);
        if (d2.success) setSolvencia(d2);
        if (d3.success) setGraduacion(d3);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [carnet]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: "12px", width: "100%",
        maxWidth: "760px", maxHeight: "88vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px", borderBottom: "2px solid #1976d2",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "white", zIndex: 1,
        }}>
          <div>
            <h5 style={{ margin: 0, color: "#0d47a1" }}>🔍 Detalle: {nombre}</h5>
            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Carnet: {carnet}</p>
          </div>
          <button onClick={onCerrar} style={{
            background: "#f5f5f5", border: "none", borderRadius: "8px",
            padding: "8px 14px", cursor: "pointer", fontSize: "16px",
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {cargando ? (
            <p style={{ textAlign: "center", color: "#888" }}>⏳ Cargando información...</p>
          ) : (
            <>
              {/* Stats rápidos */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[
                  { label: "Promedio",   valor: notas?.resumen?.promedioGeneral   ?? "—", color: "#1976d2", bg: "#e3f2fd" },
                  { label: "Aprobados",  valor: notas?.resumen?.cursosAprobados   ?? "—", color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Reprobados", valor: notas?.resumen?.cursosReprobados  ?? "—", color: "#c62828", bg: "#ffebee" },
                  { label: "Créditos",   valor: notas?.resumen?.creditosAprobados ?? "—", color: "#e65100", bg: "#fff3e0" },
                  {
                    label: "Graduación",
                    valor: graduacion?.aptoParaGraduarse ? "✅ Apto" : "⏳ Pendiente",
                    color: graduacion?.aptoParaGraduarse ? "#2e7d32" : "#e65100",
                    bg:    graduacion?.aptoParaGraduarse ? "#e8f5e9" : "#fff3e0",
                  },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "10px 14px", borderRadius: "8px",
                    background: s.bg, textAlign: "center", minWidth: "100px",
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: s.color }}>{s.valor}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs del modal */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px", borderBottom: "1px solid #eee" }}>
                {[
                  { id: "notas",      label: "📝 Notas" },
                  { id: "solvencia",  label: "💳 Solvencia" },
                  { id: "graduacion", label: "🎓 Graduación" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setTabActiva(t.id)} style={{
                    padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                    borderBottom: tabActiva === t.id ? "2px solid #1976d2" : "2px solid transparent",
                    color: tabActiva === t.id ? "#1976d2" : "#666",
                    fontWeight: tabActiva === t.id ? 700 : 400,
                    fontSize: "13px", marginBottom: "-1px",
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Notas */}
              {tabActiva === "notas" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Curso</th><th>Período</th>
                      <th className="text-center">Zona</th>
                      <th className="text-center">Final</th>
                      <th className="text-center">Nota</th>
                      <th className="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(notas?.notas ?? []).map((n, i) => (
                      <tr key={i} style={{ background: n.estado === "reprobado" ? "#fff8f8" : "white" }}>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: "12px" }}>{n.curso}</span><br />
                          <span style={{ fontSize: "12px", color: "#888" }}>{n.nombreCurso}</span>
                        </td>
                        <td style={{ fontSize: "13px", color: "#888" }}>{n.periodo}</td>
                        <td className="text-center">{n.zona}</td>
                        <td className="text-center">{n.examenFinal}</td>
                        <td className="text-center">
                          <span style={{ fontWeight: 700, color: n.notaFinal >= 61 ? "#2e7d32" : "#c62828" }}>
                            {n.notaFinal}
                          </span>
                        </td>
                        <td className="text-center">
                          <span style={{
                            padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                            background: n.estado === "aprobado" ? "#e8f5e9" : "#ffebee",
                            color: n.estado === "aprobado" ? "#2e7d32" : "#c62828",
                          }}>
                            {n.estado === "aprobado" ? "✅ Aprobado" : "❌ Reprobado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab Solvencia */}
              {tabActiva === "solvencia" && solvencia && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Notas */}
                  <div style={{
                    padding: "14px 16px", borderRadius: "8px",
                    background: solvencia.solvenciaNotas?.solvente ? "#e8f5e9" : "#ffebee",
                    border: `1px solid ${solvencia.solvenciaNotas?.solvente ? "#a5d6a7" : "#ef9a9a"}`,
                  }}>
                    <p style={{ margin: 0, fontWeight: 600, color: solvencia.solvenciaNotas?.solvente ? "#2e7d32" : "#c62828" }}>
                      📝 Solvencia de Notas: {solvencia.solvenciaNotas?.solvente ? "✅ Solvente" : "❌ Insolvente"}
                    </p>
                    {!solvencia.solvenciaNotas?.solvente && (
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#c62828" }}>
                        {solvencia.solvenciaNotas?.totalReprobados} curso(s) reprobado(s)
                      </p>
                    )}
                  </div>
                  {/* Pagos */}
                  <div style={{
                    padding: "14px 16px", borderRadius: "8px",
                    background: solvencia.solvenciaPagos?.solvente ? "#e8f5e9" : "#ffebee",
                    border: `1px solid ${solvencia.solvenciaPagos?.solvente ? "#a5d6a7" : "#ef9a9a"}`,
                  }}>
                    <p style={{ margin: 0, fontWeight: 600, color: solvencia.solvenciaPagos?.solvente ? "#2e7d32" : "#c62828" }}>
                      💳 Solvencia de Pagos: {solvencia.solvenciaPagos?.solvente ? "✅ Solvente" : "❌ Con mora"}
                    </p>
                    {!solvencia.solvenciaPagos?.solvente && (
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#c62828" }}>
                        Monto pendiente: Q{solvencia.solvenciaPagos?.montoPendiente?.toFixed(2)}
                      </p>
                    )}
                  </div>
                  {/* General */}
                  <div style={{
                    padding: "14px 16px", borderRadius: "8px",
                    background: solvencia.solvenciaGeneral ? "#e8f5e9" : "#fff8e1",
                    border: `1px solid ${solvencia.solvenciaGeneral ? "#a5d6a7" : "#ffe082"}`,
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, color: solvencia.solvenciaGeneral ? "#2e7d32" : "#e65100" }}>
                      {solvencia.mensaje}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Graduación */}
              {tabActiva === "graduacion" && graduacion && (
                <div>
                  <div style={{
                    padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
                    background: graduacion.aptoParaGraduarse ? "#e8f5e9" : "#fff8e1",
                    border: `1px solid ${graduacion.aptoParaGraduarse ? "#a5d6a7" : "#ffe082"}`,
                    fontWeight: 600,
                    color: graduacion.aptoParaGraduarse ? "#2e7d32" : "#e65100",
                  }}>
                    🎓 {graduacion.resumenEstado}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Créditos */}
                    <div style={{ padding: "12px 16px", background: "#f9f9f9", borderRadius: "8px" }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "13px" }}>📚 Créditos</p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                        {graduacion.requisitos?.creditos?.obtenidos} / {graduacion.requisitos?.creditos?.requeridos} créditos
                        {graduacion.requisitos?.creditos?.cumple
                          ? " ✅"
                          : ` — faltan ${graduacion.requisitos?.creditos?.faltantes}`}
                      </p>
                    </div>

                    {/* Cursos obligatorios */}
                    <div style={{ padding: "12px 16px", background: "#f9f9f9", borderRadius: "8px" }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "13px" }}>📋 Cursos Obligatorios</p>
                      <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#555" }}>
                        {graduacion.requisitos?.cursosObligatorios?.cumplidos} / {graduacion.requisitos?.cursosObligatorios?.requeridos} completados
                      </p>
                      {(graduacion.requisitos?.cursosObligatorios?.pendientes ?? []).length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {graduacion.requisitos.cursosObligatorios.pendientes.map((c) => (
                            <span key={c} style={{
                              padding: "2px 8px", borderRadius: "6px",
                              background: "#ffebee", color: "#c62828",
                              fontSize: "12px", fontWeight: 600,
                            }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Solvencia económica */}
                    <div style={{ padding: "12px 16px", background: "#f9f9f9", borderRadius: "8px" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "13px" }}>💳 Solvencia Económica</p>
                      <p style={{ margin: 0, fontSize: "13px", color: graduacion.requisitos?.solvenciaEconomica?.solvente ? "#2e7d32" : "#c62828" }}>
                        {graduacion.requisitos?.solvenciaEconomica?.solvente ? "✅ Solvente" : `❌ Mora: Q${graduacion.requisitos?.solvenciaEconomica?.montoPendiente}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const TABS = ["Alumnos", "Catedráticos", "Cursos"];

export default function AdminPage() {
  const [usuario,      setUsuario]      = useState(null);
  const [tabActiva,    setTabActiva]    = useState("Alumnos");
  const [busqueda,     setBusqueda]     = useState("");
  const [confirm,      setConfirm]      = useState(null);
  const [mensaje,      setMensaje]      = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [cargandoG1,   setCargandoG1]   = useState(false);
  const [errorG1,      setErrorG1]      = useState("");

  // Datos del Grupo 1 (se intentan cargar, si falla usa mock)
  const [alumnos,      setAlumnos]      = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [cursos,       setCursos]       = useState([]);

  // Datos mock propios para mostrar aunque Grupo 1 falle
  const alumnosMock = [
    { id: "1", carnet: "2021001", nombre: "Carlos Andrés",  apellido: "Pérez López",       email: "carlos.perez@universidad.edu",   carrera: { nombre: "Ingeniería en Sistemas" },    asignaciones: [{}, {}] },
    { id: "2", carnet: "2021002", nombre: "María Fernanda", apellido: "García Ramos",      email: "maria.garcia@universidad.edu",   carrera: { nombre: "Administración de Empresas" }, asignaciones: [{}] },
    { id: "3", carnet: "2019003", nombre: "José Roberto",   apellido: "Méndez Cruz",       email: "jose.mendez@universidad.edu",    carrera: { nombre: "Ingeniería en Sistemas" },    asignaciones: [{}, {}, {}] },
    { id: "4", carnet: "2020004", nombre: "Ana Lucía",      apellido: "Rodríguez Vásquez", email: "ana.rodriguez@universidad.edu",  carrera: { nombre: "Contaduría Pública" },        asignaciones: [{}] },
    { id: "5", carnet: "2018005", nombre: "Luis Enrique",   apellido: "Torres Molina",     email: "luis.torres@universidad.edu",    carrera: { nombre: "Ingeniería en Sistemas" },    asignaciones: [{}, {}, {}, {}] },
  ];

  const catedraticosMock = [
    { id: "1", codigo: "CAT001", nombre: "Roberto",  apellido: "Hernández", email: "roberto.hernandez@universidad.edu", horarios: [{}, {}] },
    { id: "2", codigo: "CAT002", nombre: "Sandra",   apellido: "Martínez",  email: "sandra.martinez@universidad.edu",   horarios: [{}] },
    { id: "3", codigo: "CAT003", nombre: "Miguel",   apellido: "López",     email: "miguel.lopez@universidad.edu",      horarios: [{}, {}, {}] },
  ];

  const cursosMock = [
    { id: "1", codigo: "ING101", nombre: "Matemática 1",             creditos: 4, horarios: [{}, {}] },
    { id: "2", codigo: "ING102", nombre: "Programación 1",           creditos: 4, horarios: [{}] },
    { id: "3", codigo: "ING201", nombre: "Estructuras de Datos",     creditos: 4, horarios: [{}] },
    { id: "4", codigo: "ING202", nombre: "Base de Datos 1",          creditos: 4, horarios: [{}] },
    { id: "5", codigo: "GEN101", nombre: "Comunicación y Lenguaje",  creditos: 3, horarios: [{}] },
    { id: "6", codigo: "GEN102", nombre: "Ética Profesional",        creditos: 2, horarios: [{}] },
  ];

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.href = "/login"; return; }
    const u = JSON.parse(raw);
    if (u.role !== "ADMIN") { window.location.href = "/login"; return; }
    setUsuario(u);
    intentarCargarGrupo1();
  }, []);

  // Intenta cargar datos del Grupo 1, si falla usa mock
  const intentarCargarGrupo1 = async () => {
    setCargandoG1(true);
    setErrorG1("");
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/sistema-academico/alumnos"),
        fetch("/api/sistema-academico/catedraticos"),
        fetch("/api/sistema-academico/cursos"),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);

      setAlumnos(d1.success      ? d1.data      : alumnosMock);
      setCatedraticos(d2.success ? d2.data      : catedraticosMock);
      setCursos(d3.success       ? d3.data      : cursosMock);

      if (!d1.success || !d2.success || !d3.success) {
        setErrorG1("API Grupo 1 no disponible — mostrando datos mock");
      }
    } catch {
      // Si falla completamente, usar mock
      setAlumnos(alumnosMock);
      setCatedraticos(catedraticosMock);
      setCursos(cursosMock);
      setErrorG1("API Grupo 1 no disponible — mostrando datos mock");
    } finally {
      setCargandoG1(false);
    }
  };

  const eliminarAlumno = (alumno) => {
    setConfirm({
      titulo: "Eliminar alumno",
      mensaje: `¿Eliminar a ${alumno.nombre} ${alumno.apellido} (${alumno.carnet})? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        setConfirm(null);
        try {
          const res  = await fetch(`/api/sistema-academico/alumnos/${alumno.id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            setMensaje({ tipo: "ok", texto: `✅ ${data.message}` });
            intentarCargarGrupo1();
          } else {
            setMensaje({ tipo: "error", texto: `⚠️ ${data.error ?? "Error al eliminar"}` });
          }
        } catch {
          setMensaje({ tipo: "error", texto: "⚠️ Error de conexión." });
        }
        setTimeout(() => setMensaje(null), 4000);
      },
      onCancelar: () => setConfirm(null),
    });
  };

  const filtrar = (lista, campos) =>
    lista.filter((item) =>
      campos.some((campo) =>
        String(item[campo] ?? "").toLowerCase().includes(busqueda.toLowerCase())
      )
    );

  const alumnosFiltrados      = filtrar(alumnos,      ["carnet", "nombre", "apellido", "email"]);
  const catedraticosFiltrados = filtrar(catedraticos, ["codigo", "nombre", "apellido", "email"]);
  const cursosFiltrados       = filtrar(cursos,       ["codigo", "nombre"]);

  return (
    <>
      {confirm      && <ModalConfirm {...confirm} />}
      {modalDetalle && (
        <ModalDetalleAlumno
          carnet={modalDetalle.carnet}
          nombre={`${modalDetalle.nombre} ${modalDetalle.apellido}`}
          onCerrar={() => setModalDetalle(null)}
        />
      )}

      <div className="row clearfix">
        <div className="col-lg-12">
          <div className="card">

            {/* ── Header ── */}
            <div className="card-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "2px solid #1976d2",
            }}>
              <div>
                <h3 style={{ color: "#0d47a1", marginBottom: "4px" }}>⚙️ Panel de Administración</h3>
                <p style={{ color: "#888", margin: 0 }}>Control de Notas — Vista completa</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={intentarCargarGrupo1} style={{
                  padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                  border: "1.5px solid #1976d2", background: "#e3f2fd",
                  color: "#1976d2", fontSize: "13px", fontWeight: 600,
                }}>
                  {cargandoG1 ? "⏳" : "🔄"} Actualizar
                </button>
                <a href="/control-de-notas" style={{ color: "#888", fontSize: "13px" }}>🚪 Salir</a>
              </div>
            </div>

            <div className="card-body">

              {/* Avisos */}
              {mensaje && (
                <div style={{
                  padding: "10px 16px", borderRadius: "8px", marginBottom: "16px",
                  background: mensaje.tipo === "ok" ? "#e8f5e9" : "#ffebee",
                  color: mensaje.tipo === "ok" ? "#2e7d32" : "#c62828",
                  fontWeight: 600, fontSize: "14px",
                }}>
                  {mensaje.texto}
                </div>
              )}

              {errorG1 && (
                <div style={{
                  padding: "8px 14px", borderRadius: "8px", marginBottom: "12px",
                  background: "#fff8e1", border: "1px solid #ffe082",
                  fontSize: "12px", color: "#795548",
                }}>
                  ⚠️ {errorG1}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                {[
                  { label: "Alumnos",      valor: alumnos.length,      color: "#1976d2", bg: "#e3f2fd" },
                  { label: "Catedráticos", valor: catedraticos.length, color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Cursos",       valor: cursos.length,       color: "#e65100", bg: "#fff3e0" },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "12px 20px", borderRadius: "10px",
                    background: s.bg, border: `1.5px solid ${s.color}22`,
                    minWidth: "120px", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: s.color }}>
                      {cargandoG1 ? "⏳" : s.valor}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Buscador */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  className="form-control"
                  placeholder="🔍 Buscar por nombre, carnet, código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ maxWidth: "360px" }}
                />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => { setTabActiva(tab); setBusqueda(""); }} style={{
                    padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                    borderBottom: tabActiva === tab ? "3px solid #1976d2" : "3px solid transparent",
                    color: tabActiva === tab ? "#1976d2" : "#666",
                    fontWeight: tabActiva === tab ? 700 : 400,
                    fontSize: "14px", marginBottom: "-2px",
                  }}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Tab Alumnos ── */}
              {tabActiva === "Alumnos" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Carnet</th><th>Nombre</th><th>Email</th>
                      <th>Carrera</th>
                      <th className="text-center">Cursos</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#aaa", padding: "30px" }}>Sin resultados.</td></tr>
                    ) : alumnosFiltrados.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.carnet}</td>
                        <td>{a.nombre} {a.apellido}</td>
                        <td style={{ fontSize: "13px", color: "#666" }}>{a.email}</td>
                        <td style={{ fontSize: "13px" }}>{a.carrera?.nombre ?? "—"}</td>
                        <td className="text-center">
                          <span className="badge" style={{ background: "#e3f2fd", color: "#0d47a1" }}>
                            {a.asignaciones?.length ?? 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#1976d2", color: "white", fontSize: "12px" }}
                              onClick={() => setModalDetalle(a)}
                              title="Ver detalle completo"
                            >
                              🔍 Detalle
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#ff5252", color: "white" }}
                              onClick={() => eliminarAlumno(a)}
                              title="Eliminar alumno"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Tab Catedráticos ── */}
              {tabActiva === "Catedráticos" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Código</th><th>Nombre</th><th>Email</th>
                      <th className="text-center">Horarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catedraticosFiltrados.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: "30px" }}>Sin resultados.</td></tr>
                    ) : catedraticosFiltrados.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.codigo}</td>
                        <td>{c.nombre} {c.apellido}</td>
                        <td style={{ fontSize: "13px", color: "#666" }}>{c.email}</td>
                        <td className="text-center">
                          <span className="badge" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                            {c.horarios?.length ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Tab Cursos ── */}
              {tabActiva === "Cursos" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Código</th><th>Nombre</th>
                      <th className="text-center">Créditos</th>
                      <th className="text-center">Horarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosFiltrados.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: "30px" }}>Sin resultados.</td></tr>
                    ) : cursosFiltrados.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.codigo}</td>
                        <td>{c.nombre}</td>
                        <td className="text-center">{c.creditos}</td>
                        <td className="text-center">
                          <span className="badge" style={{ background: "#fff3e0", color: "#e65100" }}>
                            {c.horarios?.length ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}