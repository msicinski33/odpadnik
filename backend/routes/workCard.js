const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

// GET /api/work-card/:employeeId?month=YYYY-MM
router.get('/:employeeId', async (req, res) => {
  try {
    const { month } = req.query;
    const employeeId = Number(req.params.employeeId);
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const entries = await prisma.workCardEntry.findMany({
      where: {
        employeeId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
      include: { absenceType: true },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/work-card/:employeeId?month=YYYY-MM
// Accepts: [{ day, actualFrom, actualTo, actualTotal, absenceTypeId, onCall }]
router.post('/:employeeId', async (req, res) => {
  try {
    const { month } = req.query;
    const employeeId = Number(req.params.employeeId);
    const entries = req.body.entries;
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Entries array required' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const results = [];
    for (const e of entries) {
      console.log('DEBUG workCardEntry:', { month, day: e.day, entry: e });
      const date = new Date(`${month}-${String(e.day).padStart(2, '0')}T00:00:00.000Z`);
      const data = {
        employeeId,
        date,
        actualFrom: e.actualFrom || null,
        actualTo: e.actualTo || null,
        actualTotal: e.actualTotal || null,
        absenceTypeId: e.absenceTypeId || null,
        onCall: !!e.onCall,
      };
      const existing = await prisma.workCardEntry.findUnique({ where: { employeeId_date: { employeeId, date } } });
      if (existing) {
        const updated = await prisma.workCardEntry.update({ where: { id: existing.id }, data });
        results.push(updated);
      } else {
        const created = await prisma.workCardEntry.create({ data });
        results.push(created);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/work-card/:employeeId/export-xlsx?month=YYYY-MM
router.get('/:employeeId/export-xlsx', async (req, res) => {
  try {
    const { month } = req.query;
    const employeeId = Number(req.params.employeeId);
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const entries = await prisma.workCardEntry.findMany({
      where: {
        employeeId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
      include: { absenceType: true },
    });
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    const hasDisabilityCertificate = employee?.hasDisabilityCertificate;
    const hoursPerDay = hasDisabilityCertificate ? 7 : 8;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    // Fetch schedule for the month
    const schedule = await prisma.employeeSchedule.findMany({
      where: {
        employeeId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    });
    // Build maps for quick lookup
    const entryMap = {};
    entries.forEach(e => {
      const day = new Date(e.date).getDate();
      entryMap[day] = e;
    });
    const scheduleMap = {};
    schedule.forEach(s => {
      const day = new Date(s.date).getDate();
      scheduleMap[day] = s;
    });
    // Helper: parse shift string to planned hours
    function parseShift(shiftStr) {
      if (!shiftStr) return null;
      const match = shiftStr.match(/(\d{1,2})-(\d{1,2})/);
      if (match) {
        let from = Number(match[1]);
        let to = Number(match[2]);
        let total = to - from;
        if (total < 0) total += 24;
        return { from, to, total };
      }
      return null;
    }
    function adjustShiftForDisability(shift, hasDisabilityCertificate) {
      if (!hasDisabilityCertificate) return shift;
      if (shift === '6-14') return '6-13';
      if (shift === '14-22') return '14-21';
      if (shift === '22-6') return '22-5';
      return shift;
    }
    // Build rows for each day
    let totalPlanned = 0, totalActual = 0, totalAbsence = 0, totalDyzurowy = 0;
    let total50 = 0, total100 = 0, totalPostojowe = 0;
    const rows = [];
    for (let day = 1; day <= daysInMonth; ++day) {
      const dateObj = new Date(start.getFullYear(), start.getMonth(), day);
      const entry = entryMap[day] || {};
      const sched = scheduleMap[day];
      let planned = null;
      let isDyzurowy = false;
      if (sched && (sched.customHours || sched.shift)) {
        if (["D1", "D2", "D3"].includes(sched.shift)) {
          isDyzurowy = true;
          planned = null;
        } else {
          const adjustedShift = adjustShiftForDisability(sched.customHours || sched.shift || '', hasDisabilityCertificate);
          planned = parseShift(adjustedShift);
        }
      }
      const actual = entry.actualTotal != null ? Number(entry.actualTotal) : null;
      let nadgodziny = '';
      let postojowe = '';
      // Overtime/idle logic as in frontend
      if (!entry.absenceTypeId) {
        if (actual) {
          if (!planned) {
            if (actual <= hoursPerDay) { total100 += actual; nadgodziny = ''; postojowe = ''; }
            else { total100 += hoursPerDay; total50 += (actual - hoursPerDay); nadgodziny = (actual - hoursPerDay).toFixed(2); postojowe = ''; }
          } else if (actual > planned.total) {
            total50 += (actual - planned.total); nadgodziny = (actual - planned.total).toFixed(2); postojowe = '';
          } else if (actual < planned.total) {
            totalPostojowe += (planned.total - actual); nadgodziny = ''; postojowe = (planned.total - actual).toFixed(2);
          }
        }
      }
      // Totals for summary
      if (planned && !isDyzurowy) totalPlanned += planned.total;
      if (actual) totalActual += actual;
      if (entry.absenceTypeId && !entry.actualFrom && !entry.actualTo) totalAbsence += hoursPerDay;
      if (isDyzurowy && !(entry.actualFrom && entry.actualTo && entry.actualTotal)) totalDyzurowy += hoursPerDay;
      rows.push({
        date: dateObj.toISOString().split('T')[0],
        actualFrom: entry.actualFrom || '',
        actualTo: entry.actualTo || '',
        actualTotal: entry.actualTotal != null ? entry.actualTotal : '',
        absenceType: entry.absenceType ? entry.absenceType.name : '',
        onCall: entry.onCall ? 'Yes' : 'No',
        nadgodziny,
        postojowe,
        planned: planned ? planned.total : '',
        isDyzurowy,
        absenceTypeId: entry.absenceTypeId,
      });
    }
    // Offset total50 and totalPostojowe for the month
    let net50 = 0, netPostojowe = 0;
    if (total50 > totalPostojowe) {
      net50 = total50 - totalPostojowe;
      netPostojowe = 0;
    } else if (totalPostojowe > total50) {
      netPostojowe = totalPostojowe - total50;
      net50 = 0;
    }
    // Prepare XLSX
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Work Card');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Actual From', key: 'actualFrom', width: 12 },
      { header: 'Actual To', key: 'actualTo', width: 12 },
      { header: 'Actual Total', key: 'actualTotal', width: 12 },
      { header: 'Absence Type', key: 'absenceType', width: 20 },
      { header: 'On Call', key: 'onCall', width: 10 },
      { header: 'Nadgodziny', key: 'nadgodziny', width: 20 },
      { header: 'Postojowe', key: 'postojowe', width: 12 },
      { header: 'Planned', key: 'planned', width: 10 },
    ];
    rows.forEach(row => {
      sheet.addRow({
        date: row.date,
        actualFrom: row.actualFrom,
        actualTo: row.actualTo,
        actualTotal: row.actualTotal,
        absenceType: row.absenceType,
        onCall: row.onCall,
        nadgodziny: row.nadgodziny,
        postojowe: row.postojowe,
        planned: row.planned,
      });
    });
    // Add summary row
    sheet.addRow({});
    // Compose overtime summary string as in PDF
    let overtimeSummary = '';
    if (total100 > 0) overtimeSummary += `${total100.toFixed(2)}h x 100`;
    if (net50 > 0) overtimeSummary += (overtimeSummary ? ', ' : '') + `${net50.toFixed(2)}h x 50`;
    if (netPostojowe > 0) overtimeSummary += (overtimeSummary ? ', ' : '') + `${netPostojowe.toFixed(2)}h x postojowe`;
    // Sum of actual + absence hours
    const totalActualWithAbsence = (totalActual + totalAbsence).toFixed(2);
    sheet.addRow({
      date: 'OGÓŁEM:',
      actualFrom: '',
      actualTo: '',
      actualTotal: totalActualWithAbsence,
      absenceType: totalAbsence.toFixed(2),
      onCall: '',
      nadgodziny: overtimeSummary,
      postojowe: '',
      planned: totalPlanned.toFixed(2),
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=work-card-${employeeId}-${month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 