"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Calendar, Download, Filter, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminAttendanceTab({ users }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [statsFilter, setStatsFilter] = useState('today'); // today, week, month, all
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDay: 0,
    attendanceRate: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: '',
    status: '',
  });

  // Mark Attendance Form
  const [markForm, setMarkForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    remarks: '',
    checkInAt: '',
    checkOutAt: '',
  });

  // Get date range for stats filter
  const getStatsDateRange = () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    switch (statsFilter) {
      case 'today':
        return {
          start: startOfToday,
          end: new Date()
        };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);
        return {
          start: startOfWeek,
          end: new Date()
        };
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: startOfMonth,
          end: new Date()
        };
      case 'all':
        return {
          start: null,
          end: null
        };
      default:
        return {
          start: startOfToday,
          end: new Date()
        };
    }
  };

  // Calculate statistics based on stats filter
  const calculateStats = (records) => {
    const dateRange = getStatsDateRange();
    let filteredForStats = records;

    if (dateRange.start && dateRange.end) {
      filteredForStats = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
      });
    }

    const present = filteredForStats.filter(a => a.status === 'Present').length;
    const absent = filteredForStats.filter(a => a.status === 'Absent').length;
    const halfDay = filteredForStats.filter(a => a.status === 'Half-Day').length;
    const total = present + absent + halfDay;
    const rate = total > 0 ? ((present + halfDay * 0.5) / total * 100).toFixed(1) : 0;

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalHalfDay: halfDay,
      attendanceRate: rate,
    });
  };

  // Load attendance records
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);

      const { data } = await api.get(`/api/attendance/all?${params.toString()}`);
      setAttendanceRecords(data.attendance || []);
      setFilteredRecords(data.attendance || []);

      // Calculate statistics based on current stats filter
      calculateStats(data.attendance || []);
    } catch (error) {
      toast.error('Failed to load attendance records');
      setAttendanceRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance manually
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/attendance/all', markForm);
      toast.success(data.message);
      setShowMarkForm(false);
      setMarkForm({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        remarks: '',
        checkInAt: '',
        checkOutAt: '',
      });
      loadAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  // Edit attendance record
  const handleEditRecord = (record) => {
    setMarkForm({
      userId: record.user._id,
      date: new Date(record.date).toISOString().split('T')[0],
      status: record.status,
      remarks: record.remarks || '',
      checkInAt: record.checkInAt ? new Date(record.checkInAt).toTimeString().slice(0, 5) : '',
      checkOutAt: record.checkOutAt ? new Date(record.checkOutAt).toTimeString().slice(0, 5) : '',
    });
    setShowMarkForm(true);
    toast.info('Edit the record and submit to update');
  };

  // Quick status change
  const handleQuickStatusChange = async (recordId, userId, date, newStatus) => {
    try {
      await api.post('/api/attendance/all', {
        userId,
        date,
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus}`);
      loadAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['Date', 'Employee Name', 'Email', 'Role', 'Department', 'Status', 'Check In', 'Check Out', 'Remarks'];
    const rows = filteredRecords.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.user?.name || 'N/A',
      record.user?.email || 'N/A',
      record.user?.role || 'N/A',
      record.user?.department || 'N/A',
      record.status,
      record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : '-',
      record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : '-',
      record.remarks || '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate stats when stats filter changes
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      calculateStats(attendanceRecords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {/* <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage attendance records for all employees
          </p>
        </div> */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowMarkForm(!showMarkForm)}>
            <UserCheck className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Statistics Filter Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Statistics View:</span>
        <div className="flex gap-2">
          <Button 
            variant={statsFilter === 'today' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatsFilter('today')}
          >
            Today
          </Button>
          <Button 
            variant={statsFilter === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatsFilter('week')}
          >
            Last Week
          </Button>
          <Button 
            variant={statsFilter === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatsFilter('month')}
          >
            This Month
          </Button>
          <Button 
            variant={statsFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setStatsFilter('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalPresent}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalAbsent}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Half-Day</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalHalfDay}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Mark Attendance Form */}
      {showMarkForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Mark Attendance Manually</h3>
          <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mark-user">Employee *</Label>
              <select
                id="mark-user"
                value={markForm.userId}
                onChange={(e) => setMarkForm({ ...markForm, userId: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                required
              >
                <option value="">Select Employee</option>
                {users?.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.role} ({user.department || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="mark-date">Date *</Label>
              <Input
                id="mark-date"
                type="date"
                value={markForm.date}
                onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="mark-status">Status *</Label>
              <select
                id="mark-status"
                value={markForm.status}
                onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half-Day">Half-Day</option>
              </select>
            </div>

            <div>
              <Label htmlFor="mark-remarks">Remarks</Label>
              <Input
                id="mark-remarks"
                type="text"
                value={markForm.remarks}
                onChange={(e) => setMarkForm({ ...markForm, remarks: e.target.value })}
                placeholder="Optional notes"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="mark-checkin">Check In Time (Optional)</Label>
              <Input
                id="mark-checkin"
                type="time"
                value={markForm.checkInAt}
                onChange={(e) => setMarkForm({ ...markForm, checkInAt: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="mark-checkout">Check Out Time (Optional)</Label>
              <Input
                id="mark-checkout"
                type="time"
                value={markForm.checkOutAt}
                onChange={(e) => setMarkForm({ ...markForm, checkOutAt: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowMarkForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Mark Attendance</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="filter-start">Start Date</Label>
            <Input
              id="filter-start"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="filter-end">End Date</Label>
            <Input
              id="filter-end"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="filter-user">Employee</Label>
            <select
              id="filter-user"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">All Employees</option>
              {users?.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="filter-status">Status</Label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-Day">Half-Day</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button onClick={loadAttendance} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Attendance Records ({filteredRecords.length})</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {filters.startDate && filters.endDate 
              ? `Showing records from ${new Date(filters.startDate).toLocaleDateString()} to ${new Date(filters.endDate).toLocaleDateString()}`
              : 'Showing all records'}
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No attendance records found</p>
              <p className="text-sm mt-2">Try adjusting your filters or mark new attendance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Department</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Check In</th>
                    <th className="text-left p-3 font-semibold">Check Out</th>
                    <th className="text-left p-3 font-semibold">Remarks</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record._id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          weekday: 'short'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{record.user?.name}</div>
                        <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          record.user?.role === 'Admin' ? 'destructive' :
                          record.user?.role === 'HR' ? 'default' :
                          'secondary'
                        }>
                          {record.user?.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {record.user?.department || 'N/A'}
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          record.status === 'Present' ? 'default' :
                          record.status === 'Absent' ? 'destructive' :
                          'secondary'
                        }>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {record.checkInAt 
                          ? new Date(record.checkInAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {record.checkOutAt 
                          ? new Date(record.checkOutAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'}
                      </td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">
                        {record.remarks || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          {record.status !== 'Present' && (
                            <Button 
                              size="sm"
                              onClick={() => handleQuickStatusChange(record._id, record.user._id, record.date, 'Present')}
                              className="bg-green-600 text-white hover:bg-green-700 text-xs"
                            >
                              Mark Present
                            </Button>
                          )}
                          {record.status !== 'Absent' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickStatusChange(record._id, record.user._id, record.date, 'Absent')}
                              className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                            >
                              Mark Absent
                            </Button>
                          )}
                          {record.status !== 'Half-Day' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickStatusChange(record._id, record.user._id, record.date, 'Half-Day')}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                            >
                              Mark Half-Day
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
