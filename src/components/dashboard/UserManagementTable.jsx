"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Search, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function UserManagementTable({ users, departments = [], onUpdate, isAdmin = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const startEdit = (user) => {
    setEditingId(user._id);
    // Extract department ID if it's an object
    const deptId = typeof user.department === 'object' ? user.department?._id : user.department;
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      department: deptId || '',
      role: user.role || 'Employee',
      designation: user.designation || '',
      basic_salary: user.basic_salary || 0,
      allowance: user.allowance || 0,
      leave_limit: user.leave_limit || 12,
      reportingManagers: user.reportingManagers || []
    });
  };

  const getAvailableManagers = (user) => {
    // Get managers from user's department
    const userDeptId = typeof user.department === 'object' ? user.department?._id : user.department;
    const userDept = departments.find(d => d._id === userDeptId);
    return userDept?.reportingManagers || [];
  };

  const toggleManager = (manager) => {
    const currentManagers = editForm.reportingManagers || [];
    const exists = currentManagers.find(m => m.email === manager.email);
    
    if (exists) {
      setEditForm({
        ...editForm,
        reportingManagers: currentManagers.filter(m => m.email !== manager.email)
      });
    } else {
      setEditForm({
        ...editForm,
        reportingManagers: [...currentManagers, { name: manager.name, email: manager.email }]
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      // Ensure reportingManagers is always included, even if empty
      const updatePayload = {
        ...editForm,
        reportingManagers: editForm.reportingManagers || []
      };
      const response = await api.patch(`/api/users/${id}`, updatePayload);
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

  const deleteUser = async (id, userName) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will remove all associated data including:\n- Attendance records\n- Leave requests\n- Payroll history`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/api/users/${id}`);
      toast.success(`User "${userName}" deleted successfully`);
      // Call parent's onUpdate to refresh the users list
      if (onUpdate) {
        await onUpdate();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete user');
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

  // Get department name by ID or object
  const getDepartmentName = useMemo(() => {
    return (dept) => {
      if (!dept) return '-';
      // If it's already populated with name
      if (typeof dept === 'object' && dept.name) return dept.name;
      // If it's an ID, find in departments list
      const deptObj = departments.find(d => d._id === dept);
      return deptObj ? deptObj.name : (typeof dept === 'string' ? dept : '-');
    };
  }, [departments]);

  // Filter users based on search and department
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter (name, email, department)
      const deptName = getDepartmentName(user.department);
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Department filter - handle both ID and populated object
      const userDeptId = typeof user.department === 'object' ? user.department?._id : user.department;
      const matchesDepartment = departmentFilter === 'all' || userDeptId === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [users, searchQuery, departmentFilter, getDepartmentName]);

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
                <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} employees
      </div>

      {/* Empty State or Cards */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">No users found</p>
          <p className="text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <div key={user._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
              {editingId === user._id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Input 
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="font-semibold"
                          placeholder="Name"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(user._id)}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
                      <Input 
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</Label>
                      <Select value={editForm.department} onValueChange={(val) => setEditForm({...editForm, department: val === 'none' ? '' : val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Designation</Label>
                      <Input 
                        value={editForm.designation || ''}
                        onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                        placeholder="e.g. Senior Developer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</Label>
                      <Input 
                        type="number"
                        value={editForm.leave_limit}
                        onChange={(e) => setEditForm({...editForm, leave_limit: parseInt(e.target.value) || 12})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</Label>
                      <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Employee">Employee</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="md:col-span-3">

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporting Managers</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableManagers(users.find(u => u._id === editingId) || {}).length > 0 ? (
                          getAvailableManagers(users.find(u => u._id === editingId) || {}).map((manager, idx) => {
                            const isSelected = (editForm.reportingManagers || []).some(m => m.email === manager.email);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleManager(manager)}
                                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted hover:bg-muted/70'
                                }`}
                              >
                                <span className="truncate">{manager.name}</span>
                                {isSelected ? <UserMinus className="w-4 h-4 ml-2 flex-shrink-0" /> : <UserPlus className="w-4 h-4 ml-2 flex-shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground col-span-2">No managers in department</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {isAdmin && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteUser(user._id, user.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-4 ${user.role === 'Employee' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium">{getDepartmentName(user.department)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Designation</p>
                      <p className="text-sm font-medium">{user.designation || '-'}</p>
                    </div>

                    {user.role === 'Employee' && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned HR</p>
                        {user.department && typeof user.department === 'object' && user.department.hr ? (
                          <Badge variant="secondary" className="text-xs">
                            {user.department.hr.name}
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">No HR assigned</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</p>
                      <p className="text-2xl font-bold text-primary">{user.leave_limit || 12} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporting Managers</p>
                      {user.reportingManagers && user.reportingManagers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.reportingManagers.map((manager, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" title={manager.email}>
                              {manager.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No managers assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
