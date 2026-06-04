// src/app/api/control-de-notas/notas/[carnet]/solvencia-estado/route.js
import { NextResponse } from "next/server";
import { getSolvenciaEstado } from "@/app/mocks/control-de-notas-mocks/mockService";

export async function GET(request, { params }) {
  try {
    const { carnet } = await params;
    if (!carnet) {
      return NextResponse.json(
        { success: false, message: "El carnet es requerido" },
        { status: 400 }
      );
    }
    const result = getSolvenciaEstado(carnet);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Estado de solvencia obtenido", fuenteDatos: "MOCK", ...result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API solvencia-estado] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
