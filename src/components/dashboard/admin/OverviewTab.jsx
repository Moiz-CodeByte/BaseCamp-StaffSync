"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, Users, Building2, UserCheck, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import LeaveStatusChart from '@/components/dashboard/charts/LeaveStatusChart';
import EmployeeDepartmentChart from '@/components/dashboard/charts/EmployeeDepartmentChart';
import LeaveTypeChart from '@/components/dashboard/charts/LeaveTypeChart';
import MonthlyTrendChart from '@/components/dashboard/charts/MonthlyTrendChart';

export default function OverviewTab({ stats, isLoading = false, leaves = [], pastLeaves = [], departments = [], users = [] }) {
  const [leaveFilter, setLeaveFilter] = useState('All'); // 'All', 'Annual', 'Sick', or 'Maternity'
  const [monthFilter, setMonthFilter] = useState('All'); // 'All', 'This Month', 'Last Month', 'Last 3 Months'

  // Calculate filtered stats based on leave type and month
  const filteredStats = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
    
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
    
    if (leaveFilter === 'All') {
      return {
        pendingLeaves: monthFiltered.filter(l => l.status === 'Pending').length,
        approvedLeaves: monthFiltered.filter(l => l.status === 'Approved').length,
        rejectedLeaves: monthFiltered.filter(l => l.status === 'Rejected').length,
        totalRequests: monthFiltered.length,
      };
    }

    const filtered = monthFiltered.filter(l => {
      if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
      if (leaveFilter === 'Sick') return l.type === 'Sick';
      if (leaveFilter === 'Maternity') return l.type === 'Maternity';
      return true;
    });

    return {
      pendingLeaves: filtered.filter(l => l.status === 'Pending').length,
      approvedLeaves: filtered.filter(l => l.status === 'Approved').length,
      rejectedLeaves: filtered.filter(l => l.status === 'Rejected').length,
      totalRequests: filtered.length,
    };
  }, [leaveFilter, monthFilter, stats, leaves, pastLeaves]);

  // Department-wise leave statistics
  const departmentStats = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
    
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
  }, [leaves, pastLeaves, leaveFilter, monthFilter]);

  // Employee distribution by department
  const employeeDepartmentData = useMemo(() => {
    if (!departments || !users) return [];
    
    return departments.map(dept => ({
      name: dept.name,
      count: users.filter(u => u.role === 'Employee' && u.department?._id?.toString() === dept._id?.toString()).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [departments, users]);

  // Leave type distribution
  const leaveTypeData = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
    
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
  }, [leaves, pastLeaves, monthFilter]);

  // Monthly trend data (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
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
  }, [leaves, pastLeaves, leaveFilter]);

  // Additional statistics
  const additionalStats = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
    const totalEmployees = users?.filter(u => u.role === 'Employee').length || 0;
    const totalDepartments = departments?.length || 0;
    
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

    // Employees who have taken leave
    const uniqueEmployees = new Set(allLeaves.filter(l => l.status === 'Approved').map(l => l.user?._id?.toString()));
    const utilizationRate = totalEmployees > 0
      ? ((uniqueEmployees.size / totalEmployees) * 100).toFixed(1)
      : 0;

    return {
      totalEmployees,
      totalDepartments,
      avgDuration,
      approvalRate,
      utilizationRate,
      activeEmployees: uniqueEmployees.size
    };
  }, [leaves, pastLeaves, users, departments]);

  const statCards = [
    { 
      label: 'Pending Leaves', 
      value: filteredStats.pendingLeaves, 
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    { 
      label: 'Approved Leaves', 
      value: filteredStats.approvedLeaves, 
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
      label: 'Total Requests', 
      value: filteredStats.totalRequests, 
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
  ];

  const additionalStatCards = [
    {
      label: 'Total Employees',
      value: additionalStats.totalEmployees,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      label: 'Total Departments',
      value: additionalStats.totalDepartments,
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
    {
      label: 'Active Employees',
      value: additionalStats.activeEmployees,
      icon: UserCheck,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-100 dark:bg-cyan-900/20'
    },
  ];



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Leave management statistics and insights</p>
         <div className="flex gap-2">
         <Select value={leaveFilter} onValueChange={setLeaveFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Leaves</SelectItem>
              <SelectItem value="Annual">Annual Leaves</SelectItem>
              <SelectItem value="Sick">Sick Leaves</SelectItem>
              <SelectItem value="Maternity">Maternity Leaves</SelectItem>
            </SelectContent>
          </Select>
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
        </div>
      </div>

      {/* Leave Management Stats with Filter */}
      <div>
        
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
      </div>

      {/* Additional Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Organization Insights
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeaveStatusChart 
          approved={filteredStats.approvedLeaves}
          pending={filteredStats.pendingLeaves}
          rejected={filteredStats.rejectedLeaves}
        />
        <EmployeeDepartmentChart data={employeeDepartmentData} />
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeaveTypeChart data={leaveTypeData} />
        <MonthlyTrendChart data={monthlyTrendData} />
      </div>
    </div>
  );
}
