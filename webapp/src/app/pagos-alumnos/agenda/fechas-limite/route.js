import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET() {
    const client = await pool.connect()
    try {
        const { rows } = await client.query(`
            -- Fechas límite de mensualidades pendientes
            SELECT
                TO_CHAR(m.fecha_limite, 'YYYY-MM-DD') AS fecha,
                'mensualidad' AS tipo,
                CONCAT('Mensualidad ', m.mes, ' — ', a.nombre, ' ', a.apellido) AS descripcion
            FROM grupo6_pago_alumnos.mensualidad m
            LEFT JOIN grupo1_academico."Alumno" a ON a.carnet = m.carnet
            WHERE m.fecha_limite IS NOT NULL
              AND m.estado_pago IN ('Pendiente', 'Vencido', 'Parcial')

            UNION ALL

            -- Fechas de matrículas del ciclo actual
            SELECT
                TO_CHAR(mat.fecha_pago, 'YYYY-MM-DD') AS fecha,
                'matricula' AS tipo,
                CONCAT('Matrícula ', mat.ciclo, ' ', mat.anio, ' — ', a.nombre, ' ', a.apellido) AS descripcion
            FROM grupo6_pago_alumnos.matricula mat
            LEFT JOIN grupo1_academico."Alumno" a ON a.carnet = mat.carnet
            WHERE mat.anio = EXTRACT(YEAR FROM CURRENT_DATE)

            ORDER BY fecha ASC
        `)
        return NextResponse.json(rows)
    } catch (err) {
        console.error('[agenda/fechas-limite]', err)
        return NextResponse.json([], { status: 200 })
    } finally {
        client.release()
    }
}
