import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET() {
    const client = await pool.connect()
    try {
        const { rows } = await client.query(
            `SELECT COALESCE(MAX(id_mensualidad), 0) + 1 AS next_id FROM grupo6_pago_alumnos.mensualidad`
        )
        return NextResponse.json({ next_id: rows[0].next_id })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}