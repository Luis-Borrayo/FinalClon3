import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET() {
    const client = await pool.connect()
    try {
        const query = `
            WITH carnets_con_pago AS (
                SELECT carnet FROM grupo6_pago_alumnos.matricula
                WHERE DATE_TRUNC('month', "Fecha_pago") = DATE_TRUNC('month', CURRENT_DATE)
                UNION
                SELECT carnet FROM grupo6_pago_alumnos.mensualidad
                WHERE "Fecha_Pago" IS NOT NULL
                  AND DATE_TRUNC('month', "Fecha_Pago") = DATE_TRUNC('month', CURRENT_DATE)
                UNION
                SELECT carnet FROM grupo6_pago_alumnos.pagos_varios
                WHERE DATE_TRUNC('month', "Fecha_pago") = DATE_TRUNC('month', CURRENT_DATE)
                  AND "Estado" = 'Registrado'
            ),
                 deuda_pendiente AS (
                     SELECT carnet, COALESCE(SUM("Precio" + "Monto_mora"), 0) AS total_pendiente
                     FROM grupo6_pago_alumnos.mensualidad
                     WHERE "Estado_pago" IN ('Pendiente', 'Vencido', 'Parcial')
                     GROUP BY carnet
                 )
            SELECT
                ROW_NUMBER() OVER (ORDER BY a.apellido, a.nombre) AS no,
                a.carnet,
                a.nombre,
                a.apellido AS apellidos,
                '—' AS carrera,
                'Activo' AS estado,
                '—' AS forma,
                CASE
                    WHEN COALESCE(dp.total_pendiente, 0) = 0 THEN 'Q0'
                    ELSE CONCAT('Q', TO_CHAR(dp.total_pendiente, 'FM999,999,990.00'))
            END AS sin_pagar
            FROM grupo1_academico."Alumno" a
            LEFT JOIN deuda_pendiente dp ON dp.carnet = a.carnet
            WHERE a.carnet NOT IN (SELECT carnet FROM carnets_con_pago)
            ORDER BY a.apellido, a.nombre
        `
        const { rows } = await client.query(query)
        return NextResponse.json(rows)
    } catch (err) {
        console.error('[sin-pagos]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}