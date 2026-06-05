import { Pool } from 'pg'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
})

function formatoGT(valor) {
    const numero = Number(valor || 0)
    return `Q${numero.toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

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

        const { rows: alumnos } = await client.query(
            `
            SELECT carnet, nombre, apellido, "carreraId"
            FROM grupo1_academico."Alumno"
            WHERE carnet = $1
            `,
            [carnet]
        )

        if (alumnos.length === 0) {
            return Response.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        const alumno = alumnos[0]

        const { rows: movimientos } = await client.query(
            `
            SELECT 
                'Matrícula' AS concepto,
                CONCAT('Ciclo ', ciclo, ' ', anio) AS descripcion,
                fecha_pago AS fecha_orden,
                TO_CHAR(fecha_pago, 'DD/MM/YYYY') AS fecha,
                precio AS monto,
                0::numeric AS mora,
                estado AS estado
            FROM grupo6_pago_alumnos.matricula
            WHERE carnet = $1

            UNION ALL

            SELECT
                'Mensualidad' AS concepto,
                mes AS descripcion,
                COALESCE(fecha_pago, fecha_limite) AS fecha_orden,
                COALESCE(TO_CHAR(fecha_pago, 'DD/MM/YYYY'), 'Pendiente') AS fecha,
                precio AS monto,
                monto_mora AS mora,
                estado_pago AS estado
            FROM grupo6_pago_alumnos.mensualidad
            WHERE carnet = $1

            UNION ALL

            SELECT
                'Pago Vario' AS concepto,
                motivo_pago AS descripcion,
                fecha_pago AS fecha_orden,
                TO_CHAR(fecha_pago, 'DD/MM/YYYY') AS fecha,
                monto AS monto,
                0::numeric AS mora,
                estado AS estado
            FROM grupo6_pago_alumnos.pagos_varios
            WHERE carnet = $1

            ORDER BY fecha_orden DESC
            `,
            [carnet]
        )

        let totalPagado = 0
        let totalPendiente = 0
        let totalMora = 0

        movimientos.forEach((m) => {
            const monto = Number(m.monto || 0)
            const mora = Number(m.mora || 0)
            totalMora += mora

            if (['Confirmado', 'Pagado', 'Registrado'].includes(m.estado)) {
                totalPagado += monto + mora
            }

            if (['Pendiente', 'Parcial', 'Vencido'].includes(m.estado)) {
                totalPendiente += monto + mora
            }
        })

        const pdfDoc = await PDFDocument.create()
        let page = pdfDoc.addPage([612, 792])

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const drawHeader = () => {
            page.drawText('UNIVERSIDAD SAN PABLO DE GUATEMALA', {
                x: 115,
                y: 735,
                size: 16,
                font: bold,
                color: rgb(0, 0, 0),
            })

            page.drawText('Estado de Cuenta - Sistema de Pagos Alumnos', {
                x: 160,
                y: 710,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            })

            page.drawLine({
                start: { x: 50, y: 690 },
                end: { x: 562, y: 690 },
                thickness: 1,
                color: rgb(0, 0, 0),
            })
        }

        drawHeader()

        page.drawText('ESTADO DE CUENTA', {
            x: 210,
            y: 650,
            size: 18,
            font: bold,
            color: rgb(0, 0, 0),
        })

        page.drawText(`Alumno: ${alumno.nombre} ${alumno.apellido}`, {
            x: 60,
            y: 610,
            size: 11,
            font,
        })

        page.drawText(`Carnet: ${alumno.carnet}`, {
            x: 60,
            y: 590,
            size: 11,
            font,
        })

        page.drawText(`Carrera: ${alumno.carreraId || '—'}`, {
            x: 60,
            y: 570,
            size: 11,
            font,
        })

        page.drawText(`Fecha de emisión: ${formatoFecha()}`, {
            x: 60,
            y: 550,
            size: 11,
            font,
        })

        page.drawText(`Total pagado: ${formatoGT(totalPagado)}`, {
            x: 360,
            y: 610,
            size: 11,
            font: bold,
        })

        page.drawText(`Total pendiente: ${formatoGT(totalPendiente)}`, {
            x: 360,
            y: 590,
            size: 11,
            font: bold,
        })

        page.drawText(`Total mora: ${formatoGT(totalMora)}`, {
            x: 360,
            y: 570,
            size: 11,
            font: bold,
        })

        page.drawLine({
            start: { x: 50, y: 525 },
            end: { x: 562, y: 525 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        let y = 500

        page.drawText('Concepto', { x: 55, y, size: 10, font: bold })
        page.drawText('Descripción', { x: 135, y, size: 10, font: bold })
        page.drawText('Fecha', { x: 280, y, size: 10, font: bold })
        page.drawText('Monto', { x: 365, y, size: 10, font: bold })
        page.drawText('Mora', { x: 440, y, size: 10, font: bold })
        page.drawText('Estado', { x: 500, y, size: 10, font: bold })

        y -= 18

        for (const m of movimientos) {
            if (y < 80) {
                page = pdfDoc.addPage([612, 792])
                drawHeader()
                y = 650
            }

            page.drawText(String(m.concepto || '—').slice(0, 12), {
                x: 55,
                y,
                size: 9,
                font,
            })

            page.drawText(String(m.descripcion || '—').slice(0, 22), {
                x: 135,
                y,
                size: 9,
                font,
            })

            page.drawText(String(m.fecha || '—').slice(0, 12), {
                x: 280,
                y,
                size: 9,
                font,
            })

            page.drawText(formatoGT(m.monto), {
                x: 365,
                y,
                size: 9,
                font,
            })

            page.drawText(formatoGT(m.mora), {
                x: 440,
                y,
                size: 9,
                font,
            })

            page.drawText(String(m.estado || '—').slice(0, 12), {
                x: 500,
                y,
                size: 9,
                font,
            })

            y -= 16
        }

        page.drawText('Documento generado electrónicamente', {
            x: 205,
            y: 40,
            size: 9,
            font,
            color: rgb(0.35, 0.35, 0.35),
        })

        const pdfBytes = await pdfDoc.save()

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="estado-cuenta-${carnet}.pdf"`,
            },
        })

    } catch (err) {
        console.error('[estado-cuenta-pdf]', err)
        return Response.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}