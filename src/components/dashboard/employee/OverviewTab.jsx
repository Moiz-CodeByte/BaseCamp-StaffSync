"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function OverviewTab({ stats, leaves, isLoading = false, me }) {
  // Calculate business days (excluding weekends)
  const calculateBusinessDays = (startDate, endDate) => {
    let start, end;
    if (typeof startDate === 'string') {
      start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
    } else {
      start = new Date(startDate);
    }
    if (typeof endDate === 'string') {
      end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');
    } else {
      end = new Date(endDate);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end < start) return 0;
    let businessDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
      current.setDate(current.getDate() + 1);
    }
    return businessDays;
  };

  // Calculate earned leaves based on days from entitlement date to today (annual basis)
  const earnedLeaves = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Use leaveEntitlementDate if set, otherwise default to Jan 1 of current year
    const entitlementDate = me?.leaveEntitlementDate 
      ? new Date(me.leaveEntitlementDate)
      : new Date(currentYear, 0, 1);
    
    const daysFromEntitlementToToday = Math.floor((now - entitlementDate) / (1000 * 60 * 60 * 24));
    const earned = Math.round((daysFromEntitlementToToday * 10) / 365);
    return earned;
  }, [me?.leave_limit, me?.leaveEntitlementDate]);

  // Calculate approved leave days for current year only
  const approvedLeaveDaysCurrentYear = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStartDate = new Date(currentYear, 0, 1);
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const systemRecordedDays = (leaves || [])
      .filter(l => {
        if (l.status !== 'Approved') return false;
        const leaveStart = new Date(l.startDate);
        return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
      })
      .reduce((total, leave) => {
        const days = calculateBusinessDays(leave.startDate, leave.endDate);
        return total + days;
      }, 0);
    
    const currentYearCheck = new Date().getFullYear();
    const historicalLeaves = (me?.previousLeavesAvailedYear === currentYearCheck) 
      ? (me?.previousLeavesAvailed || 0) 
      : 0;
    return systemRecordedDays + historicalLeaves;
  }, [leaves, me?.previousLeavesAvailed, me?.previousLeavesAvailedYear]);

  // Calculate available leave balance
  const remainingLeaves = useMemo(() => {
    return earnedLeaves - approvedLeaveDaysCurrentYear;
  }, [earnedLeaves, approvedLeaveDaysCurrentYear]);

  const statCards = [
    { 
      label: 'Total Leave Days', 
      value: stats?.totalLeaveDays || 0, 
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    { 
      label: 'Pending Requests', 
      value: stats?.pendingLeaves || 0, 
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    { 
      label: 'Approved Leaves', 
      value: stats?.approvedLeaves || 0, 
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20'
    },
    { 
      label: 'Rejected Leaves', 
      value: stats?.rejectedLeaves || 0, 
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20'
    },
  ];

  const recentLeaves = leaves?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Your leave statistics and recent activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={isLoading ? 'relative overflow-hidden' : ''}>
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

      {/* Leave Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance (Annual)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 font-medium">Earned This Year</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {earnedLeaves} day{earnedLeaves !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {((me?.leave_limit || 10) / 365).toFixed(2)} per day
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Used This Year</p>
              <p className="text-2xl font-bold">
                {approvedLeaveDaysCurrentYear} day{approvedLeaveDaysCurrentYear !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Current year
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              remainingLeaves < 0 ? 'bg-destructive/10 border-destructive/50' : 
              remainingLeaves === 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900' : 
              'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
            }`}>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Available Balance</p>
              <p className={`text-2xl font-bold ${
                remainingLeaves < 0 ? 'text-destructive' : 
                remainingLeaves === 0 ? 'text-orange-600 dark:text-orange-400' : 
                'text-green-600 dark:text-green-400'
              }`}>
                {remainingLeaves} day{remainingLeaves !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max {me?.leave_limit || 10}/year
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 <strong>Leave Policy:</strong> You earn 0.03 leaves per day. Calculation: (Days from entitlement date × 10) ÷ 365. Maximum {me?.leave_limit || 10} leaves per year.
          </p>
        </CardContent>
      </Card>

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
