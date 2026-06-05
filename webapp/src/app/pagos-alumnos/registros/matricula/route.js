import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function POST(req) {
    const client = await pool.connect()

    try {
        const { carnet, ciclo, anio, precio, forma_pago, fecha } = await req.json()

        if (!carnet || !ciclo || !anio || precio == null || !forma_pago || !fecha) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
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

        const { rows: existente } = await client.query(
            `SELECT id_matricula 
             FROM grupo6_pago_alumnos.matricula 
             WHERE carnet = $1 
               AND ciclo = $2 
               AND anio = $3`,
            [carnet, ciclo, parseInt(anio)]
        )

        if (existente.length > 0) {
            await client.query('ROLLBACK')
            return NextResponse.json(
                { error: `Ya existe matrícula para ${carnet} en ciclo ${ciclo} ${anio}` },
                { status: 409 }
            )
        }

        const { rows } = await client.query(
            `INSERT INTO grupo6_pago_alumnos.matricula
                 (carnet, ciclo, anio, fecha_pago, precio, id_forma_pago, estado)
             VALUES ($1, $2, $3, $4, $5, $6, 'Confirmado')
                 RETURNING id_matricula`,
            [carnet, ciclo, parseInt(anio), fecha, parseFloat(precio), id_forma_pago]
        )

        await client.query(
            `INSERT INTO grupo6_pago_alumnos.recibos
             (carnet, id_referencia, tipo_referencia, monto_total, estado_validacion)
             VALUES ($1, $2, 'Matricula', $3, 'Emitido')`,
            [carnet, rows[0].id_matricula, parseFloat(precio)]
        )

        await client.query('COMMIT')

        return NextResponse.json({
            ok: true,
            id_matricula: rows[0].id_matricula,
        }, { status: 201 })

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[registro-matricula]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}