import prisma from "@/lib/prisma"; // Conectado al schema 'notas'

export const NOTA_APROBACION = 61;

// ── Helpers de error ─────────────────────────────────────────────────────────
export function crearError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ── Catálogos Grupo 1 ────────────────────────────────────────────────────────
export async function obtenerCatalogos(origin) {
  const [alumnos, cursos] = await Promise.all([
    fetchApi(`${origin}${API_BASE.ALUMNOS}`),
    fetchApi(`${origin}${API_BASE.CURSOS}`),
  ]);
  return {
    alumnos: Array.isArray(alumnos) ? alumnos : [],
    cursos:  Array.isArray(cursos)  ? cursos  : [],
  };
}

export function buscarAlumnoPorCarnet(alumnos, carnet) {
  return alumnos.find(a => a.carnet === carnet) ?? null;
}

export function buscarCursoPorParametro(cursos, param) {
  return cursos.find(c =>
    c.codigo === param ||
    String(c.id) === String(param)
  ) ?? null;
}

export function obtenerIdAlumno(alumno) {
  return alumno?.id ? Number(alumno.id) : null;
}

export function obtenerIdCurso(curso) {
  return curso?.id ? Number(curso.id) : null;
}

export function obtenerCodigoCurso(curso, idCurso) {
  return curso?.codigo ?? String(idCurso);
}

// Rutas APIs Grupo 1 (REST)
const API_BASE = {
  ALUMNOS: "/api/sistema-academico/alumnos",  // GET lista completa — Grupo 1
  CURSOS: "/api/sistema-academico/cursos",    // GET lista completa — Grupo 1
  SOLVENCIA: "/api/solvencia",                // Grupo 6
  MORA: "/api/mora"                           // Grupo 6
};

// Helper fetch
async function fetchApi(url) {
  const res = await fetch(url, { 
    cache: "no-store",
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  
  const data = await res.json();
  return data.data ?? data;
}

// Detectar tipo de identificador
function esUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function esNumerico(str) {
  return /^\d+$/.test(str);
}

// 🔧 BUSCAR ALUMNO: Busca por UUID (parqueo_user_id), Carnet, o ID numérico
export async function buscarAlumnoPorIdentificador(origin, identificador) {
  // Obtener lista de alumnos desde API Grupo 1
  const alumnos = await fetchApi(`${origin}${API_BASE.ALUMNOS}`);
  
  if (!Array.isArray(alumnos)) {
    throw new Error("Error obteniendo lista de alumnos");
  }

  let alumno = null;

  if (esUUID(identificador)) {
    // Buscar por parqueo_user_id (UUID del auth.User)
    alumno = alumnos.find(a => a.parqueo_user_id === identificador);
  } else if (esNumerico(identificador)) {
    // Buscar por ID numérico o carnet numérico
    alumno = alumnos.find(a => 
      String(a.id) === identificador || 
      a.carnet === identificador
    );
  } else {
    // Buscar por carnet (string)
    alumno = alumnos.find(a => a.carnet === identificador);
  }
  
  if (!alumno) {
    throw new Error(`Alumno con identificador ${identificador} no encontrado`);
  }
  
  return alumno; // Devuelve objeto con id (Int), carnet, nombre, carrera, etc.
}

export async function obtenerCursos(origin) {
  return fetchApi(`${origin}${API_BASE.CURSOS}`);
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function parseMoney(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export function obtenerNombreAlumno(alumno) {
  return `${alumno?.nombre ?? ""} ${alumno?.apellido ?? ""}`.trim() || "Alumno";
}

export function obtenerNombreCarrera(alumno) {
  return alumno?.carrera?.nombre ?? null;
}

export function buscarCursoPorId(cursos, idCurso) {
  return cursos.find((c) => Number(c.id) === Number(idCurso));
}

export function construirNotaDesdeMatricula(matricula, curso) {
  const notas = matricula.notas ?? [];
  let zona = 0;
  let examenFinal = 0;

  for (const nota of notas) {
    const valor = toNumber(nota.valor);
    const nombreEval = nota.evaluacion?.nombre?.toLowerCase() ?? "";
    if (nombreEval.includes("final") || nombreEval.includes("examen")) {
      examenFinal += valor;
    } else {
      zona += valor;
    }
  }

  const notaFinal = toNumber(matricula.cierre?.nota_final, zona + examenFinal);
  const estado = notaFinal >= NOTA_APROBACION ? "aprobado" : "reprobado";

  return {
    curso: curso?.codigo ?? String(curso?.id),
    nombreCurso: curso?.nombre ?? "Curso",
    periodo: matricula.periodo,
    zona,
    examenFinal,
    notaFinal,
    estado,
    creditos: toNumber(curso?.creditos),
  };
}

// Consulta Prisma al schema 'notas' (Grupo 2)
export async function obtenerMatriculasAlumno(idAlumnoInt) {
  return prisma.matricula.findMany({
    where: { id_alumno: idAlumnoInt },
    include: {
      notas: { include: { evaluacion: true } },
      cierre: true,
    },
    orderBy: [{ periodo: "desc" }, { id_matricula: "desc" }],
  });
}

// 🔧 ARMAR NOTAS: Conecta Grupo 1 (API) + Grupo 2 (Prisma notas)
export async function armarNotasAlumno(origin, identificador) {
  // 1. Buscar alumno en Grupo 1 (por UUID, carnet o ID)
  const alumno = await buscarAlumnoPorIdentificador(origin, identificador);
  
  // El ID numérico del alumno para el schema 'notas'
  const idAlumnoInt = Number(alumno.id);
  
  if (!idAlumnoInt) {
    throw new Error("Alumno sin ID válido");
  }

  // 2. Obtener cursos de Grupo 1
  const cursos = await obtenerCursos(origin);

  // 3. Obtener matrículas de Grupo 2 (schema notas)
  const matriculas = await obtenerMatriculasAlumno(idAlumnoInt);
  
  // 4. Construir notas
  const notas = matriculas.map((mat) => {
    const curso = buscarCursoPorId(cursos, mat.id_curso);
    return construirNotaDesdeMatricula(mat, curso);
  });

  const aprobados = notas.filter(n => n.estado === "aprobado");
  const reprobados = notas.filter(n => n.estado === "reprobado");
  
  const promedioGeneral = notas.length > 0 
    ? Number((notas.reduce((a, n) => a + n.notaFinal, 0) / notas.length).toFixed(2))
    : 0;

  return {
    alumno,
    idAlumno: idAlumnoInt,
    cursos,
    notas,
    resumen: {
      promedioGeneral,
      totalCursos: notas.length,
      cursosAprobados: aprobados.length,
      cursosReprobados: reprobados.length,
      creditosAprobados: aprobados.reduce((a, n) => a + n.creditos, 0),
    },
  };
}

// Solvencia Grupo 6
export async function obtenerSolvenciaPagos(origin, carnet) {
  try {
    const [solv, mora] = await Promise.all([
      fetchApi(`${origin}${API_BASE.SOLVENCIA}/${encodeURIComponent(carnet)}`),
      fetchApi(`${origin}${API_BASE.MORA}/${encodeURIComponent(carnet)}`)
    ]);

    const montoPendiente = parseMoney(mora?.total_pendiente || 0) + parseMoney(mora?.total_mora || 0);
    
    return {
      solvente: solv?.solvente === true && mora?.en_mora !== true,
      montoPendiente,
      mensualidadesPendientes: solv?.mensualidades_pendientes || mora?.detalle?.length || 0,
      matriculaActiva: solv?.matricula_activa === true,
      enMora: mora?.en_mora === true,
      pagosPendientes: mora?.detalle || [],
    };
  } catch (e) {
    console.warn("Error solvencia:", e);
    return { solvente: true, montoPendiente: 0, mensualidadesPendientes: 0, enMora: false, pagosPendientes: [] };
  }
}