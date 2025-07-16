const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const puppeteer = require('puppeteer');

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'order-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed!'));
    }
    cb(null, true);
  }
});

// Nodemailer setup (for demo, use ethereal or your SMTP config)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  auth: {
    user: process.env.SMTP_USER || 'demo@ethereal.email',
    pass: process.env.SMTP_PASS || 'demo',
  },
});

async function sendStatusEmail(order, newStatus) {
  let to = 'admin@example.com';
  // If orderingPerson looks like an email, use it
  if (order.orderingPerson && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.orderingPerson)) {
    to = order.orderingPerson;
  }
  const info = await transporter.sendMail({
    from: 'no-reply@odpadnik.local',
    to,
    subject: `Order #${order.id} status changed to ${newStatus}`,
    text: `Order #${order.id} for client ${order.clientCode} is now: ${newStatus}\n\nSummary:\nContainer: ${order.containerType}\nWaste: ${order.wasteType}\nAddress: ${order.address}\nOrdered by: ${order.orderingPerson}`,
  });
  // For dev: log preview URL if using ethereal
  if (nodemailer.getTestMessageUrl) {
    console.log('Email preview:', nodemailer.getTestMessageUrl(info));
  }
}

// GET /one-time-orders - List all orders with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, clientCode, from, to, search, sortBy = 'dateReceived', order = 'desc' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientCode) where.clientCode = clientCode;
    if (from || to) {
      where.dateReceived = {};
      if (from) where.dateReceived.gte = new Date(from);
      if (to) where.dateReceived.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { clientCode: { contains: search, mode: 'insensitive' } },
        { orderingPerson: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { containerType: { contains: search, mode: 'insensitive' } },
        { wasteType: { contains: search, mode: 'insensitive' } },
      ];
    }
    const orders = await prisma.oneTimeOrder.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        receivedBy: { select: { id: true, name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /one-time-orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.oneTimeOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        receivedBy: { select: { id: true, name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /one-time-orders - Create new order
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // Always use the logged-in user for receivedById
    data.receivedById = req.user.id;
    // Optionally validate required fields here
    if (data.deliveryVehicleId === "") data.deliveryVehicleId = null;
    if (data.pickupVehicleId === "") data.pickupVehicleId = null;
    const order = await prisma.oneTimeOrder.create({
      data,
      include: {
        receivedBy: { select: { id: true, name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /one-time-orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    if (data.deliveryVehicleId === "") data.deliveryVehicleId = null;
    if (data.pickupVehicleId === "") data.pickupVehicleId = null;
    const order = await prisma.oneTimeOrder.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /one-time-orders/:id/upload - Upload PDF for order
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const order = await prisma.oneTimeOrder.update({
      where: { id: Number(req.params.id) },
      data: { pdfFile: `/uploads/documents/${req.file.filename}` },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /one-time-orders/:id/assign - Assign vehicle
router.post('/:id/assign', async (req, res) => {
  try {
    const { deliveryVehicleId } = req.body;
    const order = await prisma.oneTimeOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'AWAITING_EXECUTION') return res.status(400).json({ error: 'Order not in AWAITING_EXECUTION status' });
    const updated = await prisma.oneTimeOrder.update({
      where: { id: order.id },
      data: { deliveryVehicleId, status: 'CONTAINER_DELIVERED' },
      include: {
        receivedBy: { select: { id: true, name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    sendStatusEmail(updated, 'CONTAINER_DELIVERED').catch(console.error);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /one-time-orders/:id/pickup - Mark as picked up
router.post('/:id/pickup', async (req, res) => {
  try {
    const { pickupDate, pickupVehicleId } = req.body;
    const order = await prisma.oneTimeOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CONTAINER_DELIVERED') return res.status(400).json({ error: 'Order not in CONTAINER_DELIVERED status' });
    const updated = await prisma.oneTimeOrder.update({
      where: { id: order.id },
      data: { pickupDate: new Date(pickupDate), status: 'AWAITING_COMPLETION', ...(pickupVehicleId && { pickupVehicleId }) },
      include: {
        receivedBy: { select: { id: true, name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    sendStatusEmail(updated, 'AWAITING_COMPLETION').catch(console.error);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /one-time-orders/:id/complete - Complete order
router.post('/:id/complete', async (req, res) => {
  try {
    const { clientCode, invoiceNumber } = req.body;
    const order = await prisma.oneTimeOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'AWAITING_COMPLETION') return res.status(400).json({ error: 'Order not in AWAITING_COMPLETION status' });
    if (order.clientCode !== clientCode) return res.status(400).json({ error: 'Client code does not match' });
    const updated = await prisma.oneTimeOrder.update({
      where: { id: order.id },
      data: { invoiceNumber, status: 'COMPLETED', completedAt: new Date() },
    });
    sendStatusEmail(updated, 'COMPLETED').catch(console.error);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /one-time-orders/:id/duplicate - Duplicate order
router.post('/:id/duplicate', async (req, res) => {
  try {
    const order = await prisma.oneTimeOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const {
      dateReceived, receivedById, deliveryDate, clientCode, orderingPerson, address, phone, containerType, wasteType, notes
    } = order;
    const duplicated = await prisma.oneTimeOrder.create({
      data: {
        dateReceived,
        receivedById,
        deliveryDate,
        clientCode,
        orderingPerson,
        address,
        phone,
        containerType,
        wasteType,
        notes,
        status: 'AWAITING_EXECUTION',
      },
    });
    res.status(201).json(duplicated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /one-time-orders/:id - Delete order (optional)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.oneTimeOrder.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await prisma.oneTimeOrder.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd podczas usuwania zlecenia' });
  }
});

// GET /one-time-orders/export - Export completed orders as CSV
router.get('/export', async (req, res) => {
  try {
    const orders = await prisma.oneTimeOrder.findMany({
      where: { status: 'COMPLETED' },
      include: {
        receivedBy: { select: { name: true } },
        deliveryVehicle: { select: { registrationNumber: true } },
        pickupVehicle: { select: { registrationNumber: true } },
      },
    });
    const fields = [
      { label: 'No.', value: 'id' },
      { label: 'Date Received', value: 'dateReceived' },
      { label: 'Client Code', value: 'clientCode' },
      { label: 'Ordered By', value: 'orderingPerson' },
      { label: 'Address', value: 'address' },
      { label: 'Container', value: 'containerType' },
      { label: 'Waste Type', value: 'wasteType' },
      { label: 'Status', value: 'status' },
      { label: 'Vehicle', value: row => row.deliveryVehicle?.registrationNumber || '' },
      { label: 'Received By', value: row => row.receivedBy?.name || '' },
      { label: 'Invoice Number', value: 'invoiceNumber' },
      { label: 'Completed At', value: 'completedAt' },
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(orders);
    res.header('Content-Type', 'text/csv');
    res.attachment('one_time_orders_export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /one-time-orders/:id/pdf - Generate PDF summary for order
router.get('/:id/pdf', async (req, res) => {
  try {
    const order = await prisma.oneTimeOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        receivedBy: { select: { name: true, email: true } },
        deliveryVehicle: { select: { registrationNumber: true } },
        pickupVehicle: { select: { registrationNumber: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order.id}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).text('One-Time Order Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Order No.: ${order.id}`);
    doc.text(`Date Received: ${order.dateReceived}`);
    doc.text(`Client Code: ${order.clientCode}`);
    doc.text(`Ordered By: ${order.orderingPerson}`);
    doc.text(`Address: ${order.address}`);
    doc.text(`Container: ${order.containerType}`);
    doc.text(`Waste Type: ${order.wasteType}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Vehicle: ${order.deliveryVehicle?.registrationNumber || ''}`);
    doc.text(`Received By: ${order.receivedBy?.name || ''}`);
    doc.text(`Invoice Number: ${order.invoiceNumber || ''}`);
    doc.text(`Completed At: ${order.completedAt || ''}`);
    doc.text(`Notes: ${order.notes || ''}`);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /one-time-orders/:id/merged-pdf - Generate summary + uploaded PDF
router.get('/:id/merged-pdf', async (req, res) => {
  try {
    const order = await prisma.oneTimeOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        receivedBy: { select: { name: true, email: true } },
        deliveryVehicle: { select: { id: true, registrationNumber: true, brand: true } },
        pickupVehicle: { select: { id: true, registrationNumber: true, brand: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // 1. Generate summary PDF from HTML using Puppeteer
    // You may want to generate the HTML here or accept it as a query param/body
    // For now, use a simple HTML template (replace with your React render if needed)
    const STATUS_LABELS = {
      'AWAITING_EXECUTION': 'Oczekuje na realizację',
      'CONTAINER_DELIVERED': 'Kontener dostarczony',
      'AWAITING_COMPLETION': 'Oczekuje na odbiór',
      'COMPLETED': 'Zakończone',
      'CANCELLED': 'Anulowane',
    };
    const formatDate = d => d ? new Date(d).toLocaleDateString('pl-PL') : '-';
    const html = `
      <div style="font-family: 'Noto Sans', Arial, sans-serif; color: #222; font-size: 13px; width: 100%;">
        <div style="border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-weight: 700; font-size: 22px; color: #0ea5e9;">ODPADnik</div>
          <div style="font-weight: 700; font-size: 18px;">Zlecenie jednorazowe</div>
        </div>
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">Dane zlecenia</div>
          <div>Numer zlecenia: <b>${order.id}</b></div>
          <div>Kod klienta: <b>${order.clientCode}</b></div>
          <div>Status: <b>${STATUS_LABELS[order.status] || order.status}</b></div>
        </div>
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">Zleceniodawca i kontakt</div>
          <div>Zleceniodawca: <b>${order.orderingPerson}</b></div>
          <div>Adres: <b>${order.address}</b></div>
          <div>Telefon: <b>${order.phone}</b></div>
        </div>
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">Szczegóły zlecenia</div>
          <div>Typ kontenera: <b>${order.containerType}</b></div>
          <div>Typ odpadu: <b>${order.wasteType}</b></div>
          <div>Pojazd (dostawa): <b>${order.deliveryVehicle ? `${order.deliveryVehicle.registrationNumber}${order.deliveryVehicle.brand ? ' - ' + order.deliveryVehicle.brand : ''}` : '-'}</b></div>
          <div>Pojazd (zabranie): <b>${order.pickupVehicle ? `${order.pickupVehicle.registrationNumber}${order.pickupVehicle.brand ? ' - ' + order.pickupVehicle.brand : ''}` : '-'}</b></div>
          <div>Przyjął: <b>${order.receivedBy?.name || '-'}</b></div>
          <div>Numer faktury: <b>${order.invoiceNumber || '-'}</b></div>
        </div>
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">Terminy</div>
          <div>Data przyjęcia: <b>${formatDate(order.dateReceived)}</b></div>
          <div>Data dostawy: <b>${formatDate(order.deliveryDate)}</b></div>
          <div>Data odbioru: <b>${formatDate(order.pickupDate)}</b></div>
          <div>Data zakończenia: <b>${formatDate(order.completedAt)}</b></div>
        </div>
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">Uwagi</div>
          <div>${order.notes || '-'}</div>
        </div>
        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 12px; color: #888;">Sporządził:</div>
            <div style="border-bottom: 1px solid #bbb; width: 220px; height: 28px;"></div>
          </div>
          <div style="font-size: 11px; color: #aaa;">Wygenerowano: ${formatDate(new Date())}</div>
        </div>
      </div>
    `;
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const summaryBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();

    // 2. If uploaded PDF exists, merge it
    let mergedBuffer = summaryBuffer;
    if (order.pdfFile) {
      const fs = require('fs');
      const path = require('path');
      const pdfPath = path.join(__dirname, '..', order.pdfFile.startsWith('/') ? order.pdfFile.slice(1) : order.pdfFile);
      if (fs.existsSync(pdfPath)) {
        const uploadedBuffer = fs.readFileSync(pdfPath);
        const summaryDoc = await PDFLibDocument.load(summaryBuffer);
        const uploadedDoc = await PDFLibDocument.load(uploadedBuffer);
        const mergedDoc = await PDFLibDocument.create();
        // Add summary pages
        const summaryPages = await mergedDoc.copyPages(summaryDoc, summaryDoc.getPageIndices());
        summaryPages.forEach(p => mergedDoc.addPage(p));
        // Add uploaded pages
        const uploadedPages = await mergedDoc.copyPages(uploadedDoc, uploadedDoc.getPageIndices());
        uploadedPages.forEach(p => mergedDoc.addPage(p));
        mergedBuffer = await mergedDoc.save();
      }
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order.id}-merged.pdf`);
    res.send(mergedBuffer);
  } catch (err) {
    console.error('Merged PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 