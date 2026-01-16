"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';

export default function OverviewTab({ stats, recentlyApproved, isLoading = false, pending = [], allRecentLeaves = [] }) {
  const [leaveFilter, setLeaveFilter] = useState('All'); // 'All', 'Annual', 'Sick', or 'Maternity'
  const [monthFilter, setMonthFilter] = useState('All'); // 'All', 'This Month', 'Last Month', 'Last 3 Months'

  // Calculate filtered stats based on leave type and month
  const filteredStats = useMemo(() => {
    // Apply month filter to pending leaves
    let monthFilteredPending = pending || [];
    let monthFilteredApproved = recentlyApproved || [];
    let monthFilteredAll = allRecentLeaves || [];
    
    if (monthFilter !== 'All') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const filterByMonth = (l) => {
        const leaveDate = new Date(l.createdAt);
        const leaveMonth = leaveDate.getMonth();
        const leaveYear = leaveDate.getFullYear();
        
        if (monthFilter === 'This Month') {
          return leaveMonth === currentMonth && leaveYear === currentYear;
        } else if (monthFilter === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return leaveMonth === lastMonth && leaveYear === lastMonthYear;
        } else if (monthFilter === 'Last 3 Months') {
          const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
          return leaveDate >= threeMonthsAgo;
        }
        return true;
      };
      
      monthFilteredPending = monthFilteredPending.filter(filterByMonth);
      monthFilteredApproved = monthFilteredApproved.filter(filterByMonth);
      monthFilteredAll = monthFilteredAll.filter(filterByMonth);
    }
    
    if (leaveFilter === 'All') {
      return {
        pendingLeaves: monthFilteredPending.length,
        recentlyApproved: monthFilteredApproved.length,
        leavesThisMonth: monthFilteredAll.length,
      };
    }

    const filterByType = (l) => {
      if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
      if (leaveFilter === 'Sick') return l.type === 'Sick';
      if (leaveFilter === 'Maternity') return l.type === 'Maternity';
      return true;
    };

    return {
      pendingLeaves: monthFilteredPending.filter(filterByType).length,
      recentlyApproved: monthFilteredApproved.filter(filterByType).length,
      leavesThisMonth: monthFilteredAll.filter(filterByType).length,
    };
  }, [leaveFilter, monthFilter, stats, recentlyApproved, pending, allRecentLeaves]);

  // Filter recentlyApproved array for display
  const filteredRecentlyApproved = useMemo(() => {
    let filtered = recentlyApproved || [];
    
    // Apply month filter
    if (monthFilter !== 'All') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filtered = filtered.filter(l => {
        const leaveDate = new Date(l.createdAt);
        const leaveMonth = leaveDate.getMonth();
        const leaveYear = leaveDate.getFullYear();
        
        if (monthFilter === 'This Month') {
          return leaveMonth === currentMonth && leaveYear === currentYear;
        } else if (monthFilter === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return leaveMonth === lastMonth && leaveYear === lastMonthYear;
        } else if (monthFilter === 'Last 3 Months') {
          const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
          return leaveDate >= threeMonthsAgo;
        }
        return true;
      });
    }
    
    // Apply leave type filter
    if (leaveFilter === 'All') return filtered;
    return filtered.filter(l => {
      if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
      if (leaveFilter === 'Sick') return l.type === 'Sick';
      if (leaveFilter === 'Maternity') return l.type === 'Maternity';
      return true;
    });
  }, [leaveFilter, monthFilter, recentlyApproved]);

  // Dynamic label based on selected filters
  const getTotalLeavesLabel = () => {
    if (monthFilter === 'This Month') return 'This Month';
    if (monthFilter === 'Last Month') return 'Last Month';
    if (monthFilter === 'Last 3 Months') return 'Last 3 Months';
    return 'Total Leaves';
  };

  const statCards = [
    { 
      label: 'Pending Leaves', 
      value: filteredStats.pendingLeaves, 
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    { 
      label: 'Recently Approved', 
      value: filteredStats.recentlyApproved, 
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
      label: getTotalLeavesLabel(), 
      value: filteredStats.leavesThisMonth, 
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Leave management dashboard and recent activity</p>
        <div className="flex gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Last Month">Last Month</SelectItem>
              <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leaveFilter} onValueChange={setLeaveFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Leaves</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
              <SelectItem value="Sick">Sick</SelectItem>
              <SelectItem value="Maternity">Maternity</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      {filteredRecentlyApproved && filteredRecentlyApproved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Approved Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecentlyApproved.slice(0, 5).map((leave) => (
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
            <span className="font-semibold text-lg text-yellow-600">{filteredStats.pendingLeaves}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Approved Today</span>
            <span className="font-semibold text-lg text-green-600">{stats.approvedToday || 0}</span>
          </div>
          {leaveFilter !== 'All' && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {leaveFilter === 'Annual' ? 'Annual/Casual' : 'Sick'} leave statistics only
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
