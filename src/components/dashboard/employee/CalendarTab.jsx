import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

export default function CalendarTab({ attendance, leaves, events = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);

  // Helper to normalize date for comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Helper to format date as string for comparison
  const dateToString = (date) => {
    const d = normalizeDate(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  // Create maps to check overlapping conditions
  const dateMap = {};

  // Map attendance
  attendance.forEach(a => {
    const dateStr = dateToString(a.date);
    if (!dateMap[dateStr]) dateMap[dateStr] = {};
    dateMap[dateStr].attendance = a.status;
  });

  // Map leaves
  leaves.filter(l => l.status === 'Approved').forEach(l => {
    const start = normalizeDate(l.startDate);
    const end = normalizeDate(l.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = dateToString(d);
      if (!dateMap[dateStr]) dateMap[dateStr] = {};
      dateMap[dateStr].leave = l.type;
    }
  });

  // Map events
  events.forEach(e => {
    const dateStr = dateToString(e.date);
    if (!dateMap[dateStr]) dateMap[dateStr] = {};
    dateMap[dateStr].event = e;
  });

  // Create modifiers for calendar with combined colors
  const modifiers = {};
  const modifiersStyles = {};

  // Define base colors
  const colors = {
    present: '#22c55e',
    absent: '#ef4444',
    halfDay: '#f97316',
    leave: '#3b82f6',
    holiday: '#9333ea',
    event: '#eab308'
  };

  // Process each date to determine modifiers
  Object.keys(dateMap).forEach(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month, day);
    const conditions = dateMap[dateStr];
    
    // Create unique modifier key based on conditions
    const conditionKeys = [];
    if (conditions.event?.type === 'Holiday') conditionKeys.push('holiday');
    else if (conditions.event) conditionKeys.push('event');
    if (conditions.leave) conditionKeys.push('leave');
    if (conditions.attendance === 'Present') conditionKeys.push('present');
    if (conditions.attendance === 'Absent') conditionKeys.push('absent');
    if (conditions.attendance === 'Half-Day') conditionKeys.push('halfDay');

    if (conditionKeys.length > 0) {
      const modifierKey = conditionKeys.join('_');
      if (!modifiers[modifierKey]) {
        modifiers[modifierKey] = [];
        
        // Create mixed color for multiple conditions
        if (conditionKeys.length > 1) {
          // Create gradient or split colors
          const gradientColors = conditionKeys.map(k => colors[k]).join(', ');
          modifiersStyles[modifierKey] = {
            background: `linear-gradient(135deg, ${gradientColors})`,
            color: 'white',
            fontWeight: 'bold'
          };
        } else {
          modifiersStyles[modifierKey] = {
            backgroundColor: colors[conditionKeys[0]],
            color: 'white',
            fontWeight: 'bold'
          };
        }
      }
      modifiers[modifierKey].push(date);
    }
  });

  // Get details for selected date
  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;
    const dateStr = dateToString(selectedDate);
    return dateMap[dateStr] || null;
  };

  const selectedDetails = getSelectedDateDetails();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance, Leave & Events Calendar</CardTitle>
          <CardDescription>View your attendance, leaves, and company events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Calendar */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-3xl">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border mx-auto"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                />
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDetails && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDetails.event && (
                    <div className={`p-3 rounded-lg ${selectedDetails.event.type === 'Holiday' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                      <p className="font-semibold text-sm">{selectedDetails.event.type === 'Holiday' ? '🎉' : '📅'} {selectedDetails.event.title}</p>
                      {selectedDetails.event.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedDetails.event.description}</p>
                      )}
                      {selectedDetails.event.type === 'Holiday' && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No attendance counted on holidays</p>
                      )}
                    </div>
                  )}
                  {selectedDetails.attendance && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="font-semibold text-sm">Attendance: {selectedDetails.attendance}</p>
                    </div>
                  )}
                  {selectedDetails.leave && (
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <p className="font-semibold text-sm">Leave: {selectedDetails.leave}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Legend and Recent Activity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span className="text-sm">Half-Day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-sm">Leave (Approved)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <span className="text-sm">Holiday (No attendance counted)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm">Event/Meeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #22c55e, #3b82f6)' }}></div>
                    <span className="text-sm">Multiple (combined colors)</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[
                    ...attendance.map(a => ({ ...a, type: 'attendance', sortDate: a.date })),
                    ...leaves.filter(l => l.status === 'Approved').map(l => ({ ...l, type: 'leave', sortDate: l.startDate })),
                    ...events.map(e => ({ ...e, type: 'event', sortDate: e.date }))
                  ].sort((a, b) => 
                    new Date(b.sortDate) - new Date(a.sortDate)
                  ).slice(0, 10).map((item, idx) => (
                    <div key={idx} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                      <p className="font-medium text-xs">
                        {item.type === 'attendance' && new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {item.type === 'leave' && `${new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {item.type === 'event' && new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type === 'attendance' && item.status}
                        {item.type === 'leave' && `Leave - ${item.type || item.leaveType}`}
                        {item.type === 'event' && `${item.eventType || item.type} - ${item.title}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
