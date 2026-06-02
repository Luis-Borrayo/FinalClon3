export const dynamic = 'force-dynamic';
import pg from 'pg';

export async function POST(request) {
  // Protección mínima con secret
  const { secret } = await request.json().catch(() => ({}));
  if (secret !== process.env.JWT_SECRET?.slice(0, 16)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const steps = [];

    // 1. Crear schema auth
    await client.query('CREATE SCHEMA IF NOT EXISTS auth');
    steps.push('CREATE SCHEMA auth ✓');

    // 2. Mover tabla User
    await client.query(`
      ALTER TABLE IF EXISTS grupo5_parqueo."User" SET SCHEMA auth
    `);
    steps.push('ALTER TABLE User SET SCHEMA auth ✓');

    // 3. Verificar
    const { rows } = await client.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE tablename = 'User'
    `);
    steps.push(`Verificación: User está en → ${rows.map(r => r.schemaname).join(', ')}`);

    await client.end();
    return Response.json({ ok: true, steps });
  } catch (e) {
    await client.end().catch(() => {});
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
