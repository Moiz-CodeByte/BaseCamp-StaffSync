import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from './StatusBadge';

export default function AttendanceTab({ checkIn, checkOut, todayAttendance, attendance }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription>Mark your check-in and check-out time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkIn} disabled={todayAttendance?.checkInAt} className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              {todayAttendance?.checkInAt ? 'Already Checked In' : 'Check In'}
            </Button>
            <Button onClick={checkOut} disabled={!todayAttendance?.checkInAt || todayAttendance?.checkOutAt} variant="outline" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              {todayAttendance?.checkOutAt ? 'Already Checked Out' : 'Check Out'}
            </Button>
          </div>
          {todayAttendance && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium mb-2">Today&apos;s Record:</p>
              {todayAttendance.checkInAt && <p className="text-sm">Check In: {new Date(todayAttendance.checkInAt).toLocaleTimeString()}</p>}
              {todayAttendance.checkOutAt && <p className="text-sm">Check Out: {new Date(todayAttendance.checkOutAt).toLocaleTimeString()}</p>}
              <div className="mt-2"><StatusBadge status={todayAttendance.status} /></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendance.map((att, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  <p className="text-sm text-gray-500">
                    {att.checkInAt && `In: ${new Date(att.checkInAt).toLocaleTimeString()}`}
                    {att.checkOutAt && ` | Out: ${new Date(att.checkOutAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <StatusBadge status={att.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
