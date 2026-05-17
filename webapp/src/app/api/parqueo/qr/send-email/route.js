import { NextResponse } from "next/server";
import { Resend } from "resend";
import QRCode from "qrcode";


export async function POST(request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, reservation, qrImageBase64, userQrCode } = await request.json();

    if (!email || !reservation) {
      return NextResponse.json({ error: "Email y reserva son requeridos." }, { status: 400 });
    }

    // Prioridad: 1) imagen precalculada, 2) qr_code personal del usuario, 3) fallback JSON reserva
    let qrBase64;
    if (qrImageBase64) {
      qrBase64 = qrImageBase64;
    } else {
      // Usar el mismo código que escanea la garita (user.qr_code)
      const qrData = userQrCode ?? JSON.stringify({
        reservationId: reservation.id,
        spaceCode:     reservation.spaceCode,
        zone:          reservation.zone,
        startTime:     reservation.startTime,
        endTime:       reservation.endTime,
        type:          reservation.type,
      });
      qrBase64 = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: "#800020", light: "#ffffff" },
      });
    }

    const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ""), "base64");

    const recipient = process.env.RESEND_TO_OVERRIDE || email;

    const { error } = await resend.emails.send({
      from:    "Parqueo USPG <onboarding@resend.dev>",
      to:      [recipient],
      subject: `QR de reserva — Espacio ${reservation.spaceCode}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e5e5;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="background:#800020;display:inline-block;padding:12px 28px;border-radius:8px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:1px;">PARQUEO USPG</span>
            </div>
          </div>

          <h2 style="color:#800020;margin:0 0 8px;font-size:18px;">Confirmación de reserva</h2>
          <p style="color:#555;margin:0 0 24px;font-size:14px;">
            Se ha generado tu código QR de acceso. Preséntalo al ingresar al campus.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;color:#888;font-weight:600;width:40%;">Espacio</td>
              <td style="padding:10px 14px;color:#222;font-weight:700;">${reservation.spaceCode}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600;">Zona</td>
              <td style="padding:10px 14px;color:#222;">Zona ${reservation.zone}</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;color:#888;font-weight:600;">Inicio</td>
              <td style="padding:10px 14px;color:#222;">${reservation.startTimeFormatted}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600;">Fin</td>
              <td style="padding:10px 14px;color:#222;">${reservation.endTimeFormatted}</td>
            </tr>
            ${reservation.eventName ? `
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;color:#888;font-weight:600;">Evento</td>
              <td style="padding:10px 14px;color:#222;">${reservation.eventName}</td>
            </tr>` : ""}
          </table>

          <div style="text-align:center;margin-bottom:24px;">
            <img src="cid:qr-code" alt="Código QR" style="width:220px;height:220px;border:4px solid #800020;border-radius:8px;" />
          </div>

          <p style="color:#aaa;font-size:12px;text-align:center;margin:0;">
            Universidad San Pablo Guatemala · Sistema de Parqueo
          </p>
        </div>
      `,
      attachments: [
        {
          filename:    "qr-reserva.png",
          content:     qrBuffer,
          contentType: "image/png",
          contentId:   "qr-code",
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-email error:", err);
    return NextResponse.json({ error: "Error interno al enviar el correo." }, { status: 500 });
  }
}
