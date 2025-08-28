const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Winter-specific equipment categories
const WINTER_EQUIPMENT_CATEGORIES = {
  plow: 'Pług śnieżny',
  salt_spreader: 'Solarka',
  snow_blower: 'Odśnieżarka',
  road_grader: 'Równiarka',
  loader: 'Ładowarka',
  sand_spreader: 'Piaskarka',
  brine_maker: 'Wytwarzarka solanki',
  winter_tractor: 'Ciągnik zimowy'
};

// Driver license categories relevant for winter operations
const WINTER_LICENSE_CATEGORIES = {
  'C': 'Kategoria C - Pojazdy powyżej 3.5t',
  'C+E': 'Kategoria C+E - Zespoły pojazdów',
  'D': 'Kategoria D - Autobusy',
  'T': 'Kategoria T - Ciągniki rolnicze',
  'B': 'Kategoria B - Samochody osobowe'
};

// GET /api/winter-driver-qualifications - Get driver qualifications overview
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      licenseCategory, 
      equipment, 
      qualification,
      activeOnly = 'true',
      sortBy = 'surname',
      sortOrder = 'asc'
    } = req.query;
    
    // Build where clause
    const where = {};
    
    if (activeOnly === 'true') {
      where.terminatedAt = null;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { surname: { contains: search } },
        { position: { contains: search } }
      ];
    }
    
    if (licenseCategory) {
      where.driversLicenseCategories = {
        contains: licenseCategory
      };
    }
    
    if (equipment || qualification) {
      const qualFilters = [];
      if (equipment) qualFilters.push(equipment);
      if (qualification) qualFilters.push(qualification);
      
      where.specialQualifications = {
        contains: qualFilters.join(' ')
      };
    }
    
    // Set up ordering
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        phone: true,
        email: true,
        driversLicenseCategories: true,
        specialQualifications: true,
        hiredAt: true,
        terminatedAt: true,
        workHours: true,
        nightShiftAllowed: true,
        overtimeAllowed: true
      },
      orderBy: [orderBy, { surname: 'asc' }]
    });
    
    // Process and categorize qualifications
    const processedEmployees = employees.map(employee => {
      const licenseCategories = employee.driversLicenseCategories 
        ? employee.driversLicenseCategories.split(',').map(cat => cat.trim())
        : [];
        
      const qualifications = employee.specialQualifications
        ? employee.specialQualifications.split(',').map(qual => qual.trim())
        : [];
      
      // Categorize winter equipment qualifications
      const winterEquipment = [];
      const otherQualifications = [];
      
      qualifications.forEach(qual => {
        const qualLower = qual.toLowerCase();
        let isWinterEquipment = false;
        
        Object.keys(WINTER_EQUIPMENT_CATEGORIES).forEach(key => {
          if (qualLower.includes(key.replace('_', ' ')) || 
              qualLower.includes(key) ||
              qualLower.includes('winter') ||
              qualLower.includes('snow') ||
              qualLower.includes('ice')) {
            winterEquipment.push(qual);
            isWinterEquipment = true;
          }
        });
        
        if (!isWinterEquipment) {
          otherQualifications.push(qual);
        }
      });
      
      // Map license categories to descriptions
      const licenseDetails = licenseCategories.map(cat => ({
        category: cat,
        description: WINTER_LICENSE_CATEGORIES[cat] || cat,
        isWinterRelevant: ['C', 'C+E', 'T', 'D'].includes(cat)
      }));
      
      return {
        ...employee,
        fullName: `${employee.name} ${employee.surname}`,
        licenseCategories,
        licenseDetails,
        winterEquipment,
        otherQualifications,
        qualifications,
        isActive: !employee.terminatedAt,
        canDriveHeavyVehicles: licenseCategories.some(cat => ['C', 'C+E', 'D', 'T'].includes(cat)),
        hasWinterQualifications: winterEquipment.length > 0,
        experienceYears: employee.hiredAt ? 
          Math.floor((new Date() - new Date(employee.hiredAt)) / (365.25 * 24 * 60 * 60 * 1000)) : 0
      };
    });
    
    // Generate summary statistics
    const stats = {
      total: processedEmployees.length,
      active: processedEmployees.filter(emp => emp.isActive).length,
      withWinterQualifications: processedEmployees.filter(emp => emp.hasWinterQualifications).length,
      heavyVehicleDrivers: processedEmployees.filter(emp => emp.canDriveHeavyVehicles).length,
      nightShiftCapable: processedEmployees.filter(emp => emp.nightShiftAllowed).length,
      overtimeAllowed: processedEmployees.filter(emp => emp.overtimeAllowed).length
    };
    
    res.json({
      success: true,
      data: processedEmployees,
      stats,
      filters: {
        search,
        licenseCategory,
        equipment,
        qualification,
        activeOnly,
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('Error fetching driver qualifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver qualifications',
      details: error.message
    });
  }
});

// GET /api/winter-driver-qualifications/categories - Get license categories and equipment types
router.get('/categories', async (req, res) => {
  try {
    // Get unique license categories from employees
    const employees = await prisma.employee.findMany({
      where: {
        terminatedAt: null,
        driversLicenseCategories: { not: null }
      },
      select: {
        driversLicenseCategories: true,
        specialQualifications: true
      }
    });
    
    const licenseCategories = new Set();
    const equipmentTypes = new Set();
    const allQualifications = new Set();
    
    employees.forEach(employee => {
      // Process license categories
      if (employee.driversLicenseCategories) {
        employee.driversLicenseCategories.split(',').forEach(cat => {
          licenseCategories.add(cat.trim());
        });
      }
      
      // Process qualifications
      if (employee.specialQualifications) {
        employee.specialQualifications.split(',').forEach(qual => {
          const qualTrimmed = qual.trim();
          allQualifications.add(qualTrimmed);
          
          // Check if it's winter equipment
          const qualLower = qualTrimmed.toLowerCase();
          Object.keys(WINTER_EQUIPMENT_CATEGORIES).forEach(key => {
            if (qualLower.includes(key.replace('_', ' ')) || 
                qualLower.includes(key) ||
                qualLower.includes('winter') ||
                qualLower.includes('snow') ||
                qualLower.includes('plow') ||
                qualLower.includes('salt')) {
              equipmentTypes.add(qualTrimmed);
            }
          });
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        licenseCategories: Array.from(licenseCategories).sort().map(cat => ({
          code: cat,
          description: WINTER_LICENSE_CATEGORIES[cat] || cat,
          isWinterRelevant: ['C', 'C+E', 'T', 'D'].includes(cat)
        })),
        winterEquipmentTypes: Array.from(equipmentTypes).sort(),
        predefinedEquipment: WINTER_EQUIPMENT_CATEGORIES,
        allQualifications: Array.from(allQualifications).sort()
      }
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// GET /api/winter-driver-qualifications/by-equipment/:equipment - Get employees by equipment type
router.get('/by-equipment/:equipment', async (req, res) => {
  try {
    const { equipment } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const where = {
      specialQualifications: {
        contains: equipment
      }
    };
    
    if (activeOnly === 'true') {
      where.terminatedAt = null;
    }
    
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        phone: true,
        driversLicenseCategories: true,
        specialQualifications: true,
        workHours: true,
        nightShiftAllowed: true,
        overtimeAllowed: true,
        hiredAt: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });
    
    const processedEmployees = employees.map(employee => ({
      ...employee,
      fullName: `${employee.name} ${employee.surname}`,
      licenseCategories: employee.driversLicenseCategories 
        ? employee.driversLicenseCategories.split(',').map(cat => cat.trim())
        : [],
      qualifications: employee.specialQualifications
        ? employee.specialQualifications.split(',').map(qual => qual.trim())
        : [],
      experienceYears: employee.hiredAt ? 
        Math.floor((new Date() - new Date(employee.hiredAt)) / (365.25 * 24 * 60 * 60 * 1000)) : 0
    }));
    
    res.json({
      success: true,
      data: processedEmployees,
      equipment,
      total: processedEmployees.length
    });
    
  } catch (error) {
    console.error('Error fetching employees by equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees by equipment',
      details: error.message
    });
  }
});

// GET /api/winter-driver-qualifications/matrix - Get qualification matrix view
router.get('/matrix', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { terminatedAt: null },
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        driversLicenseCategories: true,
        specialQualifications: true,
        nightShiftAllowed: true,
        overtimeAllowed: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Get all unique qualifications and license categories
    const allLicenses = new Set();
    const allEquipment = new Set();
    
    employees.forEach(employee => {
      if (employee.driversLicenseCategories) {
        employee.driversLicenseCategories.split(',').forEach(cat => {
          allLicenses.add(cat.trim());
        });
      }
      
      if (employee.specialQualifications) {
        employee.specialQualifications.split(',').forEach(qual => {
          const qualTrimmed = qual.trim();
          const qualLower = qualTrimmed.toLowerCase();
          
          // Only include winter-relevant equipment
          if (qualLower.includes('winter') ||
              qualLower.includes('snow') ||
              qualLower.includes('plow') ||
              qualLower.includes('salt') ||
              qualLower.includes('spreader') ||
              qualLower.includes('grader') ||
              qualLower.includes('loader')) {
            allEquipment.add(qualTrimmed);
          }
        });
      }
    });
    
    const licenses = Array.from(allLicenses).sort();
    const equipment = Array.from(allEquipment).sort();
    
    // Create matrix
    const matrix = employees.map(employee => {
      const empLicenses = employee.driversLicenseCategories 
        ? employee.driversLicenseCategories.split(',').map(cat => cat.trim())
        : [];
        
      const empQualifications = employee.specialQualifications
        ? employee.specialQualifications.split(',').map(qual => qual.trim())
        : [];
      
      // Check which licenses and equipment this employee has
      const licenseMatrix = {};
      licenses.forEach(license => {
        licenseMatrix[license] = empLicenses.includes(license);
      });
      
      const equipmentMatrix = {};
      equipment.forEach(equip => {
        equipmentMatrix[equip] = empQualifications.some(qual => 
          qual.toLowerCase().includes(equip.toLowerCase()) ||
          equip.toLowerCase().includes(qual.toLowerCase())
        );
      });
      
      return {
        employee: {
          id: employee.id,
          fullName: `${employee.name} ${employee.surname}`,
          position: employee.position,
          nightShiftAllowed: employee.nightShiftAllowed,
          overtimeAllowed: employee.overtimeAllowed
        },
        licenses: licenseMatrix,
        equipment: equipmentMatrix,
        totalLicenses: Object.values(licenseMatrix).filter(Boolean).length,
        totalEquipment: Object.values(equipmentMatrix).filter(Boolean).length
      };
    });
    
    res.json({
      success: true,
      data: {
        matrix,
        headers: {
          licenses,
          equipment
        },
        summary: {
          totalEmployees: employees.length,
          totalLicenseTypes: licenses.length,
          totalEquipmentTypes: equipment.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating qualification matrix:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate qualification matrix',
      details: error.message
    });
  }
});

// GET /api/winter-driver-qualifications/export - Export qualifications report
router.get('/export', async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    
    const employees = await prisma.employee.findMany({
      where: { terminatedAt: null },
      select: {
        name: true,
        surname: true,
        position: true,
        phone: true,
        email: true,
        driversLicenseCategories: true,
        specialQualifications: true,
        hiredAt: true,
        workHours: true,
        nightShiftAllowed: true,
        overtimeAllowed: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Driver Qualifications');
      
      // Set headers
      worksheet.columns = [
        { header: 'Imię', key: 'name', width: 15 },
        { header: 'Nazwisko', key: 'surname', width: 20 },
        { header: 'Stanowisko', key: 'position', width: 25 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Kategorie Prawa Jazdy', key: 'licenses', width: 25 },
        { header: 'Kwalifikacje Zimowe', key: 'winterQuals', width: 40 },
        { header: 'Inne Kwalifikacje', key: 'otherQuals', width: 30 },
        { header: 'Lata Doświadczenia', key: 'experience', width: 15 },
        { header: 'Zmiana Nocna', key: 'nightShift', width: 12 },
        { header: 'Nadgodziny', key: 'overtime', width: 12 }
      ];
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      
      // Add data
      employees.forEach(employee => {
        const qualifications = employee.specialQualifications
          ? employee.specialQualifications.split(',').map(q => q.trim())
          : [];
          
        const winterQuals = qualifications.filter(qual => {
          const qualLower = qual.toLowerCase();
          return qualLower.includes('winter') ||
                 qualLower.includes('snow') ||
                 qualLower.includes('plow') ||
                 qualLower.includes('salt') ||
                 qualLower.includes('spreader');
        }).join(', ');
        
        const otherQuals = qualifications.filter(qual => {
          const qualLower = qual.toLowerCase();
          return !(qualLower.includes('winter') ||
                  qualLower.includes('snow') ||
                  qualLower.includes('plow') ||
                  qualLower.includes('salt') ||
                  qualLower.includes('spreader'));
        }).join(', ');
        
        const experienceYears = employee.hiredAt ? 
          Math.floor((new Date() - new Date(employee.hiredAt)) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
        
        worksheet.addRow({
          name: employee.name,
          surname: employee.surname,
          position: employee.position,
          phone: employee.phone,
          email: employee.email || '',
          licenses: employee.driversLicenseCategories || '',
          winterQuals,
          otherQuals,
          experience: experienceYears,
          nightShift: employee.nightShiftAllowed ? 'Tak' : 'Nie',
          overtime: employee.overtimeAllowed ? 'Tak' : 'Nie'
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
      
      const filename = `winter-driver-qualifications-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      // JSON export
      const processedEmployees = employees.map(employee => {
        const qualifications = employee.specialQualifications
          ? employee.specialQualifications.split(',').map(q => q.trim())
          : [];
          
        const winterQuals = qualifications.filter(qual => {
          const qualLower = qual.toLowerCase();
          return qualLower.includes('winter') ||
                 qualLower.includes('snow') ||
                 qualLower.includes('plow') ||
                 qualLower.includes('salt') ||
                 qualLower.includes('spreader');
        });
        
        return {
          fullName: `${employee.name} ${employee.surname}`,
          position: employee.position,
          phone: employee.phone,
          email: employee.email,
          licenseCategories: employee.driversLicenseCategories
            ? employee.driversLicenseCategories.split(',').map(cat => cat.trim())
            : [],
          winterQualifications: winterQuals,
          experienceYears: employee.hiredAt ? 
            Math.floor((new Date() - new Date(employee.hiredAt)) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          nightShiftAllowed: employee.nightShiftAllowed,
          overtimeAllowed: employee.overtimeAllowed
        };
      });
      
      res.json({
        success: true,
        data: processedEmployees,
        exportedAt: new Date().toISOString(),
        total: processedEmployees.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting qualifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export qualifications',
      details: error.message
    });
  }
});

module.exports = router;