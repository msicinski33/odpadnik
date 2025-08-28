# ❄️ Winter Action Module (Akcja Zima) - Documentation

## Overview

The Winter Action Module is a comprehensive command center for winter road maintenance operations in the ODPADnik waste management system. It provides specialized tools for managing winter-specific activities including snow removal, road salting, sidewalk clearing, and resource coordination during winter conditions.

## Module Architecture

The Winter Action Module follows the ODPADnik three-tier architecture:

- **Database Layer**: 10+ specialized winter tables with referential integrity to core entities
- **Backend API**: 10 comprehensive RESTful endpoints with full CRUD operations
- **Frontend UI**: React components with tab-based navigation and real-time updates

## Core Features

### 1. 📞 Phone Numbers Directory (Książka Telefoniczna)
**Purpose**: Centralized contact directory for winter operations personnel

**Features**:
- Employee contact management with emergency priorities
- Advanced search and filtering capabilities
- Quick access to critical contact information
- Excel export functionality for offline reference

**Usage**:
- Access via Winter Action → Phone Numbers tab
- Search by name, position, or phone number
- Mark contacts as emergency for priority display
- Export contact lists for field teams

### 2. 🚗 Driver Qualifications (Kwalifikacje Kierowców)
**Purpose**: Track driver licenses and winter equipment certifications

**Features**:
- Driver license category management (A, B, C, D, T, etc.)
- Winter equipment operation qualifications
- Qualification matrix view for assignment planning
- Expiration date tracking and alerts

**Usage**:
- Monitor driver qualifications for winter operations
- Assign drivers based on equipment requirements
- Track certification renewals and training needs

### 3. 🔧 Vehicle Readiness (Gotowość Pojazdów)
**Purpose**: Timeline-based vehicle operational status tracking

**Features**:
- Real-time vehicle status monitoring
- Equipment configuration tracking (plows, spreaders, etc.)
- Maintenance and repair status updates
- Historical operational timeline

**Usage**:
- Update vehicle status before winter operations
- Track equipment availability and readiness
- Monitor maintenance requirements

### 4. 📋 Daily Operational Plans (Plany Dzienne AZ)
**Purpose**: Create and manage daily winter operation assignments

**Features**:
- Static list (AZ) generation for daily operations
- Weather-based planning with forecast integration
- Shift management (day/night/emergency)
- PDF report generation for field distribution
- Supervisor assignment and approval workflow

**Usage**:
- Create daily operational plans based on weather conditions
- Assign vehicles and personnel to specific tasks
- Generate PDF reports for distribution to field teams

### 5. 🗺️ Winter Routes (Trasy Zimowe)
**Purpose**: Detailed route planning with step-by-step instructions

**Features**:
- Interactive route creation and editing
- Street-by-street navigation instructions
- Priority-based route classification
- Distance and time estimation
- Route assignment to vehicles and drivers

**Usage**:
- Plan efficient snow removal and salting routes
- Provide detailed instructions for drivers
- Optimize route coverage and timing

### 6. 🚶 Sidewalks (Chodniki PGM)
**Purpose**: Manage sidewalk clearing assignments and tracking

**Features**:
- Sidewalk inventory with priority classification
- Assignment management for clearing personnel
- Progress tracking and completion status
- Equipment requirements specification

**Usage**:
- Assign sidewalk clearing tasks to personnel
- Track completion status and quality
- Coordinate with main road operations

### 7. 🚌 Bus Stops & Bins (Przystanki i Kosze)
**Purpose**: Maintain public transport stops and street furniture

**Features**:
- Bus stop and street bin inventory
- Maintenance assignment scheduling
- Map-based visualization (planned feature)
- Special access requirement tracking

**Usage**:
- Schedule regular maintenance during winter
- Coordinate with public transport authorities
- Ensure accessibility during snow conditions

### 8. 🛣️ Road Inventory (Inwentarz Dróg)
**Purpose**: Comprehensive road categorization and management

**Features**:
- Road classification by category (I-VI)
- Winter priority assignment
- Technical specifications tracking
- Bridge and tunnel identification
- Export and reporting capabilities

**Usage**:
- Categorize roads for winter maintenance priority
- Track technical limitations and requirements
- Generate inventory reports for planning

### 9. 🧂 Materials Tracking (Materiały)
**Purpose**: Salt and sand consumption monitoring with analytics

**Features**:
- Real-time stock level monitoring
- Consumption tracking by route and vehicle
- Weather correlation analysis
- Supplier and delivery management
- Cost tracking and budgeting tools

**Usage**:
- Monitor material consumption patterns
- Optimize stock levels and procurement
- Track costs and budget compliance

### 10. 📊 Winter Dashboard (Dashboard Zimowy)
**Purpose**: Central command center with real-time operational overview

**Features**:
- Weather integration and alerts
- Key performance indicators (KPIs)
- Quick action buttons for common tasks
- Real-time activity monitoring
- Alert and notification management

**Usage**:
- Monitor overall winter operation status
- Access quick actions for urgent tasks
- View consolidated operational metrics

## Technical Implementation

### Database Schema
The module uses specialized tables that maintain referential integrity with core ODPADnik entities:

- `WinterVehicleStatus` - Vehicle operational status timeline
- `WinterRoute` + `WinterRouteStep` - Route plans with detailed instructions
- `WinterSidewalk` + `WinterSidewalkAssignment` - Sidewalk management
- `WinterBusStop` + `WinterBusStopAssignment` - Public infrastructure
- `WinterRoadInventory` - Road categorization and specs
- `WinterMaterialStock` + `WinterMaterialConsumption` - Resource tracking
- `WinterDailyPlan` + `WinterDailyPlanAssignment` - Daily operations

### API Endpoints
All endpoints follow RESTful conventions with authentication middleware:

- `/api/winter-phone-numbers` - Contact directory
- `/api/winter-driver-qualifications` - Driver certifications
- `/api/winter-vehicle-readiness` - Vehicle status
- `/api/winter-daily-plan` - Daily operational planning
- `/api/winter-routes` - Route management
- `/api/winter-sidewalks` - Sidewalk operations
- `/api/winter-bus-stops` - Public infrastructure
- `/api/winter-road-inventory` - Road management
- `/api/winter-materials` - Material tracking
- `/api/winter-dashboard` - Analytics and metrics

### Permission System
Role-based access control with granular permissions:

- **Admin**: Full access to all winter operations
- **Kierownik**: Complete winter module management
- **Specjalista**: Operational planning and execution
- **Koordynator**: Assignment and resource coordination
- **Dyspozytor**: Status monitoring and updates
- **Pracownik Biurowy**: Read access and basic data entry
- **Kierowca**: Status updates and material consumption

## Navigation and Access

### Main Navigation
Access the Winter Action Module through:
1. Sidebar navigation: "❄️ Akcja Zima" menu item
2. Main dashboard: "❄️ Akcja Zima" action card
3. Direct URL: `/winter-action`

### Tab Navigation
The module uses a tab-based interface for easy switching between functions:
- Each sub-module is accessible via dedicated tabs
- Consistent navigation with breadcrumb support
- Permission-based tab visibility

## Best Practices

### Operational Workflow
1. **Planning Phase**: Review weather forecasts and create daily plans
2. **Assignment Phase**: Assign routes, vehicles, and personnel
3. **Execution Phase**: Monitor progress and update statuses
4. **Reporting Phase**: Generate reports and analyze performance

### Data Management
- Regular backup of winter operational data
- Archive completed operations for historical analysis
- Maintain current contact information
- Update vehicle and equipment status regularly

### Integration Points
- Weather service integration for forecasting
- Vehicle tracking system integration
- Material supplier system integration
- Public transport coordination interfaces

## Troubleshooting

### Common Issues
1. **Permission Denied**: Verify user role has appropriate winter action permissions
2. **Data Not Loading**: Check API endpoint availability and authentication
3. **Export Failures**: Ensure sufficient disk space and file permissions

### Support
For technical support or feature requests:
- Check system logs for error details
- Verify database connectivity and schema integrity
- Contact system administrator for permission issues

## Future Enhancements

### Planned Features
- Real-time GPS tracking integration
- Weather API automation
- Mobile app for field operations
- Advanced analytics and AI-powered optimization
- Integration with municipal traffic systems

### Customization Options
- Configurable alert thresholds
- Custom report templates
- Role-specific dashboard views
- Workflow automation rules

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Author**: ODPADnik Development Team