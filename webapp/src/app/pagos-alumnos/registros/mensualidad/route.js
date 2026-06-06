import { Pool } from 'pg'
import { NextResponse } from 'next/server'
import { registrarAuditoriaPago } from '@/lib/auditoria-pagos'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

function calcularMora(fechaLimite, estadoPago) {
    if (estadoPago === 'Pagado') {
        return {
            dias_mora: 0,
            monto_mora: 0,
            estado_pago: 'Pagado',
        }
    }

    const hoy = new Date()
    const limite = new Date(fechaLimite)

    hoy.setHours(0, 0, 0, 0)
    limite.setHours(0, 0, 0, 0)

    const diferenciaMs = hoy - limite
    const diasAtraso = Math.max(0, Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)))

    const montoMora = diasAtraso > 5
        ? Math.min((diasAtraso - 5) * 10, 260)
        : 0

    let estadoCalculado = estadoPago || 'Pendiente'

    if (estadoCalculado !== 'Parcial') {
        estadoCalculado = diasAtraso > 0 ? 'Vencido' : 'Pendiente'
    }

    return {
        dias_mora: diasAtraso,
        monto_mora: montoMora,
        estado_pago: estadoCalculado,
    }
}

export async function POST(req) {
    const client = await pool.connect()

    try {
        const {
            carnet,
            mes,
            forma_pago,
            fecha_limite,
            precio,
            estado_pago,
        } = await req.json()

        await registrarAuditoriaPago(client, {
            carnet,
            tipo_accion: 'REGISTRO',
            tipo_pago: 'PagoVario',
            id_referencia: id_pagos_varios,
            monto,
            usuario_responsable: 'sistema',
            descripcion: `Registro de pago varios: ${motivo_pago}`
        })

        if (!carnet || !mes || !forma_pago || !fecha_limite || precio == null) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
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
            `
            SELECT id_forma_pago
            FROM grupo6_pago_alumnos.forma_pago
            WHERE LOWER(nombre) = LOWER($1)
            `,
            [forma_pago]
        )

        if (formas.length === 0) {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: `Forma de pago "${forma_pago}" no existe.` }, { status: 400 })
        }

        const id_forma_pago = formas[0].id_forma_pago

        const mora = calcularMora(fecha_limite, estado_pago)

        const fechaPago = mora.estado_pago === 'Pagado'
            ? new Date().toISOString().split('T')[0]
            : null

        const { rows } = await client.query(
            `
            INSERT INTO grupo6_pago_alumnos.mensualidad
            (
                carnet,
                mes,
                fecha_pago,
                fecha_limite,
                precio,
                id_forma_pago,
                estado_pago,
                monto_mora,
                dias_mora
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_mensualidad
            `,
            [
                carnet,
                mes,
                fechaPago,
                fecha_limite,
                parseFloat(precio),
                id_forma_pago,
                mora.estado_pago,
                mora.monto_mora,
                mora.dias_mora,
            ]
        )

        const id_mensualidad = rows[0].id_mensualidad

        if (mora.estado_pago === 'Pagado') {
            await client.query(
                `
                INSERT INTO grupo6_pago_alumnos.recibos
                (
                    carnet,
                    id_referencia,
                    tipo_referencia,
                    monto_total,
                    estado_validacion
                )
                VALUES ($1, $2, 'Mensualidad', $3, 'Emitido')
                `,
                [carnet, id_mensualidad, parseFloat(precio) + mora.monto_mora]
            )
        }

        const estadoSolvencia = mora.estado_pago === 'Pagado'
            ? 'Solvente'
            : 'No Solvente'

        await client.query(
            `
            INSERT INTO grupo6_pago_alumnos.solvenciamensual
            (id_mensualidad, estado)
            VALUES ($1, $2)
            `,
            [id_mensualidad, estadoSolvencia]
        )

        await client.query('COMMIT')

        return NextResponse.json({
            ok: true,
            id_mensualidad,
            dias_mora: mora.dias_mora,
            monto_mora: mora.monto_mora,
            estado_pago: mora.estado_pago,
        }, { status: 201 })

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[registro-mensualidad]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}