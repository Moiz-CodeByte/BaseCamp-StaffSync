"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PayrollManagement from '@/components/dashboard/PayrollManagementOptimized';
import UserManagementTable from '@/components/dashboard/UserManagementTable';

export default function HRDashboard() {
  const [pending, setPending] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'Event', description: '' });
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
          setAllLeaves(pendingList);
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

  const act = async (leaveId, action) => {
    await api.post('/api/leaves/manage', { leaveId, action });
    // Reload leaves
    try {
      const { data } = await api.get('/api/leaves/manage');
      const pendingList = data.leaves || [];
      setPending(pendingList);
      setAllLeaves(pendingList);
      setStats(prev => ({ ...prev, pendingLeaves: pendingList.length }));
    } catch {}
  };

  const createEvent = async (e) => {
    e.preventDefault();
    await api.post('/api/calendar/events', eventForm);
    setEventForm({ title: '', date: '', type: 'Event', description: '' });
    try {
      const { data } = await api.get('/api/calendar/events');
      const eventsList = data.events || [];
      setEvents(eventsList);
      setStats(prev => ({ ...prev, upcomingEvents: eventsList.filter(ev => new Date(ev.date) >= new Date()).length }));
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">HR Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6">
          <div className="text-sm text-muted-foreground">Pending Leave Requests</div>
          <div className="text-3xl font-bold mt-2">{stats.pendingLeaves}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="text-sm text-muted-foreground">Total Employees</div>
          <div className="text-3xl font-bold mt-2">{stats.totalEmployees}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6">
          <div className="text-sm text-muted-foreground">Upcoming Events</div>
          <div className="text-3xl font-bold mt-2">{stats.upcomingEvents}</div>
        </div>
      </div>

      {/* Leave Management */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Pending Leave Requests</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Dates</th>
                  <th className="text-left p-2">Reason</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(l => (
                  <tr key={l._id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{l.user?.name}</td>
                    <td className="p-2">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {l.type}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">
                      {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">{l.reason || '-'}</td>
                    <td className="p-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => act(l._id, 'reject')}>Reject</Button>
                        <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => act(l._id, 'approve')}>Approve</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Corporate Calendar */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Corporate Calendar</h2>
        <form onSubmit={createEvent} className="grid gap-3 md:grid-cols-5 mb-6">
          <Input placeholder="Event Title" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required />
          <Input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} required />
          <select className="px-3 py-2 rounded-md border bg-background" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>
            <option value="Holiday">Holiday</option>
            <option value="Meeting">Meeting</option>
            <option value="Event">Event</option>
          </select>
          <Input placeholder="Description" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} />
          <Button type="submit" className="bg-primary text-primary-foreground">Add Event</Button>
        </form>
        <div className="grid gap-3 md:grid-cols-2">
          {events.map(ev => (
            <div key={ev._id} className="rounded border p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  {ev.description && <div className="text-sm mt-2">{ev.description}</div>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  ev.type === 'Holiday' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  ev.type === 'Meeting' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {ev.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Employee Directory */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Employee Management</h2>
        <UserManagementTable users={users} onUpdate={loadUsers} isAdmin={false} />
      </section>

      {/* Payroll Management Section */}
      <section className="rounded-lg border p-6 bg-card">
        <PayrollManagement isAdmin={false} />
      </section>
    </div>
  );
}
