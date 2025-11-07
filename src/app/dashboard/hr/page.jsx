"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import HRSidebar from '@/components/dashboard/hr/HRSidebar';
import HRHeader from '@/components/dashboard/hr/HRHeader';
import OverviewTab from '@/components/dashboard/hr/OverviewTab';
import LeavesTab from '@/components/dashboard/hr/LeavesTab';
import CalendarTab from '@/components/dashboard/hr/CalendarTab';
import EmployeesTab from '@/components/dashboard/hr/EmployeesTab';
import PayrollTab from '@/components/dashboard/hr/PayrollTab';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pending, setPending] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ pendingLeaves: 0, totalEmployees: 0, upcomingEvents: 0 });

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
        const [{ data: leaves }, { data: eventsData }, { data: usersData }] = await Promise.all([
          api.get('/api/leaves/manage'),
          api.get('/api/calendar/events'),
          api.get('/api/users/list'),
        ]);
        if (!ignore) {
          const pendingList = leaves.leaves || [];
          const eventsList = eventsData.events || [];
          const usersList = usersData.users || [];
          // HR can only manage Employees (not Admin or HR users)
          const employeesOnly = usersList.filter(u => u.role === 'Employee');
          setPending(pendingList);
          setEvents(eventsList);
          setUsers(employeesOnly);
          setStats({
            pendingLeaves: pendingList.length,
            totalEmployees: employeesOnly.length,
            upcomingEvents: eventsList.filter(e => new Date(e.date) >= new Date()).length,
          });
        }
      } catch {
        if (!ignore) { setPending([]); setEvents([]); setUsers([]); }
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

  return (
    <div className="flex h-screen bg-background">
      <HRSidebar sidebarOpen={sidebarOpen} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HRHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'leaves' && <LeavesTab leaves={pending} onAction={handleLeaveAction} />}
            {activeTab === 'calendar' && (
              <CalendarTab 
                events={events} 
                onEventCreate={handleEventCreate}
                onEventDelete={handleEventDelete}
              />
            )}
            {activeTab === 'employees' && <EmployeesTab users={users} onUpdate={loadUsers} />}
            {activeTab === 'payroll' && <PayrollTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
