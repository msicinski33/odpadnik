# Work Schedule Change Module - Implementation Summary

## Overview
The Work Schedule Change module enables flexible management of employee shifts with an approval workflow system. It provides automatic loading of monthly work schedules, employee search capabilities, multi-day calendar selection, and comprehensive notification system.

## Features Implemented

### 1. Database Schema
**Tables Created:**
- `ScheduleChangeRequest` - Main table for change requests
- `ScheduleChangeDay` - Individual day changes within a request
- `ScheduleChangeNotificationConfig` - Email notification configuration

**Enums:**
- `ScheduleChangeType`: SHIFT_CHANGE, SHIFT_REMOVAL, ABSENCE, OTHER_EVENT
- `ScheduleChangeStatus`: PENDING, APPROVED, REJECTED, AUTO_APPROVED

### 2. Backend API (`/api/schedule-changes`)
**Endpoints:**
- `GET /` - List schedule change requests (with filters and pagination)
- `GET /:id` - Get specific request details
- `POST /` - Create new schedule change request
- `PUT /:id/approve` - Approve a request
- `PUT /:id/reject` - Reject a request with reason
- `GET /notifications/config` - Get notification settings
- `POST /notifications/config` - Configure notifications

**Features:**
- Automatic approval for manager-initiated changes
- Email notifications for all stakeholders
- Permission-based access control
- Integration with existing employee schedule system

### 3. Permissions System
**Added Permissions:**
- `scheduleChanges:read` - View schedule change requests
- `scheduleChanges:create` - Create new requests
- `scheduleChanges:approve` - Approve/reject requests
- `scheduleChanges:auto_approve` - Auto-approve manager changes
- `scheduleChanges:read_all` - View all requests (managers)
- `scheduleChanges:admin` - Full admin access

**Role Assignments:**
- **kierownik**: Full permissions including auto-approval
- **dyspozytor**: Read, create, approve, read_all
- **specjalista**: Read, create, read_all
- **koordynator**: Read, create, approve, read_all
- **pracownik_biurowy**: Read, create
- **kierowca**: Read, create
- **viewer**: Read only

### 4. Frontend Components

#### Main Schedule Changes Page (`/schedule-changes`)
- Comprehensive list view with filters (status, employee, change type)
- Request creation modal with form validation
- Approval/rejection interface for managers
- Real-time status updates and notifications

#### Monthly Schedule Integration
- Right-click context menu on schedule cells
- Quick "Request Change" button with hover effect
- Integrated modal for submitting change requests
- Visual indicators for changeable cells

#### UI Components Created:
- `ScheduleChanges.jsx` - Main page component
- `ScheduleChangeRequestModal.jsx` - Request creation modal
- `Textarea.jsx` - Reusable textarea component

### 5. Email Notification System
**Automatic Notifications:**
- New request notifications to managers
- Approval/rejection notifications to employees and stakeholders
- Configurable recipient lists by role
- Rich HTML email templates with full request details

**Notification Types:**
- New request submitted
- Request approved
- Request rejected (with reason)
- Auto-approved (manager changes)

### 6. Workflow Features

#### Employee Workflow:
1. Navigate to monthly schedule or schedule changes page
2. Select employee and date range
3. Choose change type (shift change, removal, absence, other)
4. Provide reason and description
5. Submit request
6. Receive email confirmation
7. Get notified of approval/rejection

#### Manager Workflow:
1. Receive email notification of new requests
2. View request details in schedule changes page
3. Approve or reject with optional notes/reason
4. Auto-approval for own changes
5. Email notifications sent to all stakeholders

### 7. Integration Points
- **Employee Management**: Links to employee records
- **Absence Types**: Integration with existing absence management
- **Monthly Schedule**: Direct integration with schedule grid
- **User Authentication**: Role-based permissions
- **Email System**: Reuses existing email configuration

## Technical Implementation Details

### Database Relationships:
```
ScheduleChangeRequest
├── employee (Employee)
├── requestedBy (User)
├── approvedBy (User)
├── absenceType (RodzajAbsencji)
└── changeDays (ScheduleChangeDay[])
```

### Key Functions:
- **Auto-approval logic**: Manager roles get instant approval
- **Email queue**: Background email sending with error handling
- **Schedule application**: Automatic update of employee schedules on approval
- **Permission checking**: Granular access control throughout the system

### Security Features:
- Permission-based route protection
- User context validation
- SQL injection protection via Prisma ORM
- Input validation and sanitization

## Usage Instructions

### For Employees:
1. **From Monthly Schedule**: Right-click any schedule cell or use the edit button
2. **From Schedule Changes Page**: Click "Nowy wniosek" button
3. Fill in the request form with change details and reason
4. Submit and wait for approval notification

### For Managers:
1. **Receive Email**: Get notified of new requests automatically
2. **Review Requests**: Go to Schedule Changes page to see all pending requests
3. **Make Decision**: Approve or reject with optional comments
4. **Direct Changes**: Create changes that are auto-approved

### For Administrators:
1. **Configure Notifications**: Set up email recipients by role
2. **Manage Permissions**: Assign schedule change permissions to roles
3. **Monitor System**: View all requests and system usage

## Testing Checklist

To test the complete implementation:

1. **Database Setup**:
   - Run Prisma migration: `npx prisma migrate dev`
   - Run permissions script: `node add-schedule-changes-permissions.js`

2. **Basic Functionality**:
   - Create a schedule change request
   - Verify email notifications are sent
   - Test approval/rejection workflow
   - Check schedule updates after approval

3. **Permission Testing**:
   - Test with different user roles
   - Verify auto-approval for managers
   - Check read/write permissions

4. **Integration Testing**:
   - Test right-click context menu in monthly schedule
   - Verify schedule changes apply to employee schedules
   - Test email notification delivery

5. **Edge Cases**:
   - Test rejection with reason
   - Test multiple day ranges
   - Test different change types
   - Test permission edge cases

## Files Created/Modified

### Backend:
- `backend/prisma/schema.prisma` - Database schema updates
- `backend/routes/scheduleChanges.js` - API routes
- `backend/server.js` - Route registration
- `backend/routes/authMiddleware.js` - Permission updates
- `backend/add-schedule-changes-permissions.js` - Permission setup script

### Frontend:
- `frontend/src/pages/ScheduleChanges.jsx` - Main page
- `frontend/src/components/ScheduleChangeRequestModal.jsx` - Request modal
- `frontend/src/components/ui/textarea.jsx` - UI component
- `frontend/src/pages/MonthlySchedule.jsx` - Integration updates
- `frontend/src/components/AppSidebar.jsx` - Navigation menu
- `frontend/src/App.jsx` - Route registration

## Future Enhancements

Potential improvements for future versions:
1. **Recurring Changes**: Support for recurring schedule change patterns
2. **Bulk Operations**: Apply changes to multiple employees at once
3. **Mobile App**: Mobile interface for quick schedule changes
4. **Calendar Integration**: Export to external calendar systems
5. **Analytics**: Reporting on schedule change patterns and trends
6. **Advanced Notifications**: SMS notifications, in-app notifications
7. **Workflow Rules**: Custom approval workflows based on change type/duration

---

The Work Schedule Change module is now fully implemented and ready for production use. It provides a comprehensive solution for managing employee schedule modifications with proper approval workflows, notifications, and integration with the existing system.