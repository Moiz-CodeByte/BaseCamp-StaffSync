"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, Users, TrendingUp, Calendar, UserCheck, Building2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import EmployeeDepartmentChart from '@/components/dashboard/charts/EmployeeDepartmentChart';
import LeaveStatusChart from '@/components/dashboard/charts/LeaveStatusChart';
import LeaveTypeChart from '@/components/dashboard/charts/LeaveTypeChart';
import MonthlyTrendChart from '@/components/dashboard/charts/MonthlyTrendChart';

export default function OverviewTab({ stats, recentlyApproved, isLoading = false, pending = [], allRecentLeaves = [], departments = [], users = [] }) {
  const [leaveFilter, setLeaveFilter] = useState('All'); // 'All', 'Annual', 'Sick', 'Maternity', or 'Paternity'
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
        rejectedLeaves: monthFilteredAll.filter(l => l.status === 'Rejected').length,
        leavesThisMonth: monthFilteredAll.length,
      };
    }

    const filterByType = (l) => {
      if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
      if (leaveFilter === 'Sick') return l.type === 'Sick';
      if (leaveFilter === 'Maternity') return l.type === 'Maternity';
      if (leaveFilter === 'Paternity') return l.type === 'Paternity';
      return true;
    };

    return {
      pendingLeaves: monthFilteredPending.filter(filterByType).length,
      recentlyApproved: monthFilteredApproved.filter(filterByType).length,
      rejectedLeaves: monthFilteredAll.filter(l => l.status === 'Rejected').filter(filterByType).length,
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
      if (leaveFilter === 'Paternity') return l.type === 'Paternity';
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

  // Department-wise leave statistics for HR's departments
  const departmentStats = useMemo(() => {
    const allLeaves = [...(pending || []), ...(allRecentLeaves || [])];
    
    // Apply month filter
    let monthFiltered = allLeaves;
    if (monthFilter !== 'All') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      monthFiltered = allLeaves.filter(l => {
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
    let filtered = monthFiltered;
    if (leaveFilter !== 'All') {
      filtered = monthFiltered.filter(l => {
        if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
        if (leaveFilter === 'Sick') return l.type === 'Sick';
        if (leaveFilter === 'Maternity') return l.type === 'Maternity';
        if (leaveFilter === 'Paternity') return l.type === 'Paternity';
        return true;
      });
    }

    const deptMap = {};
    filtered.forEach(leave => {
      const deptName = leave.user?.department?.name || 'Unassigned';
      if (!deptMap[deptName]) {
        deptMap[deptName] = { 
          name: deptName, 
          total: 0, 
          approved: 0, 
          pending: 0, 
          rejected: 0 
        };
      }
      deptMap[deptName].total++;
      if (leave.status === 'Approved') deptMap[deptName].approved++;
      if (leave.status === 'Pending') deptMap[deptName].pending++;
      if (leave.status === 'Rejected') deptMap[deptName].rejected++;
    });

    return Object.values(deptMap).sort((a, b) => b.total - a.total);
  }, [pending, allRecentLeaves, leaveFilter, monthFilter]);

  // Leave type distribution for HR's departments
  const leaveTypeData = useMemo(() => {
    const allLeaves = [...(pending || []), ...(allRecentLeaves || [])];
    
    // Apply month filter
    let monthFiltered = allLeaves;
    if (monthFilter !== 'All') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      monthFiltered = allLeaves.filter(l => {
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

    const typeMap = {};
    monthFiltered.forEach(leave => {
      const type = leave.type || 'Other';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return Object.entries(typeMap).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  }, [pending, allRecentLeaves, monthFilter]);

  // Monthly trend data (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const allLeaves = [...(pending || []), ...(allRecentLeaves || [])];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthYear = date.getFullYear();
      const month = date.getMonth();

      let monthLeaves = allLeaves.filter(l => {
        const leaveDate = new Date(l.createdAt);
        return leaveDate.getMonth() === month && leaveDate.getFullYear() === monthYear;
      });

      // Apply leave type filter
      if (leaveFilter !== 'All') {
        monthLeaves = monthLeaves.filter(l => {
          if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
          if (leaveFilter === 'Sick') return l.type === 'Sick';
          if (leaveFilter === 'Maternity') return l.type === 'Maternity';
          if (leaveFilter === 'Paternity') return l.type === 'Paternity';
          return true;
        });
      }

      months.push({
        month: monthName,
        approved: monthLeaves.filter(l => l.status === 'Approved').length,
        pending: monthLeaves.filter(l => l.status === 'Pending').length,
        rejected: monthLeaves.filter(l => l.status === 'Rejected').length,
      });
    }

    return months;
  }, [pending, allRecentLeaves, leaveFilter]);

  // Additional statistics for HR
  const additionalStats = useMemo(() => {
    const allLeaves = [...(pending || []), ...(allRecentLeaves || [])];
    const hrEmployees = users?.filter(u => u.role === 'Employee' && departments?.some(d => d.hr?.toString() === u.department?.hr?.toString())) || [];
    const hrDepartments = departments?.length || 0;
    
    // Helper function to count business days (excluding weekends)
    const countBusinessDays = (startDate, endDate) => {
      let count = 0;
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    };
    
    // Calculate average leave duration (business days only)
    const leavesWithDates = allLeaves.filter(l => l.startDate && l.endDate && l.status === 'Approved');
    let avgDuration = 0;
    if (leavesWithDates.length > 0) {
      const totalDays = leavesWithDates.reduce((sum, l) => {
        const businessDays = countBusinessDays(new Date(l.startDate), new Date(l.endDate));
        return sum + businessDays;
      }, 0);
      avgDuration = (totalDays / leavesWithDates.length).toFixed(1);
    }

    // Calculate approval rate
    const processedLeaves = allLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected');
    const approvalRate = processedLeaves.length > 0
      ? ((allLeaves.filter(l => l.status === 'Approved').length / processedLeaves.length) * 100).toFixed(1)
      : 0;

    // Employees who have taken leave in HR's departments
    const uniqueEmployees = new Set(allLeaves.filter(l => l.status === 'Approved').map(l => l.user?._id?.toString()));
    const utilizationRate = hrEmployees.length > 0
      ? ((uniqueEmployees.size / hrEmployees.length) * 100).toFixed(1)
      : 0;

    return {
      hrDepartments,
      avgDuration,
      approvalRate,
      utilizationRate,
      activeEmployees: uniqueEmployees.size
    };
  }, [pending, allRecentLeaves, users, departments]);

  // Employee distribution by HR's departments
  const employeeDepartmentData = useMemo(() => {
    if (!departments || !users) return [];
    
    // Get HR's department IDs (departments prop should already be filtered for this HR)
    const hrDepartmentIds = departments.map(d => d._id?.toString());
    
    // Filter users to only include employees from HR's managed departments
    const hrEmployees = users.filter(u => 
      u.role === 'Employee' && 
      u.department?._id && 
      hrDepartmentIds.includes(u.department._id.toString())
    );
    
    return departments.map(dept => ({
      name: dept.name,
      count: hrEmployees.filter(u => u.department?._id?.toString() === dept._id?.toString()).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [departments, users]);

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
      label: 'Rejected Leaves', 
      value: filteredStats.rejectedLeaves, 
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20'
    },
    { 
      label: getTotalLeavesLabel(), 
      value: filteredStats.leavesThisMonth, 
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
  ];

  const additionalStatCards = [
    {
      label: 'My Departments',
      value: additionalStats.hrDepartments,
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      label: 'Avg Approved Leave Duration',
      value: `${additionalStats.avgDuration} days`,
      icon: Calendar,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-100 dark:bg-teal-900/20'
    },
    {
      label: 'Approval Rate',
      value: `${additionalStats.approvalRate}%`,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      label: 'Leave Utilization',
      value: `${additionalStats.utilizationRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/20'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm sm:text-base">Leave management dashboard and recent activity</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Leaves</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
              <SelectItem value="Sick">Sick</SelectItem>
              <SelectItem value="Maternity">Maternity</SelectItem>
              <SelectItem value="Paternity">Paternity</SelectItem>
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



      {/* Additional Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Department Insights
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {additionalStatCards.map((stat, idx) => {
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
      </div>

      {/* Department-wise Analytics 
      <div className="grid gap-6 lg:grid-cols-2">
         <EmployeeDepartmentChart 
          data={employeeDepartmentData} 
          title="Employees by Department"
        /> 
       
      </div> */}

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
       <LeaveStatusChart 
          approved={filteredStats.recentlyApproved}
          pending={filteredStats.pendingLeaves}
          rejected={filteredStats.rejectedLeaves}
        />
        {/* <LeaveTypeChart data={leaveTypeData} title="Leave Types in My Departments" /> */}
        <MonthlyTrendChart data={monthlyTrendData} title="6-Month Leave Trend" />
      </div>

            {/* {filteredRecentlyApproved && filteredRecentlyApproved.length > 0 && (
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
      )} */}

      {/* <Card>
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
      </Card> */}
    </div>
  );
}
