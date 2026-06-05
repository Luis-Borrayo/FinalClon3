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

export async function GET(req, { params }) {
    const client = await pool.connect()

    try {
        const { id } = await params

        const { rows } = await client.query(
            `
            SELECT
                r.id_recibo,
                r.carnet,
                r.id_referencia,
                r.tipo_referencia,
                TO_CHAR(r.fecha_emision, 'DD/MM/YYYY') AS fecha_emision,
                r.monto_total,
                r.estado_validacion,
                a.nombre,
                a.apellido
            FROM grupo6_pago_alumnos.recibos r
            LEFT JOIN grupo1_academico."Alumno" a
                ON a.carnet = r.carnet
            WHERE r.id_recibo = $1
            `,
            [id]
        )

        if (rows.length === 0) {
            return Response.json({ error: 'Recibo no encontrado' }, { status: 404 })
        }

        const r = rows[0]

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
        })

        page.drawLine({
            start: { x: 60, y: 690 },
            end: { x: 552, y: 690 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        page.drawText('RECIBO OFICIAL', {
            x: 225,
            y: 640,
            size: 20,
            font: bold,
        })

        page.drawText(`No. Recibo: #${r.id_recibo}`, {
            x: 60,
            y: 595,
            size: 12,
            font: bold,
        })

        page.drawText(`Fecha emisión: ${r.fecha_emision}`, {
            x: 370,
            y: 595,
            size: 12,
            font,
        })

        page.drawLine({
            start: { x: 60, y: 570 },
            end: { x: 552, y: 570 },
            thickness: 0.8,
            color: rgb(0, 0, 0),
        })

        page.drawText('Datos del Alumno', {
            x: 60,
            y: 535,
            size: 13,
            font: bold,
        })

        page.drawText(`Carnet: ${r.carnet}`, {
            x: 60,
            y: 510,
            size: 11,
            font,
        })

        page.drawText(`Alumno: ${r.nombre || '—'} ${r.apellido || '—'}`, {
            x: 60,
            y: 490,
            size: 11,
            font,
        })

        page.drawText('Detalle del Pago', {
            x: 60,
            y: 445,
            size: 13,
            font: bold,
        })

        page.drawText(`Concepto: ${r.tipo_referencia}`, {
            x: 60,
            y: 420,
            size: 11,
            font,
        })

        page.drawText(`Referencia interna: #${r.id_referencia}`, {
            x: 60,
            y: 400,
            size: 11,
            font,
        })

        page.drawText(`Estado: ${r.estado_validacion}`, {
            x: 60,
            y: 380,
            size: 11,
            font,
        })

        page.drawLine({
            start: { x: 60, y: 330 },
            end: { x: 552, y: 330 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        page.drawText('TOTAL PROCESADO', {
            x: 60,
            y: 295,
            size: 14,
            font: bold,
        })

        page.drawText(formatoGT(r.monto_total), {
            x: 410,
            y: 295,
            size: 18,
            font: bold,
        })

        page.drawLine({
            start: { x: 205, y: 190 },
            end: { x: 407, y: 190 },
            thickness: 1,
            color: rgb(0, 0, 0),
        })

        page.drawText('Departamento de Contabilidad', {
            x: 215,
            y: 170,
            size: 11,
            font,
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
                'Content-Disposition': `inline; filename="recibo-${r.id_recibo}.pdf"`,
            },
        })

    } catch (err) {
        console.error('[recibo-pdf]', err)
        return Response.json({ error: err.message }, { status: 500 })
    } finally {
        client.release()
    }
}