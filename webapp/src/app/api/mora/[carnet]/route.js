import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET(req, { params }) {
    const { carnet } = await params
    const client = await pool.connect()
    try {
        const { rows: alumno } = await client.query(
            `SELECT carnet, nombre, apellido FROM grupo1_academico."Alumno" WHERE carnet = $1`,
            [carnet]
        )
        if (alumno.length === 0)
            return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

        const { rows: moras } = await client.query(
            `SELECT "Mes", "Estado_pago", "Precio", "Monto_mora", "Dias_mora", "Fecha_limite"
             FROM grupo6_pago_alumnos.mensualidad
             WHERE carnet = $1 AND "Estado_pago" IN ('Pendiente', 'Vencido', 'Parcial')
             ORDER BY "Fecha_limite" ASC`,
            [carnet]
        )

        const total_mora = moras.reduce((sum, m) => sum + parseFloat(m.Monto_mora || 0), 0)
        const total_pendiente = moras.reduce((sum, m) => sum + parseFloat(m.Precio || 0), 0)

        return NextResponse.json({
            carnet,
            nombre: alumno[0].nombre,
            apellido: alumno[0].apellido,
            en_mora: moras.length > 0,
            total_pendiente: total_pendiente.toFixed(2),
            total_mora: total_mora.toFixed(2),
            detalle: moras.map(m => ({
                mes: m.Mes,
                estado: m.Estado_pago,
                precio: m.Precio,
                mora: m.Monto_mora,
                dias_mora: m.Dias_mora,
                fecha_limite: m.Fecha_limite
            }))
        })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}