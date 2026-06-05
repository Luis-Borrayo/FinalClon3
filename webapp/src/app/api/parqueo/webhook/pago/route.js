import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})
export async function POST(req) {
    const client = await pool.connect()
    try {
        const { carnet, concepto, estado } = await req.json()

        if (!carnet || !concepto || !estado) {
            return NextResponse.json(
                { error: 'carnet, concepto y estado son requeridos' },
                { status: 400 }
            )
        }
        if (estado.toUpperCase() !== 'PAGADO') {
            return NextResponse.json(
                { error: 'Solo se procesan pagos con estado PAGADO' },
                { status: 400 }
            )
        }
        const { rows } = await client.query(
            `
            UPDATE grupo6_pago_alumnos.deuda_externa
            SET estado = 'Pagado'
            WHERE carnet = $1
              AND UPPER(concepto) = UPPER($2)
              AND estado = 'Pendiente'
            RETURNING 
                id_deuda,
                carnet,
                concepto,
                monto,
                estado,
                fecha_reporte,
                grupo_origen
            `,
            [carnet, concepto]
        )
        if (rows.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    message: 'No se encontró deuda pendiente para actualizar',
                    carnet,
                    concepto,
                    estado
                },
                { status: 404 }
            )
        }
        return NextResponse.json({
            ok: true,
            message: 'Webhook procesado correctamente. Deuda marcada como pagada.',
            actualizadas: rows.length,
            deudas: rows
        })
    } catch (err) {
        console.error('[webhook-parqueo-pago]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}