"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import AdminSidebar from '@/components/dashboard/admin/AdminSidebar';
import AdminHeader from '@/components/dashboard/admin/AdminHeader';
import OverviewTab from '@/components/dashboard/admin/OverviewTab';
import UsersTab from '@/components/dashboard/admin/UsersTab';
import LeavesTab from '@/components/dashboard/admin/LeavesTab';
import AttendanceTab from '@/components/dashboard/admin/AttendanceTab';
import CalendarTab from '@/components/dashboard/admin/CalendarTab';
import PayrollTab from '@/components/dashboard/admin/PayrollTab';
import ProfileTab from '@/components/dashboard/admin/ProfileTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pastLeaves, setPastLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    hrStaff: 0,
    employees: 0,
    pendingLeaves: 0,
    upcomingEvents: 0,
    presentToday: 0,
    absentToday: 0,
  });

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/list');
      const userList = data.users || [];
      setUsers(userList);
      setStats(prev => ({
        ...prev,
        totalUsers: userList.length,
        admins: userList.filter(u => u.role === 'Admin').length,
        hrStaff: userList.filter(u => u.role === 'HR').length,
        employees: userList.filter(u => u.role === 'Employee').length,
      }));
    } catch {
      setUsers([]);
    }
  };

  const loadLeaves = async () => {
    try {
      const [{ data: pendingData }, { data: pastData }] = await Promise.all([
        api.get('/api/leaves/manage'),
        api.get('/api/leaves/manage?status=past'),
      ]);
      const leavesList = pendingData.leaves || [];
      const pastLeavesList = pastData.leaves || [];
      setLeaves(leavesList);
      setPastLeaves(pastLeavesList);
      setStats(prev => ({ ...prev, pendingLeaves: leavesList.length }));
    } catch {
      setLeaves([]);
      setPastLeaves([]);
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await api.get('/api/calendar/events');
      const eventsList = data.events || [];
      setEvents(eventsList);
      setStats(prev => ({
        ...prev,
        upcomingEvents: eventsList.filter(e => new Date(e.date) >= new Date()).length
      }));
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // Get today's date in PKT (UTC+5)
        const pktOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
        const nowUTC = Date.now();
        const nowPKT = new Date(nowUTC + pktOffset);
        
        // Format date as YYYY-MM-DD in PKT
        const todayStr = `${nowPKT.getUTCFullYear()}-${String(nowPKT.getUTCMonth() + 1).padStart(2, '0')}-${String(nowPKT.getUTCDate()).padStart(2, '0')}`;
        
        const startOfMonth = new Date(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth() + 1, 0).toISOString().split('T')[0];

        const [
          { data: usersData }, 
          { data: leavesData }, 
          { data: pastLeavesData }, 
          { data: eventsData }, 
          { data: meData },
          { data: todayAttendanceData }
        ] = await Promise.all([
          api.get('/api/users/list'),
          api.get('/api/leaves/manage'),
          api.get('/api/leaves/manage?status=past'),
          api.get('/api/calendar/events'),
          api.get('/api/users/me'),
          // Fetch today's attendance
          api.get(`/api/attendance/all?startDate=${todayStr}&endDate=${todayStr}`)
        ]);

        if (!ignore) {
          const userList = usersData.users || [];
          const leavesList = leavesData.leaves || [];
          const pastLeavesList = pastLeavesData.leaves || [];
          const eventsList = eventsData.events || [];
          const userData = meData.user;

          // Calculate presentToday (count Present and Half-Day as present)
          const todayAttendance = todayAttendanceData.attendance || [];
          
          console.log('Today\'s Date:', todayStr);
          console.log('Today\'s Attendance Records:', todayAttendance);
          console.log('Total Records:', todayAttendance.length);
          
          const presentToday = todayAttendance.filter(a => 
            a.status === 'Present' || a.status === 'Half-Day'
          ).length;

          // Calculate absentToday (count Absent status)
          const absentToday = todayAttendance.filter(a => 
            a.status === 'Absent'
          ).length;
          
          console.log('Present Today:', presentToday);
          console.log('Absent Today:', absentToday);

          setUsers(userList);
          setLeaves(leavesList);
          setPastLeaves(pastLeavesList);
          setEvents(eventsList);
          setMe(userData);
          setProfileForm({ name: userData.name, email: userData.email, currentPassword: '', password: '' });

          setStats({
            totalUsers: userList.length,
            admins: userList.filter(u => u.role === 'Admin').length,
            hrStaff: userList.filter(u => u.role === 'HR').length,
            employees: userList.filter(u => u.role === 'Employee').length,
            pendingLeaves: leavesList.length,
            upcomingEvents: eventsList.filter(e => new Date(e.date) >= new Date()).length,
            presentToday: presentToday,
            absentToday: absentToday,
          });
        }
      } catch (error) {
        if (!ignore) {
          setUsers([]);
          setLeaves([]);
          setPastLeaves([]);
          setEvents([]);
        }
      }
    })();
    return () => { ignore = true; };
  }, []);

  const handleLeaveAction = async (leaveId, action) => {
    try {
      await api.put(`/api/leaves/${leaveId}`, { status: action === 'approve' ? 'Approved' : 'Rejected' });
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update leave');
    }
  };

  const handleEventCreate = async (eventData) => {
    try {
      await api.post('/api/calendar/events', eventData);
      toast.success('Event created successfully');
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      await api.delete(`/api/calendar/events/${eventId}`);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/me', profileForm);
      toast.success('Profile updated successfully');
      const { data } = await api.get('/api/users/me');
      setMe(data.user);
      setProfileForm({ ...profileForm, currentPassword: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar sidebarOpen={sidebarOpen} activeTab={activeTab} onTabChange={setActiveTab} me={me} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadUsers} />}
            {activeTab === 'leaves' && <LeavesTab leaves={leaves} pastLeaves={pastLeaves} onAction={handleLeaveAction} />}
            {activeTab === 'attendance' && <AttendanceTab users={users} />}
            {activeTab === 'calendar' && (
              <CalendarTab 
                events={events} 
                onEventCreate={handleEventCreate}
                onEventDelete={handleEventDelete}
              />
            )}
            {/* {activeTab === 'payroll' && <PayrollTab />} */}
            {activeTab === 'profile' && (
              <ProfileTab 
                me={me} 
                profileForm={profileForm} 
                setProfileForm={setProfileForm} 
                updateProfile={updateProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
