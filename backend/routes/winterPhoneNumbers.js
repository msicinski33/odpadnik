const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/winter-phone-numbers - Get employee phone directory for winter operations
router.get('/', async (req, res) => {
  try {
    const { search, qualifications, driversLicense, activeOnly = 'true' } = req.query;
    
    // Build where clause for filtering
    const where = {};
    
    // Filter active employees only by default
    if (activeOnly === 'true') {
      where.terminatedAt = null;
    }
    
    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { surname: { contains: search } },
        { phone: { contains: search } },
        { position: { contains: search } }
      ];
    }
    
    // Filter by qualifications
    if (qualifications) {
      where.specialQualifications = {
        contains: qualifications
      };
    }
    
    // Filter by driver's license categories
    if (driversLicense) {
      where.driversLicenseCategories = {
        contains: driversLicense
      };
    }
    
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
        terminatedAt: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Parse qualifications and driver's license categories
    const processedEmployees = employees.map(employee => ({
      ...employee,
      fullName: `${employee.name} ${employee.surname}`,
      driversLicenseArray: employee.driversLicenseCategories 
        ? employee.driversLicenseCategories.split(',').map(cat => cat.trim())
        : [],
      qualificationsArray: employee.specialQualifications
        ? employee.specialQualifications.split(',').map(qual => qual.trim())
        : [],
      winterQualifications: employee.specialQualifications
        ? employee.specialQualifications.split(',')
            .map(qual => qual.trim())
            .filter(qual => 
              qual.toLowerCase().includes('winter') ||
              qual.toLowerCase().includes('snow') ||
              qual.toLowerCase().includes('plow') ||
              qual.toLowerCase().includes('salt') ||
              qual.toLowerCase().includes('spreader')
            )
        : [],
      isActive: !employee.terminatedAt
    }));
    
    res.json({
      success: true,
      data: processedEmployees,
      total: processedEmployees.length,
      filters: {
        search,
        qualifications,
        driversLicense,
        activeOnly
      }
    });
    
  } catch (error) {
    console.error('Error fetching phone directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phone directory',
      details: error.message
    });
  }
});

// GET /api/winter-phone-numbers/export - Export phone directory to Excel
router.get('/export', async (req, res) => {
  try {
    const { search, qualifications, driversLicense, activeOnly = 'true', format = 'excel' } = req.query;
    
    // Use same filtering logic as main endpoint
    const where = {};
    
    if (activeOnly === 'true') {
      where.terminatedAt = null;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { surname: { contains: search } },
        { phone: { contains: search } },
        { position: { contains: search } }
      ];
    }
    
    if (qualifications) {
      where.specialQualifications = {
        contains: qualifications
      };
    }
    
    if (driversLicense) {
      where.driversLicenseCategories = {
        contains: driversLicense
      };
    }
    
    const employees = await prisma.employee.findMany({
      where,
      select: {
        name: true,
        surname: true,
        position: true,
        phone: true,
        email: true,
        driversLicenseCategories: true,
        specialQualifications: true,
        hiredAt: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });
    
    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Winter Phone Directory');
      
      // Set headers
      worksheet.columns = [
        { header: 'Imię', key: 'name', width: 15 },
        { header: 'Nazwisko', key: 'surname', width: 20 },
        { header: 'Stanowisko', key: 'position', width: 25 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Kategorie Prawa Jazdy', key: 'driversLicense', width: 20 },
        { header: 'Kwalifikacje Zimowe', key: 'winterQualifications', width: 35 },
        { header: 'Data Zatrudnienia', key: 'hiredAt', width: 15 }
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
        const winterQuals = employee.specialQualifications
          ? employee.specialQualifications.split(',')
              .map(qual => qual.trim())
              .filter(qual => 
                qual.toLowerCase().includes('winter') ||
                qual.toLowerCase().includes('snow') ||
                qual.toLowerCase().includes('plow') ||
                qual.toLowerCase().includes('salt') ||
                qual.toLowerCase().includes('spreader')
              )
              .join(', ')
          : '';
          
        worksheet.addRow({
          name: employee.name,
          surname: employee.surname,
          position: employee.position,
          phone: employee.phone,
          email: employee.email || '',
          driversLicense: employee.driversLicenseCategories || '',
          winterQualifications: winterQuals,
          hiredAt: employee.hiredAt ? new Date(employee.hiredAt).toLocaleDateString('pl-PL') : ''
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.key !== 'winterQualifications') {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 10 ? 10 : maxLength + 2;
        }
      });
      
      // Set response headers for Excel file
      const filename = `winter-phone-directory-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      // JSON export
      const processedEmployees = employees.map(employee => ({
        fullName: `${employee.name} ${employee.surname}`,
        name: employee.name,
        surname: employee.surname,
        position: employee.position,
        phone: employee.phone,
        email: employee.email,
        driversLicense: employee.driversLicenseCategories,
        winterQualifications: employee.specialQualifications
          ? employee.specialQualifications.split(',')
              .map(qual => qual.trim())
              .filter(qual => 
                qual.toLowerCase().includes('winter') ||
                qual.toLowerCase().includes('snow') ||
                qual.toLowerCase().includes('plow') ||
                qual.toLowerCase().includes('salt') ||
                qual.toLowerCase().includes('spreader')
              )
              .join(', ')
          : '',
        hiredAt: employee.hiredAt
      }));
      
      res.json({
        success: true,
        data: processedEmployees,
        exportedAt: new Date().toISOString(),
        total: processedEmployees.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting phone directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export phone directory',
      details: error.message
    });
  }
});

// GET /api/winter-phone-numbers/qualifications - Get unique winter qualifications for filtering
router.get('/qualifications', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        terminatedAt: null,
        specialQualifications: {
          not: null
        }
      },
      select: {
        specialQualifications: true
      }
    });
    
    // Extract and deduplicate qualifications
    const allQualifications = new Set();
    const winterQualifications = new Set();
    
    employees.forEach(employee => {
      if (employee.specialQualifications) {
        const quals = employee.specialQualifications.split(',').map(q => q.trim());
        quals.forEach(qual => {
          allQualifications.add(qual);
          
          // Check if it's winter-related
          if (qual.toLowerCase().includes('winter') ||
              qual.toLowerCase().includes('snow') ||
              qual.toLowerCase().includes('plow') ||
              qual.toLowerCase().includes('salt') ||
              qual.toLowerCase().includes('spreader')) {
            winterQualifications.add(qual);
          }
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        winterQualifications: Array.from(winterQualifications).sort(),
        allQualifications: Array.from(allQualifications).sort()
      }
    });
    
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch qualifications',
      details: error.message
    });
  }
});

// GET /api/winter-phone-numbers/driver-licenses - Get unique driver license categories
router.get('/driver-licenses', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        terminatedAt: null,
        driversLicenseCategories: {
          not: null
        }
      },
      select: {
        driversLicenseCategories: true
      }
    });
    
    // Extract and deduplicate license categories
    const allCategories = new Set();
    
    employees.forEach(employee => {
      if (employee.driversLicenseCategories) {
        const categories = employee.driversLicenseCategories.split(',').map(cat => cat.trim());
        categories.forEach(category => {
          allCategories.add(category);
        });
      }
    });
    
    res.json({
      success: true,
      data: Array.from(allCategories).sort()
    });
    
  } catch (error) {
    console.error('Error fetching driver licenses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver licenses',
      details: error.message
    });
  }
});

// GET /api/winter-phone-numbers/emergency-contacts - Get priority contacts for winter operations
router.get('/emergency-contacts', async (req, res) => {
  try {
    // Get employees with management positions or winter-specific roles
    const emergencyContacts = await prisma.employee.findMany({
      where: {
        terminatedAt: null,
        OR: [
          { position: { contains: 'kierownik' } },
          { position: { contains: 'dyrektor' } },
          { position: { contains: 'koordynator' } },
          { position: { contains: 'dyspozytor' } },
          { position: { contains: 'winter' } },
          { position: { contains: 'Kierownik' } },
          { position: { contains: 'Dyrektor' } },
          { position: { contains: 'Koordynator' } },
          { position: { contains: 'Dyspozytor' } },
          { position: { contains: 'Winter' } },
          { specialQualifications: { contains: 'supervisor' } },
          { specialQualifications: { contains: 'winter' } },
          { specialQualifications: { contains: 'Supervisor' } },
          { specialQualifications: { contains: 'Winter' } }
        ]
      },
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        phone: true,
        email: true,
        specialQualifications: true
      },
      orderBy: [
        { position: 'asc' },
        { surname: 'asc' }
      ]
    });
    
    res.json({
      success: true,
      data: emergencyContacts.map(contact => ({
        ...contact,
        fullName: `${contact.name} ${contact.surname}`,
        priority: (contact.position && contact.position.toLowerCase().includes('dyrektor')) ? 'HIGH' :
                 (contact.position && contact.position.toLowerCase().includes('kierownik')) ? 'HIGH' :
                 (contact.position && contact.position.toLowerCase().includes('dyspozytor')) ? 'MEDIUM' : 'NORMAL'
      }))
    });
    
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency contacts',
      details: error.message
    });
  }
});

module.exports = router;