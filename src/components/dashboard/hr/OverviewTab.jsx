"use client";

import { UserCheck, Users, Calendar } from 'lucide-react';

export default function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          HR Dashboard Summary
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div className="text-sm text-muted-foreground">Pending Leave Requests</div>
          </div>
          <div className="text-3xl font-bold">{stats.pendingLeaves}</div>
        </div>
        
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-muted-foreground">Total Employees</div>
          </div>
          <div className="text-3xl font-bold">{stats.totalEmployees}</div>
        </div>
        
        <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </div>
          <div className="text-3xl font-bold">{stats.upcomingEvents}</div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Review pending leave requests</li>
            <li>• Add events to corporate calendar</li>
            <li>• Manage employee information</li>
            <li>• Generate monthly payroll</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            {stats.pendingLeaves > 0 
              ? `${stats.pendingLeaves} leave request(s) awaiting your approval`
              : 'No pending leave requests'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.upcomingEvents > 0
              ? `${stats.upcomingEvents} upcoming event(s) scheduled`
              : 'No upcoming events'}
          </p>
        </div>
      </div>
    </div>
  );
}
