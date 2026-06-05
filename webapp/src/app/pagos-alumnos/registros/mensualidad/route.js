import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function POST(req) {
    const client = await pool.connect()
    try {
        const { carnet, mes, forma_pago, fecha_limite, precio, estado_pago, dias_mora, monto_mora } = await req.json()

        if (!carnet || !mes || !forma_pago || !fecha_limite || !precio) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
        }

        const { rows: formas } = await client.query(
            `SELECT id_forma_pago FROM grupo6_pago_alumnos.forma_pago WHERE LOWER(nombre) = LOWER($1)`,
            [forma_pago]
        )
        if (formas.length === 0) {
            return NextResponse.json({ error: `Forma de pago "${forma_pago}" no existe.` }, { status: 400 })
        }
        const id_forma_pago = formas[0].id_forma_pago

        const diasMora  = parseInt(dias_mora) || 0
        const montoMora = diasMora > 5 ? Math.min((diasMora - 5) * 10, 260) : parseFloat(monto_mora) || 0
        const estadoPago = estado_pago || 'Pendiente'
        const fechaPago  = estadoPago === 'Pagado' ? new Date().toISOString().split('T')[0] : null

        const { rows } = await client.query(
            `INSERT INTO grupo6_pago_alumnos.mensualidad
             (carnet, mes, fecha_pago, fecha_limite, precio, id_forma_pago, estado_pago, monto_mora, dias_mora)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id_mensualidad`,
            [carnet, mes, fechaPago, fecha_limite, parseFloat(precio), id_forma_pago, estadoPago, montoMora, diasMora]
        )

        const id_mensualidad = rows[0].id_mensualidad

        if (estadoPago === 'Pagado') {
            await client.query(
                `INSERT INTO grupo6_pago_alumnos.recibos
                 (carnet, id_referencia, tipo_referencia, monto_total, estado_validacion)
                 VALUES ($1, $2, 'Mensualidad', $3, 'Emitido')`,
                [carnet, id_mensualidad, parseFloat(precio) + montoMora]
            )
        }

        const estadoSolvencia = estadoPago === 'Pagado' ? 'Solvente' : 'No Solvente'
        await client.query(
            `INSERT INTO grupo6_pago_alumnos.solvenciamensual (id_mensualidad, estado) VALUES ($1, $2)`,
            [id_mensualidad, estadoSolvencia]
        )

        return NextResponse.json({ ok: true, id_mensualidad }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}
