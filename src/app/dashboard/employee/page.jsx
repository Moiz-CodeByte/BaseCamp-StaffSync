"use client";

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { LayoutDashboard, Clock, Calendar as CalendarIcon, FileText, User, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import EmployeeSidebar from '@/components/dashboard/employee/EmployeeSidebar';
import EmployeeHeader from '@/components/dashboard/employee/EmployeeHeader';
import OverviewTab from '@/components/dashboard/employee/OverviewTab';
import AttendanceTab from '@/components/dashboard/employee/AttendanceTab';
import CalendarTab from '@/components/dashboard/employee/CalendarTab';
import LeavesTab from '@/components/dashboard/employee/LeavesTab';
import ProfileTab from '@/components/dashboard/employee/ProfileTab';
import PayrollTab from '@/components/dashboard/employee/PayrollTab';

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

  const fetchData = useCallback(async () => {
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
  }, [dateFilter]);

  useEffect(() => {
    let cancelled = false;
    // Defer fetchData so state updates do not run synchronously inside the effect
    Promise.resolve().then(() => {
      if (!cancelled) fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black/50">
      <EmployeeSidebar 
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        me={me}
        menuItems={menuItems}
      />

      <main className="flex-1 overflow-y-auto">
        <EmployeeHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          menuItems={menuItems}
        />

        <div className="p-8">
          {activeTab === 'overview' && (
            <OverviewTab 
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              stats={stats}
              attendance={attendance}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab 
              checkIn={checkIn}
              checkOut={checkOut}
              todayAttendance={todayAttendance}
              attendance={attendance}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab 
              attendance={attendance}
              leaves={leaves}
            />
          )}

          {activeTab === 'leaves' && (
            <LeavesTab 
              leaveForm={leaveForm}
              setLeaveForm={setLeaveForm}
              requestLeave={requestLeave}
              leaves={leaves}
              deleteLeaveRequest={deleteLeaveRequest}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              me={me}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              updateProfile={updateProfile}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollTab payslips={payslips} />
          )}
        </div>
      </main>
    </div>
  );
}
