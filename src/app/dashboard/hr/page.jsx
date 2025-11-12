"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import HRSidebar from '@/components/dashboard/hr/HRSidebar';
import HRHeader from '@/components/dashboard/hr/HRHeader';
import OverviewTab from '@/components/dashboard/hr/OverviewTab';
import LeavesTab from '@/components/dashboard/hr/LeavesTab';
import HRLeaveRequestForm from '@/components/dashboard/hr/HRLeaveRequestForm';
import CalendarTab from '@/components/dashboard/hr/CalendarTab';
import EmployeesTab from '@/components/dashboard/hr/EmployeesTab';
import PayrollTab from '@/components/dashboard/hr/PayrollTab';
import HRProfileTab from '@/components/dashboard/hr/HRProfileTab';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pending, setPending] = useState([]);
  const [recentlyApproved, setRecentlyApproved] = useState([]);
  const [allRecentLeaves, setAllRecentLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ pendingLeaves: 0, totalEmployees: 0, upcomingEvents: 0 });
  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/list');
      const usersList = data.users || [];
      // HR can only manage Employees (not Admin or HR users)
      const employeesOnly = usersList.filter(u => u.role === 'Employee');
      setUsers(employeesOnly);
      setStats(prev => ({
        ...prev,
        totalEmployees: employeesOnly.length
      }));
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [{ data: leaves }, { data: recentData }, { data: allRecentData }, { data: eventsData }, { data: usersData }, { data: meData }] = await Promise.all([
          api.get('/api/leaves/manage'),
          api.get('/api/leaves/recent'),
          api.get('/api/leaves/all-recent'),
          api.get('/api/calendar/events'),
          api.get('/api/users/list'),
          api.get('/api/users/me'),
        ]);
        if (!ignore) {
          const pendingList = leaves.leaves || [];
          const recentList = recentData.leaves || [];
          const allRecentList = allRecentData.leaves || [];
          const eventsList = eventsData.events || [];
          const usersList = usersData.users || [];
          const userData = meData.user;
          
          // HR can only manage Employees (not Admin or HR users)
          const employeesOnly = usersList.filter(u => u.role === 'Employee');
          setPending(pendingList);
          setRecentlyApproved(recentList);
          setAllRecentLeaves(allRecentList);
          setEvents(eventsList);
          setUsers(employeesOnly);
          setMe(userData);
          setProfileForm({ name: userData.name, email: userData.email, currentPassword: '', password: '' });
          setStats({
            pendingLeaves: pendingList.length,
            totalEmployees: employeesOnly.length,
            upcomingEvents: eventsList.filter(e => new Date(e.date) >= new Date()).length,
          });
        }
      } catch {
        if (!ignore) { setPending([]); setRecentlyApproved([]); setAllRecentLeaves([]); setEvents([]); setUsers([]); }
      }
    })();
    return () => { ignore = true; };
  }, []);

  const handleLeaveAction = async (leaveId, action) => {
    await api.post('/api/leaves/manage', { leaveId, action });
    // Reload leaves
    try {
      const { data } = await api.get('/api/leaves/manage');
      const pendingList = data.leaves || [];
      setPending(pendingList);
      setStats(prev => ({ ...prev, pendingLeaves: pendingList.length }));
    } catch {}
  };

  const handleEventCreate = async (eventData) => {
    await api.post('/api/calendar/events', eventData);
    try {
      const { data } = await api.get('/api/calendar/events');
      const eventsList = data.events || [];
      setEvents(eventsList);
      setStats(prev => ({ ...prev, upcomingEvents: eventsList.filter(ev => new Date(ev.date) >= new Date()).length }));
    } catch {}
  };

  const handleEventDelete = async (eventId) => {
    await api.delete(`/api/calendar/events/${eventId}`);
    try {
      const { data } = await api.get('/api/calendar/events');
      const eventsList = data.events || [];
      setEvents(eventsList);
      setStats(prev => ({ ...prev, upcomingEvents: eventsList.filter(ev => new Date(ev.date) >= new Date()).length }));
    } catch {}
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
      <HRSidebar sidebarOpen={sidebarOpen} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HRHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto [@media(max-width:396px)]:p-0">
            {activeTab === 'overview' && <OverviewTab stats={stats} recentlyApproved={recentlyApproved} />}
            {activeTab === 'leaves' && <LeavesTab 
              leaves={pending}
              allRecentLeaves={allRecentLeaves}
              onAction={handleLeaveAction} 
              me={me}
            />}
            {activeTab === 'calendar' && (
              <CalendarTab 
                events={events} 
                onEventCreate={handleEventCreate}
                onEventDelete={handleEventDelete}
              />
            )}
            {activeTab === 'employees' && <EmployeesTab users={users} onUpdate={loadUsers} />}
            {/* {activeTab === 'payroll' && <PayrollTab />} */}
            {activeTab === 'profile' && (
              <HRProfileTab 
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
