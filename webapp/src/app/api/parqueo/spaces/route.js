import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const campus_id = searchParams.get('campus_id');

  try {
    const where = {};
    if (zone) where.zone = zone;
    if (type) where.type = type;
    if (status) where.status = status;
    if (campus_id) where.campus_id = campus_id;

    const spaces = await prisma.parkingSpace.findMany({
      where,
      include: { campus: true, sessions: { where: { status: 'ACTIVE' }, take: 1, include: { vehicle: true } } },
      orderBy: [{ zone: 'asc' }, { code: 'asc' }],
    });
    return res.ok(spaces);
  } catch (e) {
    return res.error(e.message);
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const dto = await request.json();
    const exists = await prisma.parkingSpace.findUnique({ where: { code: dto.code } });
    if (exists) return res.conflict('Código de espacio ya existe');
    const space = await prisma.parkingSpace.create({ data: dto });
    return res.created(space, 'Espacio creado');
  } catch (e) {
    return res.error(e.message);
  }
}
