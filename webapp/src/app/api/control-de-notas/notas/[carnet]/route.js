import {
  armarNotasAlumno,
  obtenerNombreAlumno,
  obtenerNombreCarrera,
} from "@/app/api/control-de-notas/_lib/academico";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { carnet } = await params;
    const origin = request.nextUrl.origin;

    if (!carnet) {
      return Response.json({ success: false, message: "El carnet es requerido" }, { status: 400 });
    }

    const { alumno, idAlumno, notas, resumen } = await armarNotasAlumno(origin, carnet);

    return Response.json({
      success: true,
      alumno: {
        id: idAlumno,
        carnet: alumno.carnet,
        nombre: obtenerNombreAlumno(alumno),
        email: alumno.email ?? null,
        correoInstitucional: alumno.correoInstitucional ?? null,
        carrera: obtenerNombreCarrera(alumno),
      },
      notas,
      resumen,
    });
  } catch (error) {
    console.error("[GET_NOTAS_ALUMNO]", error);
    return Response.json(
      {
        success: false,
        message: error.message || "Error obteniendo las notas del alumno",
        error: error.message,
      },
      { status: error.status || 500 }
    );
  }
}