/**
 * Sincroniza parqueo_user_id en Alumno, CatedraticoAcademico y usuario (laboratorios)
 * haciendo match por email con grupo5_parqueo.User.
 * Es idempotente — si ya tiene parqueo_user_id lo salta.
 */
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Cargar todos los Users de parqueo indexados por email
    const { rows: parqueoUsers } = await client.query(
      'SELECT id, email FROM grupo5_parqueo."User"'
    );
    const byEmail = Object.fromEntries(parqueoUsers.map(u => [u.email.toLowerCase(), u.id]));
    console.log(`Users en parqueo: ${parqueoUsers.length}`);

    // ── Alumnos ──────────────────────────────────────────────────
    const { rows: alumnos } = await client.query(
      'SELECT id, email, parqueo_user_id FROM grupo1_academico."Alumno" WHERE parqueo_user_id IS NULL'
    );
    let alumnosLinked = 0;
    for (const a of alumnos) {
      const uid = byEmail[a.email?.toLowerCase()];
      if (uid) {
        await client.query(
          'UPDATE grupo1_academico."Alumno" SET parqueo_user_id = $1 WHERE id = $2',
          [uid, a.id]
        );
        alumnosLinked++;
      }
    }
    console.log(`Alumnos enlazados: ${alumnosLinked} / ${alumnos.length}`);

    // ── Catedráticos ─────────────────────────────────────────────
    const { rows: catedraticos } = await client.query(
      'SELECT id, email, parqueo_user_id FROM grupo1_academico."CatedraticoAcademico" WHERE parqueo_user_id IS NULL'
    );
    let catedraticosLinked = 0;
    for (const c of catedraticos) {
      const uid = byEmail[c.email?.toLowerCase()];
      if (uid) {
        await client.query(
          'UPDATE grupo1_academico."CatedraticoAcademico" SET parqueo_user_id = $1 WHERE id = $2',
          [uid, c.id]
        );
        catedraticosLinked++;
      }
    }
    console.log(`Catedráticos enlazados: ${catedraticosLinked} / ${catedraticos.length}`);

    // ── Usuario (laboratorios) ────────────────────────────────────
    const { rows: usuarios } = await client.query(
      'SELECT id, correo, parqueo_user_id FROM grupo3_laboratorios.usuario WHERE parqueo_user_id IS NULL'
    );
    let usuariosLinked = 0;
    for (const u of usuarios) {
      const uid = byEmail[u.correo?.toLowerCase()];
      if (uid) {
        await client.query(
          'UPDATE grupo3_laboratorios.usuario SET parqueo_user_id = $1 WHERE id = $2',
          [uid, u.id]
        );
        usuariosLinked++;
      }
    }
    console.log(`Usuarios laboratorios enlazados: ${usuariosLinked} / ${usuarios.length}`);

    console.log('\n✅ Sincronización completada.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
