const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Road categories
const ROAD_CATEGORIES = {
  category_1: 'Kategoria I - Autostrady',
  category_2: 'Kategoria II - Drogi ekspresowe',
  category_3: 'Kategoria III - Drogi główne',
  category_4: 'Kategoria IV - Drogi zbiorcze',
  category_5: 'Kategoria V - Drogi lokalne',
  category_6: 'Kategoria VI - Drogi dojazdowe'
};

// Road surface types
const SURFACE_TYPES = {
  asphalt: 'Asfalt',
  concrete: 'Beton',
  paving_stones: 'Kostka brukowa',
  gravel: 'Żwir',
  dirt: 'Gruntowa',
  mixed: 'Mieszana'
};

// Priority levels for winter maintenance
const WINTER_PRIORITIES = {
  critical: 'Krytyczny',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski'
};

// Road condition status
const CONDITION_STATUS = {
  excellent: 'Doskonały',
  good: 'Dobry',
  fair: 'Zadowalający',
  poor: 'Zły',
  critical: 'Krytyczny'
};

// GET /api/winter-road-inventory - Get road inventory overview
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      category,
      surfaceType,
      winterPriority,
      condition,
      regionId,
      isActive = 'true',
      sortBy = 'winterPriority',
      sortOrder = 'desc'
    } = req.query;
    
    const where = {};
    
    if (isActive === 'true') {
      where.isActive = true;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { startPoint: { contains: search, mode: 'insensitive' } },
        { endPoint: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) where.category = category;
    if (surfaceType) where.surfaceType = surfaceType;
    if (winterPriority) where.winterPriority = winterPriority;
    if (condition) where.condition = condition;
    if (regionId) where.regionId = parseInt(regionId);
    
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const roads = await prisma.winterRoadInventory.findMany({
      where,
      include: {
        region: {
          select: {
            id: true,
            name: true,
            unitName: true
          }
        }
      },
      orderBy: [orderBy, { name: 'asc' }]
    });
    
    const processedRoads = roads.map(road => {
      // Parse equipment requirements if stored as JSON
      let equipmentRequired = [];
      try {
        equipmentRequired = road.equipmentRequired ? JSON.parse(road.equipmentRequired) : [];
      } catch (e) {
        equipmentRequired = [];
      }
      
      // Parse special requirements
      let specialRequirements = [];
      try {
        specialRequirements = road.specialRequirements ? JSON.parse(road.specialRequirements) : [];
      } catch (e) {
        specialRequirements = [];
      }
      
      return {
        id: road.id,
        name: road.name,
        description: road.description,
        category: road.category,
        categoryLabel: ROAD_CATEGORIES[road.category] || road.category,
        startPoint: road.startPoint,
        endPoint: road.endPoint,
        length: road.length,
        width: road.width,
        lanes: road.lanes,
        surfaceType: road.surfaceType,
        surfaceTypeLabel: SURFACE_TYPES[road.surfaceType] || road.surfaceType,
        winterPriority: road.winterPriority,
        winterPriorityLabel: WINTER_PRIORITIES[road.winterPriority] || road.winterPriority,
        priorityColor: road.winterPriority === 'critical' ? 'red' :
                      road.winterPriority === 'high' ? 'orange' :
                      road.winterPriority === 'medium' ? 'yellow' : 'green',
        condition: road.condition,
        conditionLabel: CONDITION_STATUS[road.condition] || road.condition,
        maxWeight: road.maxWeight,
        maxHeight: road.maxHeight,
        hasBridges: road.hasBridges,
        hasTunnels: road.hasTunnels,
        hasIntersections: road.hasIntersections,
        equipmentRequired: equipmentRequired,
        specialRequirements: specialRequirements,
        lastInspection: road.lastInspection,
        nextInspection: road.nextInspection,
        winterServiceFrequency: road.winterServiceFrequency,
        notes: road.notes,
        region: road.region,
        isActive: road.isActive,
        createdAt: road.createdAt,
        updatedAt: road.updatedAt
      };
    });
    
    // Generate summary statistics
    const stats = {
      total: processedRoads.length,
      active: processedRoads.filter(r => r.isActive).length,
      totalLength: processedRoads.reduce((sum, road) => sum + (road.length || 0), 0),
      byCategory: {
        category_1: processedRoads.filter(r => r.category === 'category_1').length,
        category_2: processedRoads.filter(r => r.category === 'category_2').length,
        category_3: processedRoads.filter(r => r.category === 'category_3').length,
        category_4: processedRoads.filter(r => r.category === 'category_4').length,
        category_5: processedRoads.filter(r => r.category === 'category_5').length,
        category_6: processedRoads.filter(r => r.category === 'category_6').length
      },
      byPriority: {
        critical: processedRoads.filter(r => r.winterPriority === 'critical').length,
        high: processedRoads.filter(r => r.winterPriority === 'high').length,
        medium: processedRoads.filter(r => r.winterPriority === 'medium').length,
        low: processedRoads.filter(r => r.winterPriority === 'low').length
      },
      byCondition: {
        excellent: processedRoads.filter(r => r.condition === 'excellent').length,
        good: processedRoads.filter(r => r.condition === 'good').length,
        fair: processedRoads.filter(r => r.condition === 'fair').length,
        poor: processedRoads.filter(r => r.condition === 'poor').length,
        critical: processedRoads.filter(r => r.condition === 'critical').length
      },
      withBridges: processedRoads.filter(r => r.hasBridges).length,
      withTunnels: processedRoads.filter(r => r.hasTunnels).length,
      averageLength: processedRoads.length > 0 ? 
        processedRoads.reduce((sum, road) => sum + (road.length || 0), 0) / processedRoads.length : 0
    };
    
    res.json({
      success: true,
      data: processedRoads,
      stats,
      filters: { search, category, surfaceType, winterPriority, condition, regionId, isActive }
    });
    
  } catch (error) {
    console.error('Error fetching road inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch road inventory',
      details: error.message
    });
  }
});

// POST /api/winter-road-inventory - Create new road entry
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      startPoint,
      endPoint,
      length,
      width,
      lanes,
      surfaceType,
      winterPriority,
      condition,
      maxWeight,
      maxHeight,
      hasBridges = false,
      hasTunnels = false,
      hasIntersections = false,
      equipmentRequired = [],
      specialRequirements = [],
      winterServiceFrequency,
      regionId,
      notes,
      isActive = true
    } = req.body;
    
    if (!name || !category || !startPoint || !endPoint || !winterPriority) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, start point, end point, and winter priority are required'
      });
    }
    
    const equipmentJson = JSON.stringify(equipmentRequired);
    const requirementsJson = JSON.stringify(specialRequirements);
    
    const newRoad = await prisma.winterRoadInventory.create({
      data: {
        name,
        description: description || null,
        category,
        startPoint,
        endPoint,
        length: length || null,
        width: width || null,
        lanes: lanes || null,
        surfaceType: surfaceType || null,
        winterPriority,
        condition: condition || 'good',
        maxWeight: maxWeight || null,
        maxHeight: maxHeight || null,
        hasBridges,
        hasTunnels,
        hasIntersections,
        equipmentRequired: equipmentJson,
        specialRequirements: requirementsJson,
        winterServiceFrequency: winterServiceFrequency || null,
        regionId: regionId || null,
        notes: notes || null,
        isActive
      },
      include: { region: true }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...newRoad,
        categoryLabel: ROAD_CATEGORIES[newRoad.category],
        winterPriorityLabel: WINTER_PRIORITIES[newRoad.winterPriority],
        conditionLabel: CONDITION_STATUS[newRoad.condition],
        equipmentRequired: equipmentRequired,
        specialRequirements: specialRequirements
      },
      message: 'Road inventory entry created successfully'
    });
    
  } catch (error) {
    console.error('Error creating road entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create road entry',
      details: error.message
    });
  }
});

// PUT /api/winter-road-inventory/:roadId - Update road entry
router.put('/:roadId', async (req, res) => {
  try {
    const { roadId } = req.params;
    const updateData = { ...req.body };
    
    const existingRoad = await prisma.winterRoadInventory.findUnique({
      where: { id: parseInt(roadId) }
    });
    
    if (!existingRoad) {
      return res.status(404).json({
        success: false,
        error: 'Road entry not found'
      });
    }
    
    // Convert arrays to JSON strings
    if (updateData.equipmentRequired) {
      updateData.equipmentRequired = JSON.stringify(updateData.equipmentRequired);
    }
    if (updateData.specialRequirements) {
      updateData.specialRequirements = JSON.stringify(updateData.specialRequirements);
    }
    
    const updatedRoad = await prisma.winterRoadInventory.update({
      where: { id: parseInt(roadId) },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { region: true }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedRoad,
        categoryLabel: ROAD_CATEGORIES[updatedRoad.category],
        winterPriorityLabel: WINTER_PRIORITIES[updatedRoad.winterPriority],
        conditionLabel: CONDITION_STATUS[updatedRoad.condition],
        equipmentRequired: updatedRoad.equipmentRequired ? JSON.parse(updatedRoad.equipmentRequired) : [],
        specialRequirements: updatedRoad.specialRequirements ? JSON.parse(updatedRoad.specialRequirements) : []
      },
      message: 'Road entry updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating road entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update road entry',
      details: error.message
    });
  }
});

// GET /api/winter-road-inventory/types - Get road types and options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories: Object.entries(ROAD_CATEGORIES).map(([key, label]) => ({
          value: key,
          label
        })),
        surfaceTypes: Object.entries(SURFACE_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        winterPriorities: Object.entries(WINTER_PRIORITIES).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'critical' ? 'red' :
                 key === 'high' ? 'orange' :
                 key === 'medium' ? 'yellow' : 'green'
        })),
        conditionStatus: Object.entries(CONDITION_STATUS).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'excellent' ? 'green' :
                 key === 'good' ? 'blue' :
                 key === 'fair' ? 'yellow' :
                 key === 'poor' ? 'orange' : 'red'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch types',
      details: error.message
    });
  }
});

// GET /api/winter-road-inventory/export - Export road inventory
router.get('/export', async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    
    const roads = await prisma.winterRoadInventory.findMany({
      include: {
        region: {
          select: { name: true, unitName: true }
        }
      },
      orderBy: [
        { winterPriority: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Road Inventory');
      
      worksheet.columns = [
        { header: 'Nazwa', key: 'name', width: 25 },
        { header: 'Kategoria', key: 'category', width: 20 },
        { header: 'Punkt Początkowy', key: 'startPoint', width: 25 },
        { header: 'Punkt Końcowy', key: 'endPoint', width: 25 },
        { header: 'Długość (km)', key: 'length', width: 12 },
        { header: 'Szerokość (m)', key: 'width', width: 12 },
        { header: 'Pasy', key: 'lanes', width: 8 },
        { header: 'Nawierzchnia', key: 'surfaceType', width: 15 },
        { header: 'Priorytet Zimowy', key: 'winterPriority', width: 15 },
        { header: 'Stan', key: 'condition', width: 12 },
        { header: 'Region', key: 'region', width: 20 }
      ];
      
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      
      roads.forEach(road => {
        worksheet.addRow({
          name: road.name,
          category: ROAD_CATEGORIES[road.category] || road.category,
          startPoint: road.startPoint,
          endPoint: road.endPoint,
          length: road.length,
          width: road.width,
          lanes: road.lanes,
          surfaceType: road.surfaceType ? SURFACE_TYPES[road.surfaceType] || road.surfaceType : '',
          winterPriority: WINTER_PRIORITIES[road.winterPriority] || road.winterPriority,
          condition: CONDITION_STATUS[road.condition] || road.condition,
          region: road.region ? `${road.region.name} - ${road.region.unitName}` : ''
        });
      });
      
      const filename = `winter-road-inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      res.json({
        success: true,
        data: roads.map(road => ({
          ...road,
          categoryLabel: ROAD_CATEGORIES[road.category],
          winterPriorityLabel: WINTER_PRIORITIES[road.winterPriority],
          conditionLabel: CONDITION_STATUS[road.condition],
          equipmentRequired: road.equipmentRequired ? JSON.parse(road.equipmentRequired) : [],
          specialRequirements: road.specialRequirements ? JSON.parse(road.specialRequirements) : []
        })),
        exportedAt: new Date().toISOString(),
        total: roads.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting road inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export road inventory',
      details: error.message
    });
  }
});

module.exports = router;