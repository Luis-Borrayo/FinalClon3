import { Pool } from 'pg'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

function formatoFecha() {
    return new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export async function GET(req, { params }) {
    const client = await pool.connect()

    try {
        const { carnet } = await params

        const { rows: alumnoRows } = await client.query(
            `
                SELECT carnet, nombre, apellido
                FROM grupo1_academico."Alumno"
                WHERE carnet = $1
            `,
            [carnet]
        )

        if (alumnoRows.length === 0) {
            return Response.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        const alumno = alumnoRows[0]

        const { rows: deudaRows } = await client.query(
            `
                SELECT
                    COALESCE(SUM(precio + monto_mora), 0) AS total_pendiente,
                    COUNT(*) FILTER (
                    WHERE estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
                ) AS cuotas_pendientes
                FROM grupo6_pago_alumnos.mensualidad
                WHERE carnet = $1
                  AND estado_pago IN ('Pendiente', 'Parcial', 'Vencido')
            `,
            [carnet]
        )

        const totalPendiente = Number(deudaRows[0].total_pendiente || 0)
        const cuotasPendientes = Number(deudaRows[0].cuotas_pendientes || 0)
        const solvente = totalPendiente === 0 && cuotasPendientes === 0

        if (!solvente) {
            return Response.json({
                error: 'No se puede generar constancia. El alumno no está solvente.',
                total_pendiente: totalPendiente,
                cuotas_pendientes: cuotasPendientes,
            }, { status: 400 })
        }

        const pdfDoc = await PDFDocument.create()

        const page = pdfDoc.addPage([612, 792])
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        page.drawText('UNIVERSIDAD SAN PABLO DE GUATEMALA', {
            x: 115,
            y: 735,
            size: 16,
            font: bold,
            color: rgb(0, 0, 0),
        })

        page.drawText('Sistema de Pagos Alumnos', {
            x: 220,
            y: 710,
            size: 12,
            font,
            color: rgb(0, 0, 0),
        })

        page.drawLine({
            start: { x: 60, y: 685 },
            end: { x: 552, y: 685 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        page.drawText('CONSTANCIA DE SOLVENCIA', {
            x: 180,
            y: 635,
            size: 18,
            font: bold,
            color: rgb(0, 0, 0),
        })

        const texto = `Por medio de la presente se hace constar que el estudiante ${alumno.nombre} ${alumno.apellido}, identificado con carnet ${alumno.carnet}, se encuentra solvente en sus obligaciones de pago registradas en el Sistema de Pagos Alumnos de la Universidad San Pablo de Guatemala.`

        const lineas = [
            `Por medio de la presente se hace constar que el estudiante`,
            `${alumno.nombre} ${alumno.apellido}, identificado con carnet ${alumno.carnet},`,
            `se encuentra solvente en sus obligaciones de pago registradas`,
            `en el Sistema de Pagos Alumnos de la Universidad San Pablo`,
            `de Guatemala.`,
        ]

        let y = 575
        lineas.forEach((linea) => {
            page.drawText(linea, {
                x: 70,
                y,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            })
            y -= 22
        })

        page.drawText(`Estado: SOLVENTE`, {
            x: 70,
            y: 435,
            size: 12,
            font: bold,
            color: rgb(0, 0, 0),
        })

        page.drawText(`Fecha de emisión: ${formatoFecha()}`, {
            x: 70,
            y: 410,
            size: 12,
            font,
            color: rgb(0, 0, 0),
        })

        page.drawLine({
            start: { x: 205, y: 255 },
            end: { x: 407, y: 255 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        page.drawText('Departamento de Contabilidad', {
            x: 215,
            y: 235,
            size: 11,
            font,
            color: rgb(0, 0, 0),
        })

        page.drawText('Universidad San Pablo de Guatemala', {
            x: 198,
            y: 218,
            size: 11,
            font,
            color: rgb(0, 0, 0),
        })

        page.drawText('Documento generado electrónicamente', {
            x: 205,
            y: 80,
            size: 10,
            font,
            color: rgb(0.35, 0.35, 0.35),
        })

        const pdfBytes = await pdfDoc.save()

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="constancia-solvencia-${carnet}.pdf"`,
            },
        })

    } catch (err) {
        console.error('[constancia-solvencia]', err)
        return Response.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}