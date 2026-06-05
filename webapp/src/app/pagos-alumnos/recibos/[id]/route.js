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
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { error: 'ID de recibo requerido' },
                { status: 400 }
            )
        }

        const { rows } = await client.query(
            `
            SELECT
                r.id_recibo,
                r.carnet,
                r.id_referencia,
                r.tipo_referencia,
                TO_CHAR(r.fecha_emision, 'DD/MM/YYYY') AS fecha_emision,
                r.monto_total,
                r.estado_validacion,
                a.nombre,
                a.apellido
            FROM grupo6_pago_alumnos.recibos r
            LEFT JOIN grupo1_academico."Alumno" a
                ON a.carnet = r.carnet
            WHERE r.id_recibo = $1
            `,
            [id]
        )

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Recibo no encontrado' },
                { status: 404 }
            )
        }

        const recibo = rows[0]

        return NextResponse.json({
            recibo: recibo.id_recibo,
            carnet: recibo.carnet,
            nombre: recibo.nombre || '—',
            apellido: recibo.apellido || '—',
            id_referencia: recibo.id_referencia,
            tipo: recibo.tipo_referencia,
            fecha: recibo.fecha_emision,
            monto: Number(recibo.monto_total || 0),
            monto_formateado: formatoGT(recibo.monto_total),
            estado: recibo.estado_validacion,
        })

    } catch (err) {
        console.error('[recibo]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}