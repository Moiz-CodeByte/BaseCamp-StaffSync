"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, Users, Building2, UserCheck, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function OverviewTab({ stats, isLoading = false, leaves = [], pastLeaves = [] }) {
  const [leaveFilter, setLeaveFilter] = useState('All'); // 'All', 'Annual', or 'Sick'

  // Calculate filtered stats based on leave type
  const filteredStats = useMemo(() => {
    const allLeaves = [...(leaves || []), ...(pastLeaves || [])];
    
    if (leaveFilter === 'All') {
      return {
        pendingLeaves: stats?.pendingLeaves || 0,
        approvedLeaves: stats?.approvedLeaves || 0,
        rejectedLeaves: stats?.rejectedLeaves || 0,
        totalRequests: stats?.totalRequests || 0,
      };
    }

    const filtered = allLeaves.filter(l => {
      if (leaveFilter === 'Annual') return l.type === 'Annual' || l.type === 'Casual';
      if (leaveFilter === 'Sick') return l.type === 'Sick';
      return true;
    });

    return {
      pendingLeaves: filtered.filter(l => l.status === 'Pending').length,
      approvedLeaves: filtered.filter(l => l.status === 'Approved').length,
      rejectedLeaves: filtered.filter(l => l.status === 'Rejected').length,
      totalRequests: filtered.length,
    };
  }, [leaveFilter, stats, leaves, pastLeaves]);

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



  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Leave management statistics and insights</p>
      </div>

      {/* Leave Management Stats with Filter */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Leave Management</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setLeaveFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                leaveFilter === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Leaves
            </button>
            <button
              onClick={() => setLeaveFilter('Annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                leaveFilter === 'Annual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Annual Leaves
            </button>
            <button
              onClick={() => setLeaveFilter('Sick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                leaveFilter === 'Sick'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Sick Leaves
            </button>
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
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Leave Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Leave Requests</span>
              <span className="font-semibold text-lg">{filteredStats.totalRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pending Approval</span>
              <span className="font-semibold text-lg text-yellow-600">{filteredStats.pendingLeaves}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approved This Month</span>
              <span className="font-semibold text-lg text-green-600">{stats.approvedThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approval Rate</span>
              <span className="font-semibold text-lg text-green-600">
                {filteredStats.totalRequests > 0 
                  ? `${Math.round((filteredStats.approvedLeaves / filteredStats.totalRequests) * 100)}%` 
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rejection Rate</span>
              <span className="font-semibold text-lg text-red-600">
                {filteredStats.totalRequests > 0 
                  ? `${Math.round((filteredStats.rejectedLeaves / filteredStats.totalRequests) * 100)}%` 
                  : '0%'}
              </span>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Workforce Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Staff</span>
              <span className="font-semibold text-lg">{(stats.employees || 0) + (stats.hrStaff || 0) + (stats.admins || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Employees</span>
              <span className="font-semibold text-lg text-indigo-600">{stats.employees || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">HR Staff</span>
              <span className="font-semibold text-lg text-purple-600">{stats.hrStaff || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Departments</span>
              <span className="font-semibold text-lg text-cyan-600">{stats.totalDepartments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg Employees/Dept</span>
              <span className="font-semibold text-lg">
                {stats.totalDepartments > 0 
                  ? Math.round((stats.employees || 0) / stats.totalDepartments) 
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
