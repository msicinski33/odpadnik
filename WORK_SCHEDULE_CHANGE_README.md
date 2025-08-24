# 📅 Work Schedule Change Module - ODPADnik

## Overview
The Work Schedule Change module enables flexible management of employee shifts through an automated approval workflow. The system allows employees and managers to request schedule modifications, automatically handles approvals based on user roles, and sends email notifications to relevant stakeholders.

## Features

### 🎯 Core Functionality
1. **Employee Search** - Quick search and selection of employees by name
2. **Calendar Visualization** - Monthly calendar view showing current schedule assignments
3. **Multi-day Selection** - Select one or multiple days for batch modifications
4. **Schedule Modifications** - Support for various change types:
   - **Shift Change** - Modify existing shift assignments
   - **Shift Removal** - Remove shifts from the calendar
   - **Shift Addition** - Add new shifts to empty days
   - **Absence Assignment** - Assign various types of absences (vacation, sick leave, etc.)

### 🔄 Approval Workflow
- **Employee Requests** - Regular employees submit requests that require manager approval
- **Manager Changes** - Manager-initiated changes are automatically approved
- **Status Tracking** - Track request status (Pending, Approved, Rejected, Cancelled)
- **Manager Notes** - Managers can add notes when approving/rejecting requests

### 📧 Notification System
- **Approval Requests** - Managers receive notifications when employees submit requests
- **Status Updates** - Employees receive notifications when requests are approved/rejected
- **Change Notifications** - Coordinators and relevant staff receive notifications about approved changes
- **Email Templates** - Structured email templates with change details and context

## Technical Implementation

### Database Models
```prisma
model ScheduleChangeRequest {
  // Core request data
  id                Int      @id @default(autoincrement())
  employeeId        Int
  requestedById     Int
  managerId         Int?
  
  // Change details
  affectedDates     Json     // Array of date strings
  changeType        ScheduleChangeType
  originalShifts    Json?    // Original shift data
  newShifts         Json?    // New shift data
  absenceTypeId     Int?     // For absence assignments
  reason            String?  // Reason for change
  
  // Approval workflow
  status            ScheduleChangeStatus @default(PENDING)
  autoApproved      Boolean  @default(false)
  reviewedAt        DateTime?
  managerNotes      String?
  
  // Relations and notifications
  notifications     ScheduleChangeNotification[]
}

model ScheduleChangeNotification {
  // Email notification tracking
  id                    Int      @id @default(autoincrement())
  scheduleChangeId      Int
  recipientEmail        String
  notificationType      NotificationType
  deliveryStatus        NotificationStatus
  sentAt                DateTime?
}
```

### Backend API Endpoints
- `GET /api/schedule-changes/employees/search` - Search employees
- `GET /api/schedule-changes/employees/:id/schedule/:month` - Get employee schedule
- `GET /api/schedule-changes/absence-types` - Get available absence types
- `POST /api/schedule-changes/requests` - Submit schedule change request
- `GET /api/schedule-changes/requests` - Get all requests (with filtering)
- `GET /api/schedule-changes/requests/:id` - Get specific request details
- `PATCH /api/schedule-changes/requests/:id/review` - Approve/reject request

### Frontend Components
- `WorkScheduleChange.jsx` - Main page component with calendar and request management
- Integration with existing UI components (Calendar, Forms, Modals)
- React Query for data fetching and caching
- Responsive design with Tailwind CSS

## Usage Instructions

### 1. Access the Module
- Navigate to "Zmiany harmonogramu" in the main sidebar
- Module is available to users with `employees:read` permission

### 2. Select an Employee
- Use the search box to find employees by name or surname
- Click on an employee card to select them
- The calendar will automatically load the selected employee's schedule

### 3. View and Select Dates
- Navigate between months using the arrow buttons
- Current shifts are displayed as colored badges on calendar days
- Click on calendar days to select/deselect them for modification
- Multiple days can be selected for batch changes

### 4. Submit Schedule Changes
- Click "Zgłoś zmianę" when days are selected
- Choose the type of change:
  - **Shift Change** - Select new shift type and times
  - **Shift Removal** - Remove existing shifts
  - **Shift Addition** - Add shifts to empty days
  - **Absence Assignment** - Select absence type (vacation, sick leave, etc.)
- Provide a reason for the change
- Submit the request

### 5. Approval Process
- **Employee Requests** - Sent to managers for approval
- **Manager Changes** - Automatically approved and applied
- Email notifications sent to relevant parties
- Status updates visible in the requests list

### 6. Monitor Requests
- View all requests or filter to "My Requests"
- Track status and review history
- Managers can approve/reject pending requests
- Automatic schedule updates upon approval

## Change Types

### Shift Change
- Modify existing shift assignments
- Select from predefined shifts (6-14, 14-22, 22-6, etc.)
- Support for custom hours
- Preserves original shift data for audit trail

### Shift Removal
- Remove shifts from the calendar
- Useful for days off or temporary schedule adjustments
- Original shift data preserved for reference

### Shift Addition
- Add new shifts to previously empty days
- Select from standard shift types
- Support for custom time ranges

### Absence Assignment
- Assign various types of absences
- Integration with existing absence type system
- Creates work card entries for absence tracking
- Supports vacation, sick leave, training, etc.

## Email Notifications

### Notification Types
1. **Approval Request** - To managers when employees submit requests
2. **Approval Granted** - To employees when requests are approved
3. **Approval Denied** - To employees when requests are rejected
4. **Change Notification** - To coordinators when changes are applied

### Email Content
- Employee name and affected dates
- Detailed change information
- Reason for the change
- Manager notes (if applicable)
- Links to system for further action

## Permissions and Security

### Role-Based Access
- **Employees** - Can submit requests for their own schedules
- **Managers** - Can make direct changes and approve/reject requests
- **Administrators** - Full access to all functionality

### Auto-Approval Rules
- Manager-initiated changes are automatically approved
- System immediately applies changes and sends notifications
- Audit trail maintained for all changes

## Integration Points

### Existing Systems
- **Employee Management** - Uses existing employee database
- **Schedule System** - Integrates with current `EmployeeSchedule` model
- **Absence Types** - Uses existing `RodzajAbsencji` system
- **Work Cards** - Creates entries for absence tracking
- **Notification System** - Email infrastructure with delivery tracking

### Data Flow
1. Request submission creates `ScheduleChangeRequest` record
2. Approval workflow updates request status
3. Approved changes modify `EmployeeSchedule` records
4. Absence assignments create `WorkCardEntry` records
5. Email notifications sent with delivery tracking

## Configuration

### Environment Variables
```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@company.com
```

### Database Setup
- Run migrations to create new models
- Existing data remains unchanged
- New relationships added to existing models

## Future Enhancements
- [ ] Bulk request processing
- [ ] Calendar integration (ICS export)
- [ ] Advanced approval workflows
- [ ] Recurring schedule patterns
- [ ] Mobile-responsive improvements
- [ ] Real-time notifications
- [ ] Schedule conflict detection
- [ ] Integration with payroll systems

## Troubleshooting

### Common Issues
1. **Email delivery failures** - Check SMTP configuration
2. **Permission errors** - Verify user roles and permissions
3. **Calendar not loading** - Check employee selection and date range
4. **Request submission fails** - Validate required fields and data

### Support
- Check application logs for detailed error information
- Verify database connections and migrations
- Ensure proper authentication and authorization
- Contact development team for technical issues

## Summary
The Work Schedule Change module provides a comprehensive solution for managing employee schedule modifications with automated approval workflows and notification systems. It seamlessly integrates with existing employee management systems while providing a modern, user-friendly interface for both employees and managers.