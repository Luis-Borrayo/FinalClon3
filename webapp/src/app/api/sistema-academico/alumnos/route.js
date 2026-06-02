export const dynamic = 'force-dynamic';
import { enviarCorreoBienvenidaConQR } from "@/lib/email";
import prismaAcademico from "@/lib/prisma-academico";
import prismaAuth from "@/lib/prisma";   // search_path = auth, grupo5_parqueo → auth.User
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generarPasswordTemporal() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function normalizar(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function generarCorreoInstitucional(nombre, apellido) {
  const primerNombre   = normalizar(nombre.split(" ")[0]);
  const primerApellido = normalizar(apellido.split(" ")[0]);
  const base           = `${primerNombre}.${primerApellido}`;
  const dominio        = "alumno.uspg.edu.gt";

  const baseEmail = `${base}@${dominio}`;
  const existe = await prismaAcademico.alumno.findUnique({ where: { correoInstitucional: baseEmail } });
  if (!existe) return baseEmail;

  const similares = await prismaAcademico.alumno.findMany({
    where: { correoInstitucional: { startsWith: base } },
    select: { correoInstitucional: true },
  });
  const sufijos = similares
    .map(a => { const m = a.correoInstitucional?.match(new RegExp(`^${base}(\\d+)@`)); return m ? parseInt(m[1]) : 1; })
    .filter(n => !isNaN(n));
  const maxSufijo = sufijos.length > 0 ? Math.max(...sufijos) : 1;
  return `${base}${String(maxSufijo + 1).padStart(2, "0")}@${dominio}`;
}

async function generarCarnetAutomatico() {
  const ultimo = await prismaAcademico.alumno.findFirst({
    where: { carnet: { startsWith: "260" } },
    orderBy: { carnet: "desc" },
    select: { carnet: true },
  });
  if (!ultimo) return "2600001";
  return `260${String(parseInt(ultimo.carnet.slice(3)) + 1).padStart(4, "0")}`;
}

export async function GET() {
  try {
    const alumnos = await prismaAcademico.alumno.findMany({
      include: { asignaciones: true, carrera: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: alumnos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let authUserId = null;

  try {
    const body = await request.json();
    const { nombre, apellido, email, carreraId, autoCarnet } = body;

    if (!nombre || !apellido || !email) {
      return Response.json(
        { success: false, error: "nombre, apellido y email personal son requeridos" },
        { status: 400 }
      );
    }

    // ── Carnet ─────────────────────────────────────────────────────
    let carnet;
    if (autoCarnet) {
      carnet = await generarCarnetAutomatico();
    } else {
      if (!body.carnet) return Response.json({ success: false, error: "El carnet es requerido" }, { status: 400 });
      carnet = body.carnet.trim();
    }

    const existeCarnet = await prismaAcademico.alumno.findUnique({ where: { carnet } });
    if (existeCarnet) return Response.json({ success: false, error: `El carnet ${carnet} ya está registrado` }, { status: 409 });

    const existeEmail = await prismaAcademico.alumno.findUnique({ where: { email } });
    if (existeEmail) return Response.json({ success: false, error: `El correo personal ${email} ya está registrado` }, { status: 409 });

    // ── Credenciales ───────────────────────────────────────────────
    const correoInstitucional = autoCarnet ? await generarCorreoInstitucional(nombre, apellido) : null;
    const passwordTemporal    = autoCarnet ? generarPasswordTemporal() : null;
    const passwordHash        = passwordTemporal ? await bcrypt.hash(passwordTemporal, 10) : null;

    // ── PASO 1: crear auth.User ────────────────────────────────────
    // El correo institucional es el login unificado del ecosistema.
    // Si no hay correo institucional (alumno existente), usamos el personal.
    const authEmail = correoInstitucional ?? email;

    const authUser = await prismaAuth.user.create({
      data: {
        email:         authEmail,
        password_hash: passwordHash ?? await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10),
        role:          "STUDENT",
        first_name:    nombre,
        last_name:     apellido,
        carnet,
        qr_code:       crypto.randomUUID(),
        is_active:     true,
      },
    });
    authUserId = authUser.id;

    // ── PASO 2: crear grupo1_academico.Alumno enlazado a auth.User ─
    const alumno = await prismaAcademico.alumno.create({
      data: {
        carnet,
        nombre,
        apellido,
        email,
        correoInstitucional,
        password:        passwordHash,
        carreraId:       carreraId ?? null,
        parqueo_user_id: authUser.id,   // ← vínculo con auth.User
      },
    });

    // ── Correo de bienvenida ───────────────────────────────────────
    enviarCorreoBienvenidaConQR({
      nombre:              alumno.nombre,
      apellido:            alumno.apellido,
      email:               alumno.email,
      carnet:              alumno.carnet,
      correoInstitucional: alumno.correoInstitucional,
      passwordTemporal,
    }).catch(err => console.error("[email] Error enviando correo:", err.message));

    return Response.json(
      {
        success: true,
        data: { ...alumno, auth_user_id: authUser.id },
        message: `Alumno registrado con carnet ${alumno.carnet}${alumno.correoInstitucional ? ` — correo institucional: ${alumno.correoInstitucional}` : ""}. Identidad creada en auth.`,
      },
      { status: 201 }
    );

  } catch (error) {
    // ── Compensación: si el Alumno falló, borramos el auth.User ──
    // para no dejar identidades huérfanas en auth.
    if (authUserId) {
      await prismaAuth.user.delete({ where: { id: authUserId } }).catch(() => {});
    }
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
