# HR Dashboard Components

## Overview
Modular component architecture for the HR dashboard, featuring a sidebar navigation system with separate tab components for each HR function.

## Architecture

### Component Structure
```
src/components/dashboard/hr/
├── HRSidebar.jsx          # Navigation sidebar with tab menu
├── OverviewTab.jsx        # Dashboard summary with stats
├── LeavesTab.jsx          # Leave request management
├── CalendarTab.jsx        # Corporate calendar with events
├── EmployeesTab.jsx       # Employee management wrapper
├── PayrollTab.jsx         # Payroll management wrapper
├── index.js               # Barrel exports
└── README.md              # This file
```

## Components

### 1. HRSidebar
**Purpose**: Navigation menu for switching between HR functions

**Props**:
- `activeTab` (string): Currently active tab ('overview', 'leaves', 'calendar', 'employees', 'payroll')
- `onTabChange` (function): Callback when tab is clicked

**Features**:
- 5 navigation items with icons (Lucide React)
- Active tab highlighting with conditional styling
- Responsive design with fixed width sidebar

**Usage**:
```jsx
<HRSidebar activeTab={activeTab} onTabChange={setActiveTab} />
```

---

### 2. OverviewTab
**Purpose**: Dashboard summary showing key metrics and quick information

**Props**:
- `stats` (object): Statistics object with:
  - `pendingLeaves` (number): Count of pending leave requests
  - `totalEmployees` (number): Total number of employees managed
  - `upcomingEvents` (number): Count of upcoming calendar events

**Features**:
- 3 gradient stat cards with visual appeal
- Quick Actions section (placeholder for future features)
- Recent Activity section (placeholder for activity feed)

**Usage**:
```jsx
<OverviewTab stats={{ pendingLeaves: 5, totalEmployees: 20, upcomingEvents: 3 }} />
```

---

### 3. LeavesTab
**Purpose**: Manage employee leave requests with approve/reject actions

**Props**:
- `leaves` (array): Array of leave request objects
- `onAction` (function): Callback when approve/reject is clicked `(leaveId, action) => {}`

**Features**:
- Table view with employee info, leave type, duration, dates, reason
- Approve/Reject action buttons
- Duration calculation (days)
- Empty state when no pending requests
- Responsive table design

**Usage**:
```jsx
<LeavesTab 
  leaves={pendingLeaves} 
  onAction={(id, action) => handleLeaveAction(id, action)} 
/>
```

---

### 4. CalendarTab
**Purpose**: Corporate calendar for managing company-wide events and holidays

**Props**:
- `events` (array): Array of event objects
- `onEventCreate` (function): Callback when creating new event `(eventData) => {}`
- `onEventDelete` (function): Callback when deleting event `(eventId) => {}`

**Features**:
- Collapsible event creation form with toggle button
- Event type selection (Meeting, Holiday, Training, Team Event)
- Event cards with date formatting, type badges, descriptions
- Delete functionality for each event
- Empty state with icon

**Form Fields**:
- Event Title (required)
- Event Type (select dropdown)
- Date (date picker, required)
- Description (optional textarea)

**Usage**:
```jsx
<CalendarTab 
  events={events}
  onEventCreate={(data) => handleEventCreate(data)}
  onEventDelete={(id) => handleEventDelete(id)}
/>
```

---

### 5. EmployeesTab
**Purpose**: Employee management wrapper component

**Props**:
- `users` (array): Array of employee user objects
- `onUpdate` (function): Callback after employee update

**Features**:
- Wraps existing `UserManagementTable` component
- Provides consistent header and layout
- Handles employee CRUD operations

**Usage**:
```jsx
<EmployeesTab users={employees} onUpdate={loadUsers} />
```

**Dependencies**:
- Uses `@/components/dashboard/UserManagementTable`

---

### 6. PayrollTab
**Purpose**: Payroll management wrapper component

**Props**: None (self-contained)

**Features**:
- Wraps existing `PayrollManagementOptimized` component
- Provides consistent header and layout
- Handles all payroll operations internally

**Usage**:
```jsx
<PayrollTab />
```

**Dependencies**:
- Uses `@/components/dashboard/payroll/PayrollManagementOptimized`

---

## Main Page Integration

### src/app/dashboard/hr/page.jsx

**State Management**:
```jsx
const [activeTab, setActiveTab] = useState('overview');
const [pending, setPending] = useState([]);
const [events, setEvents] = useState([]);
const [users, setUsers] = useState([]);
const [stats, setStats] = useState({ 
  pendingLeaves: 0, 
  totalEmployees: 0, 
  upcomingEvents: 0 
});
```

**Data Loading**:
- Fetches data on mount using `useEffect`
- Parallel API calls with `Promise.all`:
  - `/api/leaves/manage` - Leave requests
  - `/api/calendar/events` - Calendar events
  - `/api/users/list` - Employee list
- Filters users to show only Employees (excludes Admin/HR)
- Calculates stats dynamically

**Layout**:
```jsx
<div className="flex h-screen">
  <HRSidebar activeTab={activeTab} onTabChange={setActiveTab} />
  <div className="flex-1 overflow-auto">
    <div className="p-6 max-w-7xl mx-auto">
      {/* Conditional tab rendering */}
    </div>
  </div>
</div>
```

**Event Handlers**:
- `handleLeaveAction(leaveId, action)` - Approve/reject leaves
- `handleEventCreate(eventData)` - Create calendar events
- `handleEventDelete(eventId)` - Delete calendar events
- `loadUsers()` - Reload employee list

---

## Benefits

### Code Organization
- **Separation of Concerns**: Each tab in its own component
- **Maintainability**: Easy to update individual features
- **Reusability**: Components can be used elsewhere if needed
- **Readability**: Main page reduced from 200+ lines to ~120 lines

### User Experience
- **Clean Navigation**: Sidebar menu similar to employee dashboard
- **Focused Views**: One function at a time, less overwhelming
- **Consistent Layout**: Same header pattern across all tabs
- **Performance**: Only active tab is rendered

### Development
- **Easier Testing**: Isolated components
- **Parallel Development**: Multiple devs can work on different tabs
- **Debugging**: Errors isolated to specific components
- **Documentation**: Each component self-documented

---

## Role-Based Restrictions

**HR Role Limitations**:
- Can only manage **Employee** role users (not Admin or HR)
- Cannot change user roles (only Admin can)
- All user lists are filtered on the backend and frontend

**Implementation**:
```jsx
const employeesOnly = usersList.filter(u => u.role === 'Employee');
setUsers(employeesOnly);
```

---

## Future Enhancements

### Potential Features
1. **Recent Activity Feed**: Show real-time updates in OverviewTab
2. **Quick Actions**: Add shortcuts in OverviewTab for common tasks
3. **Advanced Filtering**: Filter leaves by date range, type, employee
4. **Calendar Integration**: Sync with external calendars (Google, Outlook)
5. **Bulk Operations**: Approve/reject multiple leaves at once
6. **Notifications**: Real-time alerts for new leave requests
7. **Export Options**: Export employee data, payroll reports
8. **Search Functionality**: Search across all tabs

### Code Improvements
1. Add loading states for each tab
2. Implement error boundaries
3. Add skeleton loaders during data fetch
4. Optimize re-renders with `useMemo` and `useCallback`
5. Add unit tests for each component

---

## Dependencies

### UI Components (shadcn/ui)
- `Button` - Action buttons
- `Input` - Form inputs
- `Label` - Form labels
- `Textarea` - Multi-line text input
- `Card`, `CardContent` - Layout containers
- `Badge` - Status indicators

### Icons (Lucide React)
- `LayoutDashboard` - Overview tab
- `FileText` - Leaves tab
- `Calendar` - Calendar tab
- `Users` - Employees tab
- `DollarSign` - Payroll tab
- `Plus`, `X` - Action icons

### Utilities
- `date-fns` - Date formatting (not directly used, but recommended)
- Custom hooks from existing components

---

## Migration Notes

### From Old HR Page
The original `src/app/dashboard/hr/page.jsx` (203 lines) has been refactored to:
- Main page: ~120 lines (state management, data loading, routing)
- 6 separate tab components: ~600 total lines
- Better organized, more maintainable codebase

### Breaking Changes
None - all existing functionality preserved

### Data Flow Remains Same
- Same API endpoints
- Same state management pattern
- Same business logic

---

## Comparison with Employee Dashboard

Both dashboards now follow the same architectural pattern:

| Feature | Employee Dashboard | HR Dashboard |
|---------|-------------------|--------------|
| Sidebar Navigation | ✅ Yes | ✅ Yes |
| Modular Tabs | ✅ Yes | ✅ Yes |
| Overview Stats | ✅ Yes | ✅ Yes |
| Component Count | 10 components | 6 components |
| Main Page Lines | 243 lines | ~120 lines |
| Total Components Lines | ~1000 lines | ~600 lines |

**Consistency Benefits**:
- Similar UX across different user roles
- Easier onboarding for developers
- Shared component patterns and styles
- Unified codebase architecture

---

## Summary

The HR dashboard has been successfully modularized following the same pattern as the employee dashboard. This refactoring improves:
- **Code Quality**: Better organization, easier to maintain
- **Developer Experience**: Faster feature development, easier debugging
- **User Experience**: Cleaner interface, focused navigation
- **Scalability**: Easy to add new tabs or features

All existing functionality has been preserved while significantly improving the codebase structure.
