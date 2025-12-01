"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Search, UserPlus, UserMinus } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function HRUsersTab({ users, departments = [], onUpdate, me }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Get departments where this HR is assigned
  const myDepartments = useMemo(() => {
    if (!me?._id) return [];
    return departments.filter(dept => dept.hr?._id === me._id || dept.hr === me._id);
  }, [departments, me]);

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({
      leave_limit: user.leave_limit || 12,
      reportingManagers: user.reportingManagers || []
    });
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
      await api.patch(`/api/users/${id}`, updatePayload);
      toast.success('User updated successfully');
      setEditingId(null);
      setEditForm({});
      if (onUpdate) {
        await onUpdate();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update user');
    }
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

  const getAvailableManagers = (user) => {
    // Get managers from user's department
    const userDept = departments.find(d => {
      const deptId = typeof user.department === 'object' ? user.department?._id : user.department;
      return d._id === deptId;
    });
    return userDept?.reportingManagers || [];
  };

  const getRoleBadge = (role) => {
    const variants = {
      'Admin': 'destructive',
      'HR': 'default',
      'Employee': 'secondary'
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

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

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filter out HR and Admin users
      if (user.role === 'HR' || user.role === 'Admin') {
        return false;
      }
      
      // Only show employees from HR's assigned departments
      const userDeptId = typeof user.department === 'object' ? user.department?._id : user.department;
      const isInMyDepartment = myDepartments.some(dept => dept._id === userDeptId);
      if (!isInMyDepartment) {
        return false;
      }
      
      const deptName = getDepartmentName(user.department);
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Department filter - handle both ID and populated object
      const matchesDepartment = departmentFilter === 'all' || userDeptId === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [users, searchQuery, departmentFilter, getDepartmentName, myDepartments]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <h3 className="text-lg font-bold">Employee Management ({users.filter(u => u.role === 'Employee').length})</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage employee leave limits and reporting managers</p>
        </div>
        
        <div className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Employees</Label>
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
              <Label htmlFor="department">Department Filter</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All My Departments</SelectItem>
                  {myDepartments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.filter(u => u.role === 'Employee').length} employees
          </div>
        </div>
      </div>

      {/* Users Cards */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No employees found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user._id} className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
              {editingId === user._id ? (
                // Edit Mode
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{user.name}</h4>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(user._id)} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Edit Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Department</Label>
                      <div className="p-2 rounded bg-muted text-sm">
                        {getDepartmentName(user.department)}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Role</Label>
                      <div className="p-2 rounded bg-muted">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="leave_limit" className="text-xs text-muted-foreground mb-2 block">Leave Limit (days/year)</Label>
                      <Input 
                        id="leave_limit"
                        type="number"
                        value={editForm.leave_limit}
                        onChange={(e) => setEditForm({...editForm, leave_limit: parseInt(e.target.value) || 12})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Reporting Managers */}
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-semibold mb-3 block">Reporting Managers</Label>
                    {getAvailableManagers(user).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getAvailableManagers(user).map((manager, idx) => {
                          const isSelected = (editForm.reportingManagers || []).some(m => m.email === manager.email);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleManager(manager)}
                              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground shadow-sm' 
                                  : 'bg-muted hover:bg-muted/70 border'
                              }`}
                            >
                              {isSelected ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                              <span className="truncate">{manager.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded bg-muted/50 text-sm text-muted-foreground italic text-center">
                        No managers available in this department
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{user.name}</h4>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="text-sm font-medium">{getDepartmentName(user.department)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Leave Limit</p>
                      <p className="text-sm font-medium">
                        <span className="text-2xl font-bold text-primary">{user.leave_limit || 12}</span>
                        <span className="text-muted-foreground ml-1">days/year</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reporting Managers</p>
                      {user.reportingManagers && user.reportingManagers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.reportingManagers.map((manager, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" title={manager.email}>
                              {manager.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No managers assigned</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
