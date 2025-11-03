"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmployeeDashboard() {
  const [me, setMe] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState({ totalDays: 0, pendingLeaves: 0, approvedLeaves: 0 });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [{ data: meData }, { data: attData }, { data: leaveData }, { data: payData }] = await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/attendance/my'),
          api.get('/api/leaves/my'),
          api.get('/api/payroll/mine'),
        ]);
        if (!ignore) {
          setMe(meData.user);
          const attRecords = attData.records || [];
          const leaveList = leaveData.leaves || [];
          setAttendance(attRecords);
          setLeaves(leaveList);
          setPayslips(payData.payslips || []);
          
          // Find today's attendance
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayRecord = attRecords.find(a => {
            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          });
          setTodayAttendance(todayRecord || null);

          setStats({
            totalDays: attRecords.length,
            pendingLeaves: leaveList.filter(l => l.status === 'Pending').length,
            approvedLeaves: leaveList.filter(l => l.status === 'Approved').length,
          });
        }
      } catch (e) {
        if (!ignore) setStatus(e?.response?.data?.message || e.message);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const checkIn = async () => {
    setStatus('');
    try {
      await api.post('/api/attendance/checkin');
      const { data } = await api.get('/api/attendance/my');
      const attRecords = data.records || [];
      setAttendance(attRecords);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attRecords.find(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      setTodayAttendance(todayRecord || null);
      setStats(prev => ({ ...prev, totalDays: attRecords.length }));
    } catch (e) { setStatus(e?.response?.data?.message || e.message); }
  };

  const checkOut = async () => {
    setStatus('');
    try {
      await api.post('/api/attendance/checkout');
      const { data } = await api.get('/api/attendance/my');
      const attRecords = data.records || [];
      setAttendance(attRecords);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attRecords.find(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      setTodayAttendance(todayRecord || null);
    } catch (e) { setStatus(e?.response?.data?.message || e.message); }
  };

  const requestLeave = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await api.post('/api/leaves/request', leaveForm);
      const { data } = await api.get('/api/leaves/my');
      const leaveList = data.leaves || [];
      setLeaves(leaveList);
      setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
      setStats(prev => ({
        ...prev,
        pendingLeaves: leaveList.filter(l => l.status === 'Pending').length,
        approvedLeaves: leaveList.filter(l => l.status === 'Approved').length,
      }));
    } catch (e2) { setStatus(e2?.response?.data?.message || e2.message); }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Employee Dashboard</h1>

      {/* Profile Card */}
      {me && (
        <section className="rounded-lg border bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-6">
          <h2 className="text-xl font-semibold mb-3">My Profile</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium mt-1">{me.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium mt-1">{me.email}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Role</div>
              <div className="font-medium mt-1">{me.role}</div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="text-sm text-muted-foreground">Total Attendance Days</div>
          <div className="text-3xl font-bold mt-2">{stats.totalDays}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-6">
          <div className="text-sm text-muted-foreground">Pending Leaves</div>
          <div className="text-3xl font-bold mt-2">{stats.pendingLeaves}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6">
          <div className="text-sm text-muted-foreground">Approved Leaves</div>
          <div className="text-3xl font-bold mt-2">{stats.approvedLeaves}</div>
        </div>
      </div>

      {/* Attendance Section */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Attendance</h2>
        <div className="mb-4 p-4 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-2">Today&apos;s Status</div>
          {todayAttendance ? (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Check-in:</span> {todayAttendance.checkInAt ? new Date(todayAttendance.checkInAt).toLocaleTimeString() : '-'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Check-out:</span> {todayAttendance.checkOutAt ? new Date(todayAttendance.checkOutAt).toLocaleTimeString() : '-'}
              </div>
            </div>
          ) : (
            <div className="text-sm">Not checked in yet</div>
          )}
        </div>
        <div className="flex gap-3 mb-6">
          <Button className="bg-green-600 text-white hover:bg-green-700" onClick={checkIn}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Check In
          </Button>
          <Button variant="outline" onClick={checkOut}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Check Out
          </Button>
        </div>
        <h3 className="font-medium mb-3">Recent Attendance</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {attendance.slice(0, 10).map(a => (
            <div key={a._id} className="rounded border p-3 text-sm hover:bg-muted/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    In: {a.checkInAt ? new Date(a.checkInAt).toLocaleTimeString() : '-'} • Out: {a.checkOutAt ? new Date(a.checkOutAt).toLocaleTimeString() : '-'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  a.status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leave Management */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
        <form onSubmit={requestLeave} className="grid gap-3 md:grid-cols-5 mb-6">
          <select className="px-3 py-2 rounded-md border bg-background" value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}>
            <option value="Annual">Annual</option>
            <option value="Sick">Sick</option>
            <option value="Casual">Casual</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <Input type="date" placeholder="Start Date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
          <Input type="date" placeholder="End Date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
          <Input placeholder="Reason" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <Button type="submit" className="bg-primary text-primary-foreground">Submit Request</Button>
        </form>
        <h3 className="font-medium mb-3">My Leave History</h3>
        <div className="grid gap-2">
          {leaves.map(l => (
            <div key={l._id} className="rounded border p-4 hover:bg-muted/50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.type}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      l.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      l.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                  </div>
                  {l.reason && <div className="text-sm mt-2">{l.reason}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payslips */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">My Payslips</h2>
        {payslips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payslips available yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {payslips.map(p => (
              <div key={`${p.year}-${p.month}`} className="rounded border p-4 hover:bg-muted/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-semibold text-lg">{new Date(p.year, p.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Payslip
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Basic:</span><span>Rs. {p.basic}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Allowances:</span><span>Rs. {p.allowances}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deductions:</span><span>Rs. {p.deductions}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-2"><span>Net Salary:</span><span className="text-green-600 dark:text-green-400">Rs. {p.net}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {status && <p className="text-sm text-red-600">{status}</p>}
    </div>
  );
}
