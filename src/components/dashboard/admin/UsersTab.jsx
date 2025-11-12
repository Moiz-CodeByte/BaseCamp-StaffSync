"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserManagementTable from '@/components/dashboard/UserManagementTable';

export default function UsersTab({ users, onUpdate }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee', department: '' });

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const { api } = await import('@/lib/api');
      await api.post('/api/auth/register', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'Employee', department: '' });
      setShowAddUser(false);
      onUpdate();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {/* <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all system users and their roles
          </p>
        </div> */}
        <Button onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? 'Cancel' : '+ Add User'}
        </Button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-semibold mb-4">Add New User</h3>
          <form onSubmit={addUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input 
                  placeholder="Full Name" 
                  value={newUser.name} 
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={newUser.email} 
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <Input 
                  type="password" 
                  placeholder="Password" 
                  value={newUser.password} 
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <select 
                  className="w-full px-3 py-2 rounded-md border bg-background" 
                  value={newUser.role} 
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="Employee">Employee</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <Input 
                  placeholder="Department" 
                  value={newUser.department} 
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })} 
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">Create User</Button>
          </form>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-lg border bg-card p-6">
        <UserManagementTable users={users} onUpdate={onUpdate} isAdmin={true} />
      </div>
    </div>
  );
}
