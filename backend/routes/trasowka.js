const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const path = require('path');
const prisma = new PrismaClient();

// Generate Trasówka PDF
router.post('/generate', async (req, res) => {
  try {
    const { regionId, regionName, points, fractionAssignments } = req.body;

    if (!regionId || !points || !fractionAssignments) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Get fractions data
    const fractions = await prisma.fraction.findMany({
      where: {
        id: { in: Object.keys(fractionAssignments).map(id => parseInt(id)) }
      }
    });

    // Create PDF document in portrait A4
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: {
        top: 50,
        bottom: 50,
        left: 30,
        right: 30
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trasowka_${regionName}_${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Define colors for fractions
    const fractionColors = {
      'PAP': '#3C8DBC',
      'BIO': '#C0392B', 
      'TW': '#F1C40F',
      'SZ': '#27AE60',
      'ZM': '#2C3E50'
    };

    // Update pageWidth and pageHeight for portrait
    const pageWidth = 595; // A4 portrait width in points
    const pageHeight = 842; // A4 portrait height in points
    const margin = 30;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2) - 100; // Leave space for header

    const addressColumnWidth = 200;
    const fractionColumnWidth = (usableWidth - addressColumnWidth) / Object.keys(fractionAssignments).length;
    const rowHeight = 22;
    const headerRowHeight = 32; // Increased from rowHeight for more space in header
    const maxRowsPerPage = Math.floor((usableHeight - headerRowHeight) / rowHeight);

    // Split points into pages
    const pages = [];
    for (let i = 0; i < points.length; i += maxRowsPerPage) {
      pages.push(points.slice(i, i + maxRowsPerPage));
    }

    // Inside the /generate route, after creating the doc:
    const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
    const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
    doc.registerFont('NotoSans', fontPathRegular);
    doc.registerFont('NotoSans-Bold', fontPathBold);

    // Generate each page
    pages.forEach((pagePoints, pageIndex) => {
      if (pageIndex > 0) {
        doc.addPage();
      }

      // Header
      doc.fontSize(16).font('NotoSans-Bold').text(
        `Nieruchomości zamieszkałe ${regionName}`,
        margin,
        margin,
        { align: 'center', width: usableWidth }
      );

      doc.fontSize(12).font('NotoSans').text(
        'Miasto Słupsk, 2025 r.',
        margin,
        margin + 25,
        { align: 'center', width: usableWidth }
      );

      // Page number
      doc.fontSize(10).font('NotoSans').text(
        `Strona ${pageIndex + 1} z ${pages.length} stron`,
        margin,
        margin + 45,
        { align: 'center', width: usableWidth }
      );

      // Table header
      const tableY = margin + 80;
      const tableWidth = 30 + addressColumnWidth + (fractionAssignments.length * fractionColumnWidth);
      const tableStartX = margin + (usableWidth - tableWidth) / 2;

      let currentX = tableStartX;
      doc.rect(currentX, tableY, 30, headerRowHeight).stroke();
      doc.fontSize(10).font('NotoSans-Bold').text('Lp.', currentX + 5, tableY + 10);
      currentX += 30;
      doc.rect(currentX, tableY, addressColumnWidth, headerRowHeight).stroke();
      doc.fontSize(10).font('NotoSans-Bold').text('ADRES', currentX + 5, tableY + 10);
      currentX += addressColumnWidth;
      fractionAssignments.forEach((data, idx) => {
        const fraction = fractions.find(f => f.id === parseInt(data.fractionId));
        const color = data.color || fractionColors[fraction?.code] || '#000000';
        doc.save();
        doc.rect(currentX, tableY, fractionColumnWidth, headerRowHeight).fillAndStroke(color, '#000000');
        // Center date and code vertically and horizontally
        const dateFontSize = 10;
        const codeFontSize = 10;
        const dateTextHeight = doc.heightOfString(data.date, { width: fractionColumnWidth, align: 'center' });
        const codeTextHeight = doc.heightOfString(fraction?.code || '', { width: fractionColumnWidth, align: 'center' });
        const totalTextHeight = dateTextHeight + codeTextHeight;
        const startY = tableY + (headerRowHeight - totalTextHeight) / 2;
        doc.fillColor('white').fontSize(dateFontSize).font('NotoSans-Bold')
          .text(data.date, currentX, startY, { width: fractionColumnWidth, align: 'center' });
        doc.fontSize(codeFontSize).font('NotoSans-Bold')
          .text(fraction?.code || '', currentX, startY + dateTextHeight, { width: fractionColumnWidth, align: 'center' });
        doc.restore();
        currentX += fractionColumnWidth;
      });

      // Table rows
      pagePoints.forEach((point, index) => {
        const rowY = tableY + headerRowHeight + (index * rowHeight);
        let colX = tableStartX;

        // HIGHLIGHT ROW IF KOMPOSTOWNIK
        if (point.kompostownik) {
          doc.save();
          doc.rect(colX, rowY, tableWidth, rowHeight).fill('#d4edda'); // light green
          doc.restore();
        }

        doc.rect(colX, rowY, 30, rowHeight).stroke();
        doc.fontSize(9).font('NotoSans').fillColor('black')
          .text((pageIndex * maxRowsPerPage + index + 1).toString(), colX + 5, rowY + 6);
        colX += 30;
        doc.rect(colX, rowY, addressColumnWidth, rowHeight).stroke();
        const address = `${point.street} ${point.number}, ${point.town}`;
        const addressTextHeight = doc.heightOfString(address, { width: addressColumnWidth - 10, align: 'left' });
        const addressY = rowY + (rowHeight - addressTextHeight) / 2;
        doc.fontSize(9).font('NotoSans').fillColor('black')
          .text(address, colX + 5, addressY, { width: addressColumnWidth - 10, align: 'left' });
        colX += addressColumnWidth;
        fractionAssignments.forEach(() => {
          doc.rect(colX, rowY, fractionColumnWidth, rowHeight).stroke();
          colX += fractionColumnWidth;
        });
      });

      // After drawing the last table row on the last page, add the footer just below the table
      if (pageIndex === pages.length - 1) {
        const lastRowY = tableY + headerRowHeight + (pagePoints.length * rowHeight);
        const footerText = `Sporządził: ${req.user?.name || '---'}  Data: ${new Date().toLocaleDateString('pl-PL')}`;
        doc.fontSize(10).font('NotoSans').fillColor('black')
          .text(footerText, tableStartX, lastRowY + 10, { align: 'left' });
      }
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating Trasówka PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

module.exports = router; 