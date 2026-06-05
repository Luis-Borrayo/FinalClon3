// Endpoint de solvencia
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

export async function GET(req, { params }) {
    const client = await pool.connect()

    try {
        const { carnet } = await params

        if (!carnet) {
            return NextResponse.json(
                { error: 'Carnet requerido' },
                { status: 400 }
            )
        }

        const { rows: alumnoRows } = await client.query(
            `
            SELECT carnet, nombre, apellido
            FROM grupo1_academico."Alumno"
            WHERE carnet = $1
            `,
            [carnet]
        )

        if (alumnoRows.length === 0) {
            return NextResponse.json(
                { error: 'Alumno no encontrado' },
                { status: 404 }
            )
        }

        const alumno = alumnoRows[0]

        const { rows: deudaRows } = await client.query(
            `
            SELECT
                COALESCE(SUM(precio + monto_mora), 0) AS total_pendiente,
                COALESCE(SUM(monto_mora), 0) AS total_mora,
                COUNT(*) FILTER (
                    WHERE estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
                ) AS cuotas_pendientes
            FROM grupo6_pago_alumnos.mensualidad
            WHERE carnet = $1
              AND estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
            `,
            [carnet]
        )

        const { rows: matriculaRows } = await client.query(
            `
            SELECT COUNT(*) AS total_matriculas
            FROM grupo6_pago_alumnos.matricula
            WHERE carnet = $1
              AND estado = 'Confirmado'
            `,
            [carnet]
        )

        const totalPendiente = Number(deudaRows[0].total_pendiente || 0)
        const totalMora = Number(deudaRows[0].total_mora || 0)
        const cuotasPendientes = Number(deudaRows[0].cuotas_pendientes || 0)
        const totalMatriculas = Number(matriculaRows[0].total_matriculas || 0)

        const tieneMatricula = totalMatriculas > 0
        const solvente = totalPendiente === 0 && cuotasPendientes === 0 && tieneMatricula

        let motivo = 'Alumno solvente'

        if (!tieneMatricula) {
            motivo = 'El alumno no tiene matrícula confirmada'
        } else if (cuotasPendientes > 0) {
            motivo = 'El alumno tiene mensualidades pendientes o vencidas'
        }

        return NextResponse.json({
            carnet: alumno.carnet,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            solvente,
            motivo,
            tiene_matricula: tieneMatricula,
            cuotas_pendientes: cuotasPendientes,
            total_pendiente: totalPendiente,
            total_mora: totalMora,
            total_pendiente_formateado: `Q${totalPendiente.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`,
            total_mora_formateado: `Q${totalMora.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`,
        })

    } catch (err) {
        console.error('[solvencia]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}