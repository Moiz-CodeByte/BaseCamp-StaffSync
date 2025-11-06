"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PayrollManagement from '@/components/dashboard/PayrollManagement';
import UserManagementTable from '@/components/dashboard/UserManagementTable';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, admin: 0, hr: 0, employee: 0 });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee' });

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/list');
      const userList = data.users || [];
      setUsers(userList);
      setStats({
        total: userList.length,
        admin: userList.filter(u => u.role === 'Admin').length,
        hr: userList.filter(u => u.role === 'HR').length,
        employee: userList.filter(u => u.role === 'Employee').length,
      });
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get('/api/users/list');
        const userList = data.users || [];
        if (!ignore) {
          setUsers(userList);
          setStats({
            total: userList.length,
            admin: userList.filter(u => u.role === 'Admin').length,
            hr: userList.filter(u => u.role === 'HR').length,
            employee: userList.filter(u => u.role === 'Employee').length,
          });
        }
      } catch {
        if (!ignore) setUsers([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'Employee' });
      setShowAddUser(false);
      loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
         
          <Button onClick={() => setShowAddUser(!showAddUser)} className="bg-primary text-primary-foreground">
            {showAddUser ? 'Cancel' : '+ Add User'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-3xl font-bold mt-2">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-6">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="text-3xl font-bold mt-2">{stats.admin}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6">
          <div className="text-sm text-muted-foreground">HR</div>
          <div className="text-3xl font-bold mt-2">{stats.hr}</div>
        </div>
        <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6">
          <div className="text-sm text-muted-foreground">Employees</div>
          <div className="text-3xl font-bold mt-2">{stats.employee}</div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Add New User</h2>
          <form onSubmit={addUser} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
            <Input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
            <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
            <select className="px-3 py-2 rounded-md border bg-background" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="Employee">Employee</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
            </select>
            <Button type="submit" className="bg-primary text-primary-foreground">Create User</Button>
          </form>
        </div>
      )}

      {/* User Management */}
      <section className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        <UserManagementTable users={users} onUpdate={loadUsers} isAdmin={true} />
      </section>

      {/* Payroll Section */}
      <section className="rounded-lg border p-6 bg-card">
        <PayrollManagement isAdmin={true} />
      </section>
    </div>
  );
}
