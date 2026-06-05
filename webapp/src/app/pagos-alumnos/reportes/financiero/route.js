import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

function formatoGT(valor) {
    const numero = Number(valor || 0)

    return `Q${numero.toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

export async function GET() {
    const client = await pool.connect()

    try {
        const ingresosPorMesQuery = `
            WITH pagos AS (
                SELECT fecha_pago AS fecha, precio AS monto
                FROM grupo6_pago_alumnos.matricula
                WHERE fecha_pago IS NOT NULL

                UNION ALL

                SELECT fecha_pago AS fecha, precio + monto_mora AS monto
                FROM grupo6_pago_alumnos.mensualidad
                WHERE fecha_pago IS NOT NULL

                UNION ALL

                SELECT fecha_pago AS fecha, monto AS monto
                FROM grupo6_pago_alumnos.pagos_varios
                WHERE fecha_pago IS NOT NULL
                  AND estado = 'Registrado'
            )
            SELECT
                TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') AS mes,
                SUM(monto) AS total
            FROM pagos
            GROUP BY DATE_TRUNC('month', fecha)
            ORDER BY DATE_TRUNC('month', fecha)
        `

        const ingresosPorFormaPagoQuery = `
            WITH pagos AS (
                SELECT fp.nombre AS forma_pago, m.precio AS monto
                FROM grupo6_pago_alumnos.matricula m
                JOIN grupo6_pago_alumnos.forma_pago fp
                    ON fp.id_forma_pago = m.id_forma_pago
                WHERE m.fecha_pago IS NOT NULL

                UNION ALL

                SELECT fp.nombre AS forma_pago, ms.precio + ms.monto_mora AS monto
                FROM grupo6_pago_alumnos.mensualidad ms
                JOIN grupo6_pago_alumnos.forma_pago fp
                    ON fp.id_forma_pago = ms.id_forma_pago
                WHERE ms.fecha_pago IS NOT NULL

                UNION ALL

                SELECT fp.nombre AS forma_pago, pv.monto AS monto
                FROM grupo6_pago_alumnos.pagos_varios pv
                JOIN grupo6_pago_alumnos.forma_pago fp
                    ON fp.id_forma_pago = pv.id_forma_pago
                WHERE pv.fecha_pago IS NOT NULL
                  AND pv.estado = 'Registrado'
            )
            SELECT
                forma_pago,
                COUNT(*) AS cantidad,
                SUM(monto) AS total
            FROM pagos
            GROUP BY forma_pago
            ORDER BY total DESC
        `

        const resumenQuery = `
            SELECT
                COALESCE((
                    SELECT SUM(precio)
                    FROM grupo6_pago_alumnos.matricula
                    WHERE fecha_pago IS NOT NULL
                ), 0)
                +
                COALESCE((
                    SELECT SUM(precio + monto_mora)
                    FROM grupo6_pago_alumnos.mensualidad
                    WHERE fecha_pago IS NOT NULL
                ), 0)
                +
                COALESCE((
                    SELECT SUM(monto)
                    FROM grupo6_pago_alumnos.pagos_varios
                    WHERE fecha_pago IS NOT NULL
                      AND estado = 'Registrado'
                ), 0) AS total_ingresos,

                COALESCE((
                    SELECT SUM(monto_mora)
                    FROM grupo6_pago_alumnos.mensualidad
                    WHERE estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
                ), 0) AS total_mora,

                (
                    SELECT COUNT(DISTINCT carnet)
                    FROM grupo6_pago_alumnos.mensualidad
                    WHERE estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
                ) AS alumnos_morosos,

                (
                    SELECT COUNT(*)
                    FROM grupo6_pago_alumnos.recibos
                    WHERE estado_validacion = 'Emitido'
                ) AS recibos_emitidos
        `

        const morosidadQuery = `
            SELECT
                estado_pago,
                COUNT(*) AS cantidad,
                SUM(precio + monto_mora) AS total_pendiente
            FROM grupo6_pago_alumnos.mensualidad
            WHERE estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
            GROUP BY estado_pago
            ORDER BY estado_pago
        `

        const [
            ingresosPorMes,
            ingresosPorFormaPago,
            resumen,
            morosidad,
        ] = await Promise.all([
            client.query(ingresosPorMesQuery),
            client.query(ingresosPorFormaPagoQuery),
            client.query(resumenQuery),
            client.query(morosidadQuery),
        ])

        const resumenData = resumen.rows[0]

        return NextResponse.json({
            resumen: {
                total_ingresos: Number(resumenData.total_ingresos || 0),
                total_ingresos_formateado: formatoGT(resumenData.total_ingresos),

                total_mora: Number(resumenData.total_mora || 0),
                total_mora_formateado: formatoGT(resumenData.total_mora),

                alumnos_morosos: Number(resumenData.alumnos_morosos || 0),
                recibos_emitidos: Number(resumenData.recibos_emitidos || 0),
            },

            ingresos_por_mes: ingresosPorMes.rows.map(row => ({
                mes: row.mes,
                total: Number(row.total || 0),
                total_formateado: formatoGT(row.total),
            })),

            ingresos_por_forma_pago: ingresosPorFormaPago.rows.map(row => ({
                forma_pago: row.forma_pago,
                cantidad: Number(row.cantidad || 0),
                total: Number(row.total || 0),
                total_formateado: formatoGT(row.total),
            })),

            morosidad: morosidad.rows.map(row => ({
                estado_pago: row.estado_pago,
                cantidad: Number(row.cantidad || 0),
                total_pendiente: Number(row.total_pendiente || 0),
                total_pendiente_formateado: formatoGT(row.total_pendiente),
            })),
        })

    } catch (err) {
        console.error('[reporte-financiero]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}