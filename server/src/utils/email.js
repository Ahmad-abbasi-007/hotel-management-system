const nodemailer = require('nodemailer');

let transporter = null;

// Only create transporter if env vars exist
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

const sendEmail = async ({ to, subject, html }) => {
  // Development fallback
  if (!transporter) {
    console.log('\n📧 [EMAIL - DEV MODE] ─────────────────');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body (first 200 chars):', html.slice(0, 200));
    console.log('────────────────────────────────────\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Zenvio Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
  }
};

exports.sendBookingConfirmation = async (booking, guestEmail, guestName) => {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#1e40af">Booking Confirmed ✅</h2>
      <p>Hi ${guestName},</p>
      <p>Your booking at Zenvio Hotel is confirmed!</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px;border:1px solid #ddd">Room</td>
            <td style="padding:4px 12px;border:1px solid #ddd">${booking.room?.roomNumber} (${booking.room?.type})</td></tr>
        <tr><td style="padding:4px 12px;border:1px solid #ddd">Check-in</td>
            <td style="padding:4px 12px;border:1px solid #ddd">${new Date(booking.checkIn).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px;border:1px solid #ddd">Check-out</td>
            <td style="padding:4px 12px;border:1px solid #ddd">${new Date(booking.checkOut).toDateString()}</td></tr>
        <tr><td style="padding:4px 12px;border:1px solid #ddd">Total</td>
            <td style="padding:4px 12px;border:1px solid #ddd">PKR ${booking.totalPrice}</td></tr>
      </table>
      <p>We look forward to welcoming you!</p>
      <p style="color:#666;font-size:12px">— Zenvio Hotel</p>
    </div>
  `;
  await sendEmail({ to: guestEmail, subject: 'Booking Confirmed — Zenvio Hotel', html });
};

exports.sendCancellationEmail = async (booking, guestEmail, guestName) => {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#dc2626">Booking Cancelled</h2>
      <p>Hi ${guestName},</p>
      <p>Your booking (Room ${booking.room?.roomNumber}) from ${new Date(booking.checkIn).toDateString()} has been cancelled.</p>
      <p>Refund (if any) will be processed within 3-5 business days.</p>
      <p style="color:#666;font-size:12px">— Zenvio Hotel</p>
    </div>
  `;
  await sendEmail({ to: guestEmail, subject: 'Booking Cancelled — Zenvio Hotel', html });
};