"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OverviewTab({ stats, recentlyApproved, isLoading = false }) {

  const statCards = [
    { 
      label: 'Pending Leaves', 
      value: stats?.pendingLeaves || 0, 
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    { 
      label: 'Recently Approved', 
      value: recentlyApproved?.length || 0, 
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20'
    },
    { 
      label: 'Total Employees', 
      value: stats?.totalEmployees || 0, 
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    { 
      label: 'This Month', 
      value: stats.leavesThisMonth || 0, 
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Leave management dashboard and recent activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`hover:shadow-lg transition-shadow ${isLoading ? 'relative overflow-hidden' : ''}`}>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-shimmer" 
                     style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
              )}
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg} ${isLoading ? 'opacity-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recentlyApproved && recentlyApproved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Approved Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyApproved.slice(0, 5).map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{leave.user?.name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="default">{leave.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Leaves Awaiting Approval</span>
            <span className="font-semibold text-lg text-yellow-600">{stats.pendingLeaves || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Approved Today</span>
            <span className="font-semibold text-lg text-green-600">{stats.approvedToday || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
