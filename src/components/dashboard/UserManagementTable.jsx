"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function UserManagementTable({ users, onUpdate, isAdmin = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      department: user.department || '',
      role: user.role || 'Employee',
      basic_salary: user.basic_salary || 0,
      allowance: user.allowance || 0,
      leave_limit: user.leave_limit || 12
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      const response = await api.patch(`/api/users/${id}`, editForm);
      toast.success('User updated successfully');
      setEditingId(null);
      setEditForm({});
      // Call parent's onUpdate to refresh the users list
      if (onUpdate) {
        await onUpdate();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update user');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      'Admin': 'destructive',
      'HR': 'default',
      'Employee': 'secondary'
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  // Get unique departments from users
  const departments = useMemo(() => {
    const depts = [...new Set(users.map(u => u.department).filter(Boolean))];
    return depts.sort();
  }, [users]);

  // Filter users based on search and department
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter (name, email, department)
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Department filter
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [users, searchQuery, departmentFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-64">
          <Label htmlFor="department">Department</Label>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger id="department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} employees
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Department</th>
            <th className="text-left p-2">Role</th>
            <th className="text-right p-2">Basic Salary</th>
            <th className="text-right p-2">Allowance</th>
            <th className="text-right p-2">Leave Limit</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user._id} className="border-b hover:bg-muted/50">
              {editingId === user._id ? (
                <>
                  <td className="p-2">
                    <Input 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      value={editForm.department}
                      onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    {isAdmin ? (
                      <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Employee">Employee</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(editForm.role)
                    )}
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      value={editForm.basic_salary}
                      onChange={(e) => setEditForm({...editForm, basic_salary: parseFloat(e.target.value) || 0})}
                      className="w-28"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      value={editForm.allowance}
                      onChange={(e) => setEditForm({...editForm, allowance: parseFloat(e.target.value) || 0})}
                      className="w-28"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      value={editForm.leave_limit}
                      onChange={(e) => setEditForm({...editForm, leave_limit: parseInt(e.target.value) || 12})}
                      className="w-24"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(user._id)}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2 text-muted-foreground">{user.email}</td>
                  <td className="p-2">{user.department || '-'}</td>
                  <td className="p-2">{getRoleBadge(user.role)}</td>
                  <td className="p-2 text-right">Rs. {(user.basic_salary || 0).toLocaleString()}</td>
                  <td className="p-2 text-right text-green-600">+Rs.{(user.allowance || 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{user.leave_limit || 12} days</td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
