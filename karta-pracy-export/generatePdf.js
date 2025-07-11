const puppeteer = require('puppeteer');

// HTML szablon z Tailwind CDN + tokeny do podstawienia
const htmlTemplate = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Karta Pracy</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/dist/tailwind.min.css" rel="stylesheet">
  <style>
    @media print {
      @page { size: A4; margin: 1cm; }
      html, body { width: 210mm; height: 297mm; font-size: 11px; }
    }
    body { font-family: sans-serif; }
    table { table-layout: fixed; width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 4px; text-align: center; word-wrap: break-word; }
  </style>
</head>
<body class="p-4">
  <div class="text-center mb-4">
    <h1 class="text-lg font-bold">Karta pracy – <span id="employeeName">{{employeeName}}</span></h1>
    <p class="text-sm text-gray-700" id="monthLabel">{{monthLabel}}</p>
  </div>

  <table class="text-xs">
    <thead class="bg-gray-100">
      <tr>
        <th>Dzień</th>
        <th>Plan (Od–Do)</th>
        <th>Rzeczywisty (Od–Do)</th>
        <th>Absencja</th>
        <th>Dyżur</th>
        <th>Nadgodziny / Postojowe</th>
      </tr>
    </thead>
    <tbody id="workCardRows">
      {{rows}}
    </tbody>
    <tfoot class="bg-gray-100 font-bold">
      <tr>
        <td>SUMA</td>
        <td id="sumPlanned">{{sumPlanned}}h</td>
        <td id="sumActual">{{sumActual}}h</td>
        <td id="sumAbsence">{{sumAbsence}}h</td>
        <td id="sumOnCall">{{sumOnCall}}</td>
        <td id="sumOvertime">{{sumOvertime}}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
`;

const workCardData = {
  month: '2025-07',
  employeeName: 'Jan Kowalski',
  days: [
    { day: 1, planned: { from: '06:00', to: '14:00', total: 8 }, actual: { from: '06:00', to: '15:00', total: 9 }, absence: null, onCall: true, overtime: '1h x 50' },
    { day: 2, planned: { from: '06:00', to: '14:00', total: 8 }, actual: { from: '06:00', to: '13:30', total: 7.5 }, absence: null, onCall: false, overtime: '0.5h x postojowe' },
    { day: 3, planned: null, actual: { from: '06:00', to: '14:00', total: 8 }, absence: null, onCall: false, overtime: '8h x 100' },
    { day: 4, planned: { from: '06:00', to: '14:00', total: 8 }, actual: null, absence: 'CH', onCall: false, overtime: '—' }
  ]
};

function formatMonthLabel(month) {
  const [year, m] = month.split('-');
  const months = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  return `${months[parseInt(m) - 1]} ${year}`;
}

function generateHTML(data) {
  const rowsHtml = data.days.map(d => `
    <tr>
      <td>${d.day}</td>
      <td>${d.planned ? `${d.planned.from}–${d.planned.to} (${d.planned.total}h)` : '—'}</td>
      <td>${d.actual ? `${d.actual.from}–${d.actual.to} (${d.actual.total}h)` : '—'}</td>
      <td>${d.absence || '—'}</td>
      <td>${d.onCall ? '✓' : '—'}</td>
      <td>${d.overtime || '—'}</td>
    </tr>
  `).join('');

  const sumPlanned = data.days.reduce((sum, d) => sum + (d.planned?.total || 0), 0);
  const sumActual = data.days.reduce((sum, d) => sum + (d.actual?.total || 0), 0);
  const sumAbsence = data.days.reduce((sum, d) => sum + ((d.absence && !d.actual) ? d.planned?.total || 0 : 0), 0);
  const sumOnCall = data.days.filter(d => d.onCall).length;

  return htmlTemplate
    .replace('{{employeeName}}', data.employeeName)
    .replace('{{monthLabel}}', formatMonthLabel(data.month))
    .replace('{{rows}}', rowsHtml)
    .replace('{{sumPlanned}}', sumPlanned)
    .replace('{{sumActual}}', sumActual)
    .replace('{{sumAbsence}}', sumAbsence)
    .replace('{{sumOnCall}}', sumOnCall)
    .replace('{{sumOvertime}}', '—'); // możesz wyliczyć osobno
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = generateHTML(workCardData);
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'karta-pracy.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
  });

  await browser.close();
  console.log('✅ PDF zapisany jako karta-pracy.pdf');
})();
