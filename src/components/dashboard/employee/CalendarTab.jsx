import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { parseISO } from 'date-fns';

export default function CalendarTab({ attendance, leaves }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance & Leave Calendar</CardTitle>
          <CardDescription>View your attendance and leaves on the calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Calendar */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-3xl">
                <Calendar
                  mode="single"
                  className="rounded-md border mx-auto"
                  modifiers={{
                    present: attendance
                      .filter(a => a.status === 'Present')
                      .map(a => parseISO(a.date.split('T')[0])),
                    absent: attendance
                      .filter(a => a.status === 'Absent')
                      .map(a => parseISO(a.date.split('T')[0])),
                    halfDay: attendance
                      .filter(a => a.status === 'Half-Day')
                      .map(a => parseISO(a.date.split('T')[0])),
                    leave: leaves
                      .filter(l => l.status === 'Approved')
                      .flatMap(l => {
                        const dates = [];
                        const start = parseISO(l.startDate.split('T')[0]);
                        const end = parseISO(l.endDate.split('T')[0]);
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                          dates.push(new Date(d));
                        }
                        return dates;
                      }),
                  }}
                  modifiersStyles={{
                    present: { backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold' },
                    absent: { backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' },
                    halfDay: { backgroundColor: '#f97316', color: 'white', fontWeight: 'bold' },
                    leave: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                  }}
                />
              </div>
            </div>
            
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
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...attendance, ...leaves.filter(l => l.status === 'Approved')].sort((a, b) => 
                    new Date(b.date || b.startDate) - new Date(a.date || a.startDate)
                  ).slice(0, 10).map((item, idx) => (
                    <div key={idx} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                      <p className="font-medium text-xs">
                        {item.date 
                          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : `${new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        }
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.date ? item.status : `Leave - ${item.type}`}
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
