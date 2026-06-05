import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})
export async function POST(req) {
    const client = await pool.connect()
    try {
        const { carnet, concepto, monto } = await req.json()

        if (!carnet || !concepto || monto == null) {
            return NextResponse.json(
                { error: 'carnet, concepto y monto son requeridos' },
                { status: 400 }
            )
        }
        const { rows: alumno } = await client.query(
            `SELECT carnet
       FROM grupo1_academico."Alumno"
       WHERE carnet = $1`,
            [carnet]
        )
        if (alumno.length === 0) {
            return NextResponse.json(
                { error: 'Alumno no encontrado' },
                { status: 404 }
            )
        }
        const { rows } = await client.query(
            `
      INSERT INTO grupo6_pago_alumnos.deuda_externa
      (
          carnet,
          concepto,
          monto,
          estado,
          grupo_origen
      )
      VALUES
      (
          $1,
          $2,
          $3,
          'Pendiente',
          'Grupo 5 Parqueo'
      )
      RETURNING id_deuda
      `,
            [
                carnet,
                concepto,
                parseFloat(monto)
            ]
        )
        return NextResponse.json({
            ok: true,
            id_deuda: rows[0].id_deuda
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    } finally {
        client.release()
    }
}
