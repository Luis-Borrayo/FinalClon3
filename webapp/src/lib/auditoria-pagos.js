import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
    },
})

export async function registrarAuditoriaPago({
                                                 carnet,
                                                 tipo_accion,
                                                 tipo_pago,
                                                 id_referencia,
                                                 monto,
                                                 usuario_responsable = 'sistema',
                                                 descripcion,
                                             }) {

    const client = await pool.connect()

    try {

        await client.query(
            `
            INSERT INTO grupo6_pago_alumnos.auditoria_pagos
            (
                carnet,
                tipo_accion,
                tipo_pago,
                id_referencia,
                monto,
                usuario_responsable,
                descripcion
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7
            )
            `,
            [
                carnet,
                tipo_accion,
                tipo_pago,
                id_referencia,
                monto,
                usuario_responsable,
                descripcion
            ]
        )

    } finally {
        client.release()
    }
}