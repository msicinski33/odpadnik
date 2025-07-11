const express = require('express');
const router = express.Router();

// Demo employees data
const demoEmployees = [
  { id: 1, name: 'Jan Kowalski', position: 'KIEROWCA' },
  { id: 2, name: 'Anna Nowak', position: 'KIEROWCA' },
  { id: 3, name: 'Piotr Zielinski', position: 'ŁADOWACZ' },
  { id: 4, name: 'Maria Wiśniewska', position: 'ŁADOWACZ' },
];

// Demo schedule data (for July 2025)
const demoSchedule = {
  1: {
    '2025-07-01': '6-14',
    '2025-07-02': '14-22',
    '2025-07-03': 'NU',
    '2025-07-04': '6-14',
  },
  2: {
    '2025-07-01': '14-22',
    '2025-07-02': '22-6',
    '2025-07-03': '6-14',
    '2025-07-04': 'NU',
  },
  3: {
    '2025-07-01': 'NU',
    '2025-07-02': '6-14',
    '2025-07-03': '14-22',
    '2025-07-04': '22-6',
  },
  4: {
    '2025-07-01': '22-6',
    '2025-07-02': 'NU',
    '2025-07-03': '6-14',
    '2025-07-04': '14-22',
  },
};

// GET /api/demo-employees?position=KIEROWCA
router.get('/demo-employees', (req, res) => {
  const { position } = req.query;
  if (position) {
    res.json(demoEmployees.filter(e => e.position === position));
  } else {
    res.json(demoEmployees);
  }
});

// GET /api/demo-schedule?month=2025-07
router.get('/demo-schedule', (req, res) => {
  // Always return the static demoSchedule for demo
  res.json(demoSchedule);
});

module.exports = router; 