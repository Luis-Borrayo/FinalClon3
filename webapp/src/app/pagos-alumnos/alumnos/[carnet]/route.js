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
        const { rows } = await client.query(
            `SELECT carnet, nombre, apellido FROM grupo1_academico."Alumno" WHERE carnet = $1`,
            [carnet]
        )
        if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
        return NextResponse.json(rows[0])
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}