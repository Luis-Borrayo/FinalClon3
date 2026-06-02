export const dynamic = 'force-dynamic';
import { signAccess, signRefresh } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import prismaAcademico from '@/lib/prisma-academico';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Busca o crea un User en parqueo para un usuario académico.
// Retorna el UUID del User (fuente de verdad de IDs).
async function getOrCreateParqueoUser({ email, nombre, apellido, role }) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        first_name: nombre,
        last_name: apellido ?? '',
        password_hash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
        role,
        qr_code: crypto.randomUUID(),
        is_active: true,
      },
    });
  }
  return user;
}

export async function POST(request) {
  try {
    const { email, password, carnet } = await request.json();
    const identifier = email?.trim().toLowerCase() || carnet?.trim();

    if (!identifier || !password) {
      return Response.json({ success: false, error: 'Credenciales requeridas' }, { status: 400 });
    }

    // 1. Buscar en grupo5_parqueo.User (admin, seguridad, docentes, estudiantes parqueo)
    if (email) {
      const parqueoUser = await prisma.user.findUnique({ where: { email: identifier } });
      if (parqueoUser && parqueoUser.is_active && !parqueoUser.deleted_at) {
        const valid = await bcrypt.compare(password, parqueoUser.password_hash);
        if (valid) {
          await prisma.user.update({ where: { id: parqueoUser.id }, data: { last_login_at: new Date() } });
          const payload = { sub: parqueoUser.id, email: parqueoUser.email, name: `${parqueoUser.first_name} ${parqueoUser.last_name}`.trim(), role: parqueoUser.role, source: 'uspg' };
          return Response.json({
            success: true,
            data: {
              access_token: signAccess(payload),
              refresh_token: signRefresh(payload),
              user: {
                id: parqueoUser.id,
                email: parqueoUser.email,
                nombre: parqueoUser.first_name,
                apellido: parqueoUser.last_name,
                role: parqueoUser.role,
                source: 'uspg',
              },
            },
          });
        }
      }
    }

    // 2. Buscar en grupo1_academico.Alumno (por email o carnet)
    const alumno = await prismaAcademico.alumno.findFirst({
      where: email ? { email: identifier } : { carnet: identifier },
      include: { carrera: true },
    });
    if (alumno && alumno.password && await bcrypt.compare(password, alumno.password)) {
      const masterUser = await getOrCreateParqueoUser({
        email: alumno.email,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        role: 'STUDENT',
      });
      // Actualizar el parqueo_user_id si aún no está enlazado
      if (!alumno.parqueo_user_id) {
        await prismaAcademico.alumno.update({
          where: { id: alumno.id },
          data: { parqueo_user_id: masterUser.id },
        });
      }
      const payload = { sub: masterUser.id, email: alumno.email, name: `${alumno.nombre} ${alumno.apellido}`.trim(), role: 'STUDENT', source: 'uspg', carnet: alumno.carnet };
      return Response.json({
        success: true,
        data: {
          access_token: signAccess(payload),
          refresh_token: signRefresh(payload),
          user: {
            id: masterUser.id,
            email: alumno.email,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            carnet: alumno.carnet,
            carrera: alumno.carrera?.nombre ?? null,
            role: 'STUDENT',
            source: 'uspg',
          },
        },
      });
    }

    // 3. Buscar en grupo1_academico.CatedraticoAcademico
    if (email) {
      const catedratico = await prismaAcademico.catedraticoAcademico.findUnique({
        where: { email: identifier },
      });
      if (catedratico && catedratico.password && await bcrypt.compare(password, catedratico.password)) {
        const masterUser = await getOrCreateParqueoUser({
          email: catedratico.email,
          nombre: catedratico.nombre,
          apellido: catedratico.apellido,
          role: 'TEACHER',
        });
        if (!catedratico.parqueo_user_id) {
          await prismaAcademico.catedraticoAcademico.update({
            where: { id: catedratico.id },
            data: { parqueo_user_id: masterUser.id },
          });
        }
        const payload = { sub: masterUser.id, email: catedratico.email, name: `${catedratico.nombre} ${catedratico.apellido}`.trim(), role: 'TEACHER', source: 'uspg' };
        return Response.json({
          success: true,
          data: {
            access_token: signAccess(payload),
            refresh_token: signRefresh(payload),
            user: {
              id: masterUser.id,
              email: catedratico.email,
              nombre: catedratico.nombre,
              apellido: catedratico.apellido,
              codigo: catedratico.codigo,
              role: 'TEACHER',
              source: 'uspg',
            },
          },
        });
      }
    }

    return Response.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
