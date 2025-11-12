"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAttendanceTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View and manage attendance records for all employees. This feature allows you to:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• View attendance history for all users</li>
            <li>• Mark employees as Present/Absent/Half-Day manually</li>
            <li>• Generate attendance reports</li>
            <li>• Track attendance patterns and statistics</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium">Coming Soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              Advanced attendance management features will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
