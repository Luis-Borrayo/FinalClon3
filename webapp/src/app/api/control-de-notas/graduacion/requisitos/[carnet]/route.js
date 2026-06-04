// src/app/api/control-de-notas/graduacion/requisitos/[carnet]/route.js

import { NextResponse } from "next/server";
import { getRequisitosGraduacion } from "@/app/mocks/control-de-notas-mocks/mockService";

// ─── TODO: cuando la API real esté disponible ─────────────────────────────────
// import { getRequisitosFromAPI } from "@/lib/control-de-notas/apiService";
// const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  try {
    const { carnet } = await params;

    if (!carnet) {
      return NextResponse.json(
        { success: false, message: "El carnet es requerido" },
        { status: 400 }
      );
    }

    const result = getRequisitosGraduacion(carnet);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Requisitos de graduación obtenidos correctamente",
        fuenteDatos: "MOCK",
        ...result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API graduacion] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}