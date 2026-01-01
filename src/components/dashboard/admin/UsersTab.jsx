"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import UserManagementTable from '@/components/dashboard/UserManagementTable';

export default function UsersTab({ users, departments = [], onUpdate }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '', leaveEntitlementDate: '' });

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const { api } = await import('@/lib/api');
      await api.post('/api/auth/register', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '', leaveEntitlementDate: '' });
      setShowAddUser(false);
      onUpdate();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">User Management ({users.length})</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage all system users and their roles</p>
            </div>
            <Button onClick={() => setShowAddUser(!showAddUser)}>
              {showAddUser ? 'Cancel' : '+ Add User'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="rounded-lg border p-6 bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-lg">+</span>
            </div>
            Add New User
          </h3>
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
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={newUser.password} 
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                <select 
                  className="w-full px-3 py-2 rounded-md border bg-background" 
                  value={newUser.department} 
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Designation</label>
                <Input 
                  placeholder="e.g. Senior Developer" 
                  value={newUser.designation} 
                  onChange={e => setNewUser({ ...newUser, designation: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Entitlement Date (Optional)</label>
                <Input 
                  type="date"
                  value={newUser.leaveEntitlementDate || ''} 
                  onChange={e => setNewUser({ ...newUser, leaveEntitlementDate: e.target.value })} 
                />
                <p className="text-xs text-muted-foreground mt-1">Date when leave entitlement starts (defaults to Jan 1)</p>
                {newUser.leaveEntitlementDate && (() => {
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const entitlementDate = new Date(newUser.leaveEntitlementDate);
                  const entitlementYear = entitlementDate.getFullYear();
                  const effectiveDate = entitlementYear === currentYear ? entitlementDate : new Date(currentYear, 0, 1);
                  const endOfYear = new Date(currentYear, 11, 31);
                  const daysFromEntitlementToYearEnd = Math.floor((endOfYear - effectiveDate) / (1000 * 60 * 60 * 24)) + 1;
                  const leaveLimit = 10; // Default leave limit for new users
                  const earnedLeaves = Math.round((daysFromEntitlementToYearEnd * leaveLimit) / 365);
                  return (
                    <div className="mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        📊 Calculated Earned Leaves: <span className="font-bold">{earnedLeaves}</span> days
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {daysFromEntitlementToYearEnd} days × {leaveLimit} ÷ 365
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">Create User</Button>
          </form>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6">
          <UserManagementTable users={users} departments={departments} onUpdate={onUpdate} isAdmin={true} />
        </div>
      </div>
    </div>
  );
}
