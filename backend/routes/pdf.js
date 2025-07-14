const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

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