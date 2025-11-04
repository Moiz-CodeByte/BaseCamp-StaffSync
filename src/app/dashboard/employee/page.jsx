"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LayoutDashboard, Clock, Calendar as CalendarIcon, FileText, User, DollarSign, Menu, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subDays, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [me, setMe] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });
  const [dateFilter, setDateFilter] = useState('30'); // 30, 60, or 'all'
  const [stats, setStats] = useState({ totalDays: 0, totalLeaveDays: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0 });

  const fetchData = async () => {
    try {
      const [{ data: meData }, { data: attData }, { data: leaveData }, { data: payData }] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/attendance/my'),
        api.get('/api/leaves/my'),
        api.get('/api/payroll/mine'),
      ]);
      
      setMe(meData.user);
      setProfileForm({
        name: meData.user.name || '',
        email: meData.user.email || '',
        currentPassword: '',
        password: ''
      });
      
      const attRecords = attData.records || [];
      const leaveList = leaveData.leaves || [];
      
      // Apply date filter
      const filterDate = dateFilter === 'all' ? null : new Date(Date.now() - parseInt(dateFilter) * 24 * 60 * 60 * 1000);
      const filteredAtt = filterDate ? attRecords.filter(a => new Date(a.date) >= filterDate) : attRecords;
      const filteredLeaves = filterDate ? leaveList.filter(l => new Date(l.startDate) >= filterDate) : leaveList;
      
      setAttendance(filteredAtt);
      setLeaves(filteredLeaves);
      setPayslips(payData.payslips || []);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attRecords.find(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      setTodayAttendance(todayRecord || null);

      // Calculate stats based on filtered data
      const presentDays = filteredAtt.filter(a => a.status === 'Present').length;
      const absentDays = filteredAtt.filter(a => a.status === 'Absent').length;
      const halfDays = filteredAtt.filter(a => a.status === 'Half-Day').length;
      
      // Calculate total leave days (approved leaves)
      const totalLeaveDays = filteredLeaves
        .filter(l => l.status === 'Approved')
        .reduce((total, leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);
      
      setStats({
        totalDays: filteredAtt.length,
        presentDays,
        absentDays,
        halfDays,
        totalLeaveDays,
        pendingLeaves: filteredLeaves.filter(l => l.status === 'Pending').length,
        approvedLeaves: filteredLeaves.filter(l => l.status === 'Approved').length,
        rejectedLeaves: filteredLeaves.filter(l => l.status === 'Rejected').length,
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const checkIn = async () => {
    try {
      await api.post('/api/attendance/checkin');
      await fetchData();
      toast.success('Checked in successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const checkOut = async () => {
    try {
      await api.post('/api/attendance/checkout');
      await fetchData();
      toast.success('Checked out successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const requestLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/leaves/request', leaveForm);
      setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
      await fetchData();
      toast.success('Leave request submitted successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const deleteLeaveRequest = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/api/leaves/${id}`);
      await fetchData();
      toast.success('Leave request deleted successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/api/users/me', profileForm);
      setProfileForm(prev => ({ ...prev, currentPassword: '', password: '' }));
      await fetchData();
      toast.success('Profile updated successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'leaves', label: 'Leave Requests', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'default',
      'Approved': 'secondary',
      'Rejected': 'destructive',
      'Present': 'secondary',
      'Absent': 'destructive',
      'Half-Day': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Employee Portal</h2>
          {me && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{me.name}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Header with Hamburger */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-700 dark:text-gray-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h1>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                  <p className="text-gray-500 mt-1">View your attendance and leave statistics</p>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="60">Last 60 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalDays}</div>
                    <p className="text-xs text-gray-500 mt-1">Days recorded</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Present Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{stats.presentDays}</div>
                    <p className="text-xs text-gray-500 mt-1">Days present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Absent Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.absentDays}</div>
                    <p className="text-xs text-gray-500 mt-1">Days absent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Half Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{stats.halfDays}</div>
                    <p className="text-xs text-gray-500 mt-1">Half-day attendance</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Pending Leaves</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{stats.pendingLeaves}</div>
                    <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Leave Days Taken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stats.totalLeaveDays}</div>
                    <p className="text-xs text-gray-500 mt-1">Days on approved leave</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Rejected Leaves</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.rejectedLeaves}</div>
                    <p className="text-xs text-gray-500 mt-1">Requests denied</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendance.slice(0, 5).map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{new Date(att.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">
                            {att.checkInAt && `In: ${new Date(att.checkInAt).toLocaleTimeString()}`}
                            {att.checkOutAt && ` | Out: ${new Date(att.checkOutAt).toLocaleTimeString()}`}
                          </p>
                        </div>
                        {getStatusBadge(att.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Attendance</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Attendance</CardTitle>
                  <CardDescription>Mark your check-in and check-out time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={checkIn} disabled={todayAttendance?.checkInAt} className="flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      {todayAttendance?.checkInAt ? 'Already Checked In' : 'Check In'}
                    </Button>
                    <Button onClick={checkOut} disabled={!todayAttendance?.checkInAt || todayAttendance?.checkOutAt} variant="outline" className="flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      {todayAttendance?.checkOutAt ? 'Already Checked Out' : 'Check Out'}
                    </Button>
                  </div>
                  {todayAttendance && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium mb-2">Today&apos;s Record:</p>
                      {todayAttendance.checkInAt && <p className="text-sm">Check In: {new Date(todayAttendance.checkInAt).toLocaleTimeString()}</p>}
                      {todayAttendance.checkOutAt && <p className="text-sm">Check Out: {new Date(todayAttendance.checkOutAt).toLocaleTimeString()}</p>}
                      <div className="mt-2">{getStatusBadge(todayAttendance.status)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attendance.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <p className="text-sm text-gray-500">
                            {att.checkInAt && `In: ${new Date(att.checkInAt).toLocaleTimeString()}`}
                            {att.checkOutAt && ` | Out: ${new Date(att.checkOutAt).toLocaleTimeString()}`}
                          </p>
                        </div>
                        {getStatusBadge(att.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance & Leave Calendar</CardTitle>
                  <CardDescription>View your attendance and leaves on the calendar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Calendar */}
                    <div className="w-full flex justify-center">
                      <div className="w-full max-w-3xl">
                        <Calendar
                          mode="single"
                          className="rounded-md border mx-auto"
                          modifiers={{
                          present: attendance
                            .filter(a => a.status === 'Present')
                            .map(a => parseISO(a.date.split('T')[0])),
                          absent: attendance
                            .filter(a => a.status === 'Absent')
                            .map(a => parseISO(a.date.split('T')[0])),
                          halfDay: attendance
                            .filter(a => a.status === 'Half-Day')
                            .map(a => parseISO(a.date.split('T')[0])),
                          leave: leaves
                            .filter(l => l.status === 'Approved')
                            .flatMap(l => {
                              const dates = [];
                              const start = parseISO(l.startDate.split('T')[0]);
                              const end = parseISO(l.endDate.split('T')[0]);
                              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                dates.push(new Date(d));
                              }
                              return dates;
                            }),
                        }}
                        modifiersStyles={{
                          present: { backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold' },
                          absent: { backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' },
                          halfDay: { backgroundColor: '#f97316', color: 'white', fontWeight: 'bold' },
                          leave: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                        }}
                      />
                      </div>
                    </div>
                    
                    {/* Legend and Recent Activity Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Legend</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span className="text-sm">Present</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500"></div>
                            <span className="text-sm">Absent</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500"></div>
                            <span className="text-sm">Half-Day</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500"></div>
                            <span className="text-sm">Leave (Approved)</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Recent Activity</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {[...attendance, ...leaves.filter(l => l.status === 'Approved')].sort((a, b) => 
                            new Date(b.date || b.startDate) - new Date(a.date || a.startDate)
                          ).slice(0, 10).map((item, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                              <p className="font-medium text-xs">
                                {item.date 
                                  ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : `${new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                }
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.date ? item.status : `Leave - ${item.type}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Leave Requests</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Request New Leave</CardTitle>
                  <CardDescription>Submit a new leave request</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={requestLeave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Leave Type</Label>
                        <Select value={leaveForm.type} onValueChange={(val) => setLeaveForm({...leaveForm, type: val})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Annual">Annual</SelectItem>
                            <SelectItem value="Sick">Sick</SelectItem>
                            <SelectItem value="Casual">Casual</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea id="reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Reason for leave request" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Submit Leave Request</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>My Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaves.map((leave) => (
                      <div key={leave._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{leave.type} Leave</h3>
                              {getStatusBadge(leave.status)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            {leave.reason && <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>}
                          </div>
                          {leave.status === 'Pending' && (
                            <Button variant="destructive" size="sm" onClick={() => deleteLeaveRequest(leave._id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {leaves.length === 0 && <p className="text-center text-gray-500 py-8">No leave requests found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && me && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Profile</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Required to change password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" value={profileForm.password} onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} placeholder="Leave blank to keep current" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Update Profile</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>Your department and HR information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Department</Label>
                    <p className="text-lg font-medium mt-1">{me.department || 'Not assigned'}</p>
                    <p className="text-xs text-gray-500 mt-1">Contact HR to update</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Assigned HR</Label>
                    {me.assignedHR ? (
                      <div className="mt-1">
                        <p className="text-lg font-medium">{me.assignedHR.name}</p>
                        <p className="text-sm text-gray-500">{me.assignedHR.email}</p>
                      </div>
                    ) : (
                      <p className="text-lg font-medium mt-1">Not assigned</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500">Role</Label>
                    <p className="text-lg font-medium mt-1">{me.role}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Payroll</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Payslips</CardTitle>
                  <CardDescription>View your payment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payslips.map((slip, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{slip.month}</p>
                          <p className="text-sm text-gray-500">Generated: {new Date(slip.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">${slip.netSalary?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Net Salary</p>
                        </div>
                      </div>
                    ))}
                    {payslips.length === 0 && <p className="text-center text-gray-500 py-8">No payslips available yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
