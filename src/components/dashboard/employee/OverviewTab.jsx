"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OverviewTab({ stats, leaves }) {
  const statCards = [
    { 
      label: 'Total Leave Days', 
      value: stats.totalLeaveDays || 0, 
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    { 
      label: 'Pending Requests', 
      value: stats.pendingLeaves || 0, 
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    { 
      label: 'Approved Leaves', 
      value: stats.approvedLeaves || 0, 
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20'
    },
    { 
      label: 'Rejected Leaves', 
      value: stats.rejectedLeaves || 0, 
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20'
    },
  ];

  const recentLeaves = leaves?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Overview</h1>
        <p className="text-muted-foreground mt-1">Your leave statistics and recent activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recentLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{leave.type} Leave</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={
                    leave.status === 'Approved' ? 'default' :
                    leave.status === 'Rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leave Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Approved Days</span>
            <span className="font-semibold text-lg">{stats.totalLeaveDays || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pending Approval</span>
            <span className="font-semibold text-lg text-yellow-600">{stats.pendingLeaves || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold text-lg text-green-600">
              {(stats.approvedLeaves + stats.rejectedLeaves) > 0 
                ? `${Math.round((stats.approvedLeaves / (stats.approvedLeaves + stats.rejectedLeaves)) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
