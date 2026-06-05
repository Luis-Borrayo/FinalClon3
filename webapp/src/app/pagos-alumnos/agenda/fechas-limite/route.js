import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET() {
    const client = await pool.connect()

    try {
        const { rows } = await client.query(
            `
            SELECT
                fecha_limite::text AS fecha,
                'mensualidad' AS tipo,
                CONCAT('Mensualidad ', mes, ' - ', carnet) AS descripcion
            FROM grupo6_pago_alumnos.mensualidad
            WHERE fecha_limite IS NOT NULL

            UNION ALL

            SELECT
                fecha_pago::text AS fecha,
                'matricula' AS tipo,
                CONCAT('Matrícula ciclo ', ciclo, ' - ', carnet) AS descripcion
            FROM grupo6_pago_alumnos.matricula
            WHERE fecha_pago IS NOT NULL

            ORDER BY fecha ASC
            `
        )

        return NextResponse.json(rows)
    } catch (err) {
        console.error('[agenda-fechas-limite]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}