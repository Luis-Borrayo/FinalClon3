export const dynamic = 'force-dynamic';
import prismaAcademico from "@/lib/prisma-academico";
import prismaAuth from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET() {
  try {
    const catedraticos = await prismaAcademico.catedraticoAcademico.findMany({
      orderBy: { createdAt: "desc" },
      include: { horarios: { include: { curso: true } } },
    });
    return Response.json({ success: true, data: catedraticos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let authUserId = null;

  try {
    const body = await request.json();
    const { codigo, nombre, apellido, email } = body;

    if (!codigo || !nombre || !apellido || !email) {
      return Response.json(
        { success: false, error: "Todos los campos son requeridos: codigo, nombre, apellido, email" },
        { status: 400 }
      );
    }

    const existeCodigo = await prismaAcademico.catedraticoAcademico.findUnique({ where: { codigo } });
    if (existeCodigo) return Response.json({ success: false, error: `El código ${codigo} ya está registrado` }, { status: 409 });

    const existeEmail = await prismaAcademico.catedraticoAcademico.findUnique({ where: { email } });
    if (existeEmail) return Response.json({ success: false, error: `El email ${email} ya está registrado` }, { status: 409 });

    // ── PASO 1: crear auth.User ────────────────────────────────────
    const passwordTemporal = Array.from({ length: 8 }, () =>
      "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"[
        Math.floor(Math.random() * 54)
      ]
    ).join("");

    const authUser = await prismaAuth.user.create({
      data: {
        email,
        password_hash: await bcrypt.hash(passwordTemporal, 10),
        role:          "TEACHER",
        first_name:    nombre,
        last_name:     apellido,
        qr_code:       crypto.randomUUID(),
        is_active:     true,
      },
    });
    authUserId = authUser.id;

    // ── PASO 2: crear CatedraticoAcademico enlazado a auth.User ───
    const catedratico = await prismaAcademico.catedraticoAcademico.create({
      data: {
        codigo,
        nombre,
        apellido,
        email,
        parqueo_user_id: authUser.id,   // ← vínculo con auth.User
      },
    });

    return Response.json(
      { success: true, data: { ...catedratico, auth_user_id: authUser.id } },
      { status: 201 }
    );

  } catch (error) {
    // Compensación: borrar auth.User si el catedrático falló
    if (authUserId) {
      await prismaAuth.user.delete({ where: { id: authUserId } }).catch(() => {});
    }
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
