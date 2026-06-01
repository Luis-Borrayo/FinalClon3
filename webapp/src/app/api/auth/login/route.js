export const dynamic = 'force-dynamic';
import { signAccess, signRefresh } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import prismaAcademico from '@/lib/prisma-academico';
import bcrypt from 'bcryptjs';

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
          const payload = { sub: parqueoUser.id, email: parqueoUser.email, role: parqueoUser.role, source: 'parqueo' };
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
                source: 'parqueo',
              },
            },
          });
        }
      }
    }

    // 2. Buscar en grupo1_academico.Alumno (por email o carnet)
    const alumno = await prismaAcademico.alumno.findFirst({
      where: email
        ? { email: identifier }
        : { carnet: identifier },
      include: { carrera: true },
    });
    if (alumno && alumno.password === password) {
      const payload = { sub: String(alumno.id), email: alumno.email, role: 'STUDENT', source: 'academico' };
      return Response.json({
        success: true,
        data: {
          access_token: signAccess(payload),
          refresh_token: signRefresh(payload),
          user: {
            id: alumno.id,
            email: alumno.email,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            carnet: alumno.carnet,
            carrera: alumno.carrera?.nombre ?? null,
            role: 'STUDENT',
            source: 'academico',
          },
        },
      });
    }

    // 3. Buscar en grupo1_academico.CatedraticoAcademico
    if (email) {
      const catedratico = await prismaAcademico.catedraticoAcademico.findUnique({
        where: { email: identifier },
      });
      if (catedratico && catedratico.password === password) {
        const payload = { sub: String(catedratico.id), email: catedratico.email, role: 'TEACHER', source: 'academico' };
        return Response.json({
          success: true,
          data: {
            access_token: signAccess(payload),
            refresh_token: signRefresh(payload),
            user: {
              id: catedratico.id,
              email: catedratico.email,
              nombre: catedratico.nombre,
              apellido: catedratico.apellido,
              codigo: catedratico.codigo,
              role: 'TEACHER',
              source: 'academico',
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
