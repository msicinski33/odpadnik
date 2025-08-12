const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const { PDFDocument } = require('pdf-lib');

router.post('/work-card', async (req, res) => {
  try {
    const { html, fileName = 'work-card.pdf' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'Missing HTML content' });
    }

    // Sanitize the fileName to avoid invalid characters in headers
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.post('/monthly-schedule', async (req, res) => {
  try {
    const { html, fileName = 'monthly-schedule.pdf' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'Missing HTML content' });
    }

    // Sanitize the fileName to avoid invalid characters in headers
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router; 

// Bulk work-card ZIP generation: accepts array of { html, fileName }
router.post('/work-card-bulk-zip', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing items array' });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="work-cards.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const item of items) {
      const html = item?.html;
      let fileName = item?.fileName || 'work-card.pdf';
      if (!html) continue;
      fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      archive.append(pdfBuffer, { name: fileName });
    }

    await browser.close();
    await archive.finalize();
  } catch (err) {
    console.error('Bulk ZIP generation error:', err);
    // If headers already sent (streaming), we cannot change status; end stream
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate ZIP' });
    } else {
      try { res.end(); } catch {}
    }
  }
});

// Bulk work-card merged PDF: accepts array of { html, fileName } and returns a single merged PDF
router.post('/work-card-bulk-merged', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing items array' });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Generate each PDF buffer
    const buffers = [];
    for (const item of items) {
      const html = item?.html;
      if (!html) continue;
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      buffers.push(pdfBuffer);
    }
    await browser.close();

    // Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (const buffer of buffers) {
      const srcPdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    }
    const mergedBytes = await mergedPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="work-cards-merged.pdf"');
    res.send(Buffer.from(mergedBytes));
  } catch (err) {
    console.error('Bulk merged PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate merged PDF' });
    } else {
      try { res.end(); } catch {}
    }
  }
});