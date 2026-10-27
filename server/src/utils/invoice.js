const PDFDocument = require('pdfkit');

/**
 * Generate booking invoice PDF and pipe to response
 * @param {Object} booking - populated booking (room, guest)
 * @param {Object} res - express response
 */
exports.generateInvoice = (booking, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=invoice-${booking._id}.pdf`
  );

  doc.pipe(res);

  // Header
  doc
    .fontSize(22)
    .fillColor('#1e40af')
    .text('ZENVIO HOTEL', { align: 'center' })
    .fontSize(10)
    .fillColor('#666')
    .text('123 Main Boulevard, Lahore, Pakistan', { align: 'center' })
    .text('Phone: +92-300-1234567 | Email: info@zenviohotel.com', { align: 'center' })
    .moveDown(1);

  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor('#2563eb')
    .lineWidth(2)
    .stroke()
    .moveDown(1);

  // Invoice meta
  doc.fontSize(16).fillColor('#111').text('INVOICE', { align: 'right' });
  doc
    .fontSize(10)
    .fillColor('#444')
    .text(`Invoice #: INV-${booking._id.toString().slice(-8).toUpperCase()}`, { align: 'right' })
    .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, { align: 'right' })
    .text(`Status: ${booking.status}`, { align: 'right' })
    .moveDown(1);

  // Guest info
  doc.fontSize(12).fillColor('#111').text('Billed To:');
  doc
    .fontSize(10)
    .fillColor('#444')
    .text(`Name: ${booking.guest?.name || 'Guest'}`)
    .text(`Email: ${booking.guest?.email || 'N/A'}`)
    .moveDown(1);

  // Stay details
  doc.fontSize(12).fillColor('#111').text('Stay Details:');
  doc
    .fontSize(10)
    .fillColor('#444')
    .text(`Room: ${booking.room?.roomNumber} (${booking.room?.type})`)
    .text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`)
    .text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`)
    .text(`Nights: ${booking.nights}`)
    .moveDown(1);

  // Line items table
  const tableTop = doc.y + 10;
  const col1 = 50;
  const col2 = 350;
  const col3 = 480;

  doc.fontSize(10).fillColor('#fff');
  doc.rect(50, tableTop, 500, 22).fill('#2563eb');
  doc.fillColor('#fff').text('Description', col1 + 5, tableTop + 6);
  doc.text('Qty', col2, tableTop + 6);
  doc.text('Amount (PKR)', col3, tableTop + 6);

  let y = tableTop + 30;
  doc.fillColor('#111').fontSize(10);

  const roomTotal = booking.nights * (booking.room?.price || 0);
  doc.text(`Room charge (${booking.room?.type})`, col1 + 5, y);
  doc.text(booking.nights.toString(), col2, y);
  doc.text(roomTotal.toLocaleString(), col3, y);
  y += 18;

  if (booking.services && booking.services.length > 0) {
    booking.services.forEach((s) => {
      doc.text(s.name, col1 + 5, y);
      doc.text('1', col2, y);
      doc.text(s.price.toLocaleString(), col3, y);
      y += 18;
    });
  }

  y += 8;
  doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').stroke();
  y += 10;

  const servicesTotal = (booking.services || []).reduce((sum, s) => sum + s.price, 0);
  const subtotal = roomTotal + servicesTotal;

  doc.fontSize(10).fillColor('#444');
  doc.text('Subtotal:', col2, y);
  doc.text(subtotal.toLocaleString(), col3, y);
  y += 16;
  doc.text('Tax (10%):', col2, y);
  doc.text(booking.tax.toLocaleString(), col3, y);
  y += 16;
  doc.fontSize(12).fillColor('#111').text('TOTAL:', col2, y);
  doc.fontSize(12).fillColor('#1e40af').text(booking.totalPrice.toLocaleString(), col3, y);

  doc
    .fontSize(9)
    .fillColor('#888')
    .text(
      '\n\nThank you for choosing Zenvio Hotel. We look forward to your next stay!',
      50,
      y + 40,
      { align: 'center', width: 500 }
    );

  doc.end();
};