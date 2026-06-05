import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function POST(req) {
    const client = await pool.connect()

    try {
        const { carnet, motivo_pago, forma_pago, precio } = await req.json()

        if (!carnet || !motivo_pago || !forma_pago || precio == null) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
        }

        await client.query('BEGIN')

        const { rows: alumno } = await client.query(
            `SELECT carnet FROM grupo1_academico."Alumno" WHERE carnet = $1`,
            [carnet]
        )

        if (alumno.length === 0) {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: `El alumno con carnet ${carnet} no existe.` }, { status: 404 })
        }

        const { rows: formas } = await client.query(
            `SELECT id_forma_pago 
             FROM grupo6_pago_alumnos.forma_pago 
             WHERE LOWER(nombre) = LOWER($1)`,
            [forma_pago]
        )

        if (formas.length === 0) {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: `Forma de pago "${forma_pago}" no existe.` }, { status: 400 })
        }

        const id_forma_pago = formas[0].id_forma_pago

        const { rows } = await client.query(
            `INSERT INTO grupo6_pago_alumnos.pagos_varios
             (carnet, motivo_pago, monto, fecha_pago, id_forma_pago, estado)
             VALUES ($1, $2, $3, CURRENT_DATE, $4, 'Registrado')
             RETURNING id_pagos_varios`,
            [carnet, motivo_pago, parseFloat(precio), id_forma_pago]
        )

        const id_pagos_varios = rows[0].id_pagos_varios

        await client.query(
            `INSERT INTO grupo6_pago_alumnos.recibos
             (carnet, id_referencia, tipo_referencia, monto_total, estado_validacion)
             VALUES ($1, $2, 'PagoVario', $3, 'Emitido')`,
            [carnet, id_pagos_varios, parseFloat(precio)]
        )

        await client.query('COMMIT')

        return NextResponse.json({
            ok: true,
            id_pagos_varios,
        }, { status: 201 })

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[registro-varios]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}