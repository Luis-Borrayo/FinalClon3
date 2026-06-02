export const dynamic = 'force-dynamic';
import pg from 'pg';

// Token temporal de un solo uso — se borra este endpoint después
const TEMP_TOKEN = 'uspg-migrate-auth-2026';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('token') !== TEMP_TOKEN) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const steps = [];

    await client.query('CREATE SCHEMA IF NOT EXISTS auth');
    steps.push('CREATE SCHEMA auth ✓');

    await client.query(`ALTER TABLE IF EXISTS grupo5_parqueo."User" SET SCHEMA auth`);
    steps.push('User movida a auth ✓');

    const { rows } = await client.query(
      `SELECT schemaname FROM pg_tables WHERE tablename = 'User'`
    );
    steps.push(`User está en: ${rows.map(r => r.schemaname).join(', ')}`);

    await client.end();
    return Response.json({ ok: true, steps });
  } catch (e) {
    await client.end().catch(() => {});
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
