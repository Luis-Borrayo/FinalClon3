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
            WITH ingresos_mes AS (

                SELECT COALESCE(SUM(precio),0) AS total
                FROM grupo6_pago_alumnos.matricula
                WHERE DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT COALESCE(SUM(precio + monto_mora),0) AS total
                FROM grupo6_pago_alumnos.mensualidad
                WHERE fecha_pago IS NOT NULL
                  AND DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT COALESCE(SUM(monto),0) AS total
                FROM grupo6_pago_alumnos.pagos_varios
                WHERE DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)
                  AND estado = 'Registrado'
            ),

            pagos_registrados AS (

                SELECT COUNT(*) cantidad
                FROM grupo6_pago_alumnos.matricula
                WHERE DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT COUNT(*)
                FROM grupo6_pago_alumnos.mensualidad
                WHERE fecha_pago IS NOT NULL
                  AND DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT COUNT(*)
                FROM grupo6_pago_alumnos.pagos_varios
                WHERE DATE_TRUNC('month', fecha_pago) =
                      DATE_TRUNC('month', CURRENT_DATE)
                  AND estado = 'Registrado'
            )

            SELECT
                (SELECT SUM(total) FROM ingresos_mes) AS ingresos_mes,

                (SELECT SUM(cantidad)
                 FROM pagos_registrados) AS pagos_registrados,

                (
                    SELECT COUNT(DISTINCT carnet)
                    FROM grupo6_pago_alumnos.mensualidad
                    WHERE estado_pago IN
                    ('Pendiente','Parcial','Vencido')
                ) AS alumnos_mora
        `

        const { rows } = await client.query(query)

        const dashboard = rows[0]

        return NextResponse.json({
            ingresos_mes: Number(dashboard.ingresos_mes || 0),
            pagos_registrados: Number(dashboard.pagos_registrados || 0),
            alumnos_mora: Number(dashboard.alumnos_mora || 0),

            ingresos_mes_formateado:
                `Q${Number(dashboard.ingresos_mes || 0).toLocaleString('es-GT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`
        })

    } catch (err) {

        console.error('[dashboard]', err)

        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )

    } finally {
        client.release()
    }
}