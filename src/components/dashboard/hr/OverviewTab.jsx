"use client";

import { UserCheck, Users, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function OverviewTab({ stats, recentlyApproved }) {
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

      {/* Recently Approved Leaves */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold">Recently Approved Leaves</h3>
              <p className="text-sm text-muted-foreground">Last 10 approved leave requests</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {recentlyApproved && recentlyApproved.length > 0 ? (
            <div className="space-y-4">
              {recentlyApproved.map((leave) => (
                <div key={leave._id} className="flex items-start gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold">{leave.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {leave.user?.department || 'N/A'} • {leave.user?.role || 'Employee'}
                        </p>
                      </div>
                      <span className="text-xs bg-green-600 dark:bg-green-700 text-white px-2 py-1 rounded-full whitespace-nowrap">
                        {leave.leaveType}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Duration:</span> {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                      </p>
                      {leave.reason && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Reason:</span> {leave.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Approved on {format(new Date(leave.updatedAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recently approved leaves
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
