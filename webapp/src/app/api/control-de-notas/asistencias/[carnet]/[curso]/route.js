// src/app/api/control-de-notas/asistencias/[carnet]/[curso]/route.js

import { NextResponse } from "next/server";
import { getAsistenciasByCarnetYCurso } from "@/app/mocks/control-de-notas-mocks/mockService";

// ─── TODO: cuando la API real esté disponible ─────────────────────────────────
// import { getAsistenciasFromAPI } from "@/lib/control-de-notas/apiService";
// const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  try {
    const { carnet, curso } = await params;

    if (!carnet || !curso) {
      return NextResponse.json(
        { success: false, message: "El carnet y el curso son requeridos" },
        { status: 400 }
      );
    }

    const result = getAsistenciasByCarnetYCurso(carnet, curso);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Asistencias obtenidas correctamente",
        fuenteDatos: "MOCK",
        ...result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API asistencias] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}