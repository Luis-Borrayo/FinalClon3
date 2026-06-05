import prisma from "@/lib/prisma";
import {
  crearError,
  obtenerCatalogos,
  buscarAlumnoPorCarnet,
  buscarCursoPorParametro,
  obtenerIdAlumno,
  obtenerIdCurso,
  obtenerCodigoCurso,
} from "@/app/api/control-de-notas/_lib/academico";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { carnet, curso } = await params;
    const origin = request.nextUrl.origin;

    if (!carnet || !curso) {
      return Response.json({ success: false, message: "Carnet y curso son requeridos" }, { status: 400 });
    }

    const { alumnos, cursos } = await obtenerCatalogos(origin);
    const alumno = buscarAlumnoPorCarnet(alumnos, carnet);

    if (!alumno) throw crearError(`No se encontró alumno con carnet ${carnet}`, 404);

    const cursoEncontrado = buscarCursoPorParametro(cursos, curso);
    if (!cursoEncontrado) throw crearError(`No se encontró curso ${curso}`, 404);

    const idAlumno = obtenerIdAlumno(alumno);
    const idCurso = obtenerIdCurso(cursoEncontrado);

    if (!idAlumno) throw crearError("El alumno no tiene un id válido", 400);
    if (!idCurso) throw crearError("El curso no tiene un id válido", 400);

    const matricula = await prisma.matricula.findFirst({
      where: { id_alumno: idAlumno, id_curso: idCurso },
      include: { asistencias: { orderBy: { fecha: "desc" } } },
      orderBy: [{ periodo: "desc" }, { fecha_registro: "desc" }],
    });

    if (!matricula) {
      return Response.json({
        success: true,
        alumno: { id: idAlumno, carnet: alumno.carnet },
        curso: {
          id: idCurso,
          codigo: obtenerCodigoCurso(cursoEncontrado, idCurso),
          nombre: cursoEncontrado.nombre,
        },
        asistencias: [],
        resumen: { total: 0, presentes: 0, ausentes: 0, porcentaje: 0 },
      });
    }

    const asistencias = matricula.asistencias.map((a) => ({
      id: a.id_asistencia,
      fecha: a.fecha,
      presente: a.presente,
      origen: a.origen,
    }));

    const total = asistencias.length;
    const presentes = asistencias.filter((a) => a.presente).length;
    const ausentes = total - presentes;
    const porcentaje = total > 0 ? Number(((presentes / total) * 100).toFixed(2)) : 0;

    return Response.json({
      success: true,
      alumno: { id: idAlumno, carnet: alumno.carnet },
      curso: {
        id: idCurso,
        codigo: obtenerCodigoCurso(cursoEncontrado, idCurso),
        nombre: cursoEncontrado.nombre,
      },
      periodo: matricula.periodo,
      asistencias,
      resumen: { total, presentes, ausentes, porcentaje },
    });
  } catch (error) {
    console.error("[GET_ASISTENCIAS_ALUMNO]", error);
    return Response.json(
      {
        success: false,
        message: error.message || "Error obteniendo asistencias",
        error: error.message,
      },
      { status: error.status || 500 }
    );
  }
}