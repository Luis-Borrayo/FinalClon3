import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // ── Alumnos ──────────────────────────────────────────────────
    const { rows: alumnos } = await client.query(
      'SELECT id, carnet, password FROM grupo1_academico."Alumno" WHERE password IS NOT NULL'
    );
    console.log(`Alumnos con password: ${alumnos.length}`);

    let alumnosMigrados = 0;
    for (const alumno of alumnos) {
      // Si ya es bcrypt (empieza con $2b$ o $2a$), saltar
      if (alumno.password?.startsWith('$2')) {
        continue;
      }
      const hash = await bcrypt.hash(alumno.password, 10);
      await client.query(
        'UPDATE grupo1_academico."Alumno" SET password = $1 WHERE id = $2',
        [hash, alumno.id]
      );
      alumnosMigrados++;
    }
    console.log(`Alumnos migrados a bcrypt: ${alumnosMigrados}`);

    // ── Catedráticos ─────────────────────────────────────────────
    const { rows: catedraticos } = await client.query(
      'SELECT id, codigo, password FROM grupo1_academico."CatedraticoAcademico" WHERE password IS NOT NULL'
    );
    console.log(`Catedráticos con password: ${catedraticos.length}`);

    let catedraticosMigrados = 0;
    for (const c of catedraticos) {
      if (c.password?.startsWith('$2')) {
        continue;
      }
      const hash = await bcrypt.hash(c.password, 10);
      await client.query(
        'UPDATE grupo1_academico."CatedraticoAcademico" SET password = $1 WHERE id = $2',
        [hash, c.id]
      );
      catedraticosMigrados++;
    }
    console.log(`Catedráticos migrados a bcrypt: ${catedraticosMigrados}`);

    console.log('\n✅ Migración completada.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Error en migración:', e.message);
  process.exit(1);
});
