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
            WITH pagos_mes AS (
                SELECT m.carnet, fp."Nombre" AS forma_pago, 'Matricula' AS concepto,
                       CONCAT('Matrícula ciclo ', m."Ciclo", ' ', m."Anio") AS descripcion,
                       m."Fecha_pago" AS fecha, m."Precio" AS monto, m.id_matricula AS id_ref
                FROM grupo6_pago_alumnos.matricula m
                         JOIN grupo6_pago_alumnos.forma_pago fp ON fp.id_forma_pago = m.id_forma_pago
                WHERE DATE_TRUNC('month', m."Fecha_pago") = DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT ms.carnet, fp."Nombre" AS forma_pago, 'Mensualidad' AS concepto,
                       CONCAT('Mensualidad de ', ms."Mes") AS descripcion,
                       ms."Fecha_Pago" AS fecha, ms."Precio" AS monto, ms.id_mensualidad AS id_ref
                FROM grupo6_pago_alumnos.mensualidad ms
                         JOIN grupo6_pago_alumnos.forma_pago fp ON fp.id_forma_pago = ms.id_forma_pago
                WHERE ms."Fecha_Pago" IS NOT NULL
                  AND DATE_TRUNC('month', ms."Fecha_Pago") = DATE_TRUNC('month', CURRENT_DATE)

                UNION ALL

                SELECT pv.carnet, fp."Nombre" AS forma_pago, 'Pago Varios' AS concepto,
                       pv."Motivo_pago" AS descripcion,
                       pv."Fecha_pago" AS fecha, pv.monto AS monto, pv.id_pagos_varios AS id_ref
                FROM grupo6_pago_alumnos.pagos_varios pv
                         JOIN grupo6_pago_alumnos.forma_pago fp ON fp.id_forma_pago = pv.id_forma_pago
                WHERE DATE_TRUNC('month', pv."Fecha_pago") = DATE_TRUNC('month', CURRENT_DATE)
                  AND pv."Estado" = 'Registrado'
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY pm.fecha, pm.carnet) AS no,
                pm.carnet,
                COALESCE(a.nombre, '—') AS nombre,
                COALESCE(a.apellido, '—') AS apellidos,
                pm.forma_pago AS forma,
                pm.concepto,
                pm.descripcion,
                TO_CHAR(pm.fecha, 'DD/MM/YYYY') AS fecha,
                CONCAT('Q', TO_CHAR(pm.monto, 'FM999,999,990.00')) AS monto,
                pm.id_ref
            FROM pagos_mes pm
                LEFT JOIN grupo1_academico."Alumno" a ON a.carnet = pm.carnet
            ORDER BY pm.fecha DESC, pm.carnet
        `
        const { rows } = await client.query(query)
        return NextResponse.json(rows)
    } catch (err) {
        console.error('[con-pagos]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}