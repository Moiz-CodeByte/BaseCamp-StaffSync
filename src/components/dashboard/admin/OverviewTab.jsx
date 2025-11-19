"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function OverviewTab({ stats }) {
  const statCards = [
    { 
      label: 'Pending Leaves', 
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
    { 
      label: 'Total Requests', 
      value: stats.totalRequests || 0, 
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-1">Leave management statistics and insights</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Leave Requests</span>
            <span className="font-semibold text-lg">{stats.totalRequests || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pending Approval</span>
            <span className="font-semibold text-lg text-yellow-600">{stats.pendingLeaves || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Approved This Month</span>
            <span className="font-semibold text-lg text-green-600">{stats.approvedThisMonth || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rejection Rate</span>
            <span className="font-semibold text-lg text-red-600">
              {stats.totalRequests > 0 
                ? `${Math.round((stats.rejectedLeaves / stats.totalRequests) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
