import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
    },
})

export async function GET() {

    const client = await pool.connect()

    try {

        const { rows } = await client.query(`
            SELECT *
            FROM grupo6_pago_alumnos.auditoria_pagos
            ORDER BY fecha_hora DESC
            LIMIT 500
        `)

        return NextResponse.json(rows)

    } catch (err) {

        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )

    } finally {
        client.release()
    }
}