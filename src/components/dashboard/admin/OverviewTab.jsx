"use client";

import { Users, UserCheck, FileText, Calendar, TrendingUp } from 'lucide-react';

export default function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete system statistics and insights
        </p> 
      </div> */}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-3xl font-bold">{stats.totalUsers}</div>
        </div>
        
        <div className="rounded-lg border bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="text-sm text-muted-foreground">Admins</div>
          </div>
          <div className="text-3xl font-bold">{stats.admins}</div>
        </div>
        
        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="text-sm text-muted-foreground">HR Staff</div>
          </div>
          <div className="text-3xl font-bold">{stats.hrStaff}</div>
        </div>
        
        <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="text-sm text-muted-foreground">Employees</div>
          </div>
          <div className="text-3xl font-bold">{stats.employees}</div>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div className="text-sm text-muted-foreground">Pending Leaves</div>
          </div>
          <div className="text-3xl font-bold">{stats.pendingLeaves}</div>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </div>
          <div className="text-3xl font-bold">{stats.upcomingEvents}</div>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="text-sm text-muted-foreground">Present Employees</div>
          </div>
          <div className="text-3xl font-bold">{stats.presentToday}</div>
          <div className="text-xs text-muted-foreground mt-2">Today (including half-day)</div>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="text-sm text-muted-foreground">Absent Employees</div>
          </div>
          <div className="text-3xl font-bold">{stats.absentToday}</div>
          <div className="text-xs text-muted-foreground mt-2">Today</div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Add new users to the system</li>
            <li>• Review and approve pending leave requests</li>
            <li>• Manage attendance records</li>
            <li>• Create calendar events and holidays</li>
            <li>• Generate payroll for all employees</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <p className="text-sm text-muted-foreground">
            {stats.pendingLeaves > 0 
              ? `${stats.pendingLeaves} leave request(s) require your attention`
              : 'All leave requests have been processed'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.upcomingEvents > 0
              ? `${stats.upcomingEvents} upcoming event(s) scheduled`
              : 'No upcoming events'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Today&apos;s attendance: {stats.presentToday} present, {stats.absentToday} absent
          </p>
        </div>
      </div>
    </div>
  );
}
