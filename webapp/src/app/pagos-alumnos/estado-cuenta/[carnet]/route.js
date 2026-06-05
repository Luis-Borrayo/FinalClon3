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

export async function GET(req, { params }) {
    const client = await pool.connect()

    try {
        const { carnet } = await params

        const { rows: alumnos } = await client.query(
            `
            SELECT carnet, nombre, apellido, "carreraId"
            FROM grupo1_academico."Alumno"
            WHERE carnet = $1
            `,
            [carnet]
        )

        if (alumnos.length === 0) {
            return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        const alumno = alumnos[0]

        const { rows: movimientos } = await client.query(
            `
            SELECT 
                'Matrícula' AS concepto,
                CONCAT('Ciclo ', ciclo, ' ', anio) AS mes,
                fecha_pago AS fecha_orden,
                TO_CHAR(fecha_pago, 'DD/MM/YYYY') AS fecha,
                precio AS monto_num,
                0::numeric AS mora_num,
                estado AS estado
            FROM grupo6_pago_alumnos.matricula
            WHERE carnet = $1

            UNION ALL

            SELECT
                'Mensualidad' AS concepto,
                mes,
                COALESCE(fecha_pago, fecha_limite) AS fecha_orden,
                COALESCE(TO_CHAR(fecha_pago, 'DD/MM/YYYY'), 'Pendiente') AS fecha,
                precio AS monto_num,
                monto_mora AS mora_num,
                estado_pago AS estado
            FROM grupo6_pago_alumnos.mensualidad
            WHERE carnet = $1

            UNION ALL

            SELECT
                'Pago Vario' AS concepto,
                motivo_pago AS mes,
                fecha_pago AS fecha_orden,
                TO_CHAR(fecha_pago, 'DD/MM/YYYY') AS fecha,
                monto AS monto_num,
                0::numeric AS mora_num,
                estado AS estado
            FROM grupo6_pago_alumnos.pagos_varios
            WHERE carnet = $1

            ORDER BY fecha_orden DESC
            `,
            [carnet]
        )

        let totalPagado = 0
        let totalPendiente = 0
        let totalMora = 0

        const movimientosFormateados = movimientos.map((mov) => {
            const monto = Number(mov.monto_num || 0)
            const mora = Number(mov.mora_num || 0)
            const estado = mov.estado || ''

            totalMora += mora

            if (['Confirmado', 'Pagado', 'Registrado'].includes(estado)) {
                totalPagado += monto + mora
            }

            if (['Pendiente', 'Parcial', 'Vencido'].includes(estado)) {
                totalPendiente += monto + mora
            }

            return {
                mes: mov.mes,
                concepto: mov.concepto,
                fecha: mov.fecha,
                monto: formatoGT(monto),
                mora: formatoGT(mora),
                estado,
            }
        })

        return NextResponse.json({
            carnet: alumno.carnet,
            nombres: alumno.nombre,
            apellidos: alumno.apellido,
            carrera: alumno.carreraId || '—',
            total_pagado: totalPagado,
            total_pendiente: totalPendiente,
            total_mora: totalMora,

            total_pagado_formateado: formatoGT(totalPagado),
            total_pendiente_formateado: formatoGT(totalPendiente),
            total_mora_formateado: formatoGT(totalMora),

            movimientos: movimientosFormateados,
        })

    } catch (err) {
        console.error('[estado-cuenta]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}