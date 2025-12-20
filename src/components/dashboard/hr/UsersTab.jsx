"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Search, UserPlus, UserMinus, Mail, Eye, Calendar, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function HRUsersTab({ users, departments = [], onUpdate, me }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewingUser, setViewingUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Get departments where this HR is assigned
  const myDepartments = useMemo(() => {
    if (!me?._id) return [];
    return departments.filter(dept => dept.hr?._id === me._id || dept.hr === me._id);
  }, [departments, me]);

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({
      designation: user.designation || '',
      leave_limit: user.leave_limit || 10,
      reportingManagers: user.reportingManagers || []
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const sendPasswordReset = async (id, userName, userEmail) => {
    const confirmed = confirm(`Send password reset email to "${userName}" (${userEmail})?`);
    if (!confirmed) return;

    try {
      await api.post(`/api/users/${id}/send-password-reset`);
      toast.success(`Password reset email sent to ${userEmail}`);
    } catch (error) {
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const viewUserDetails = async (user) => {
    setViewingUser(user);
    setLoadingStats(true);
    
    try {
      // Fetch user stats - leaves
      const leavesRes = await api.get(`/api/leaves/my?userId=${user._id}`);
      
      setUserStats({
        leaves: leavesRes.data?.leaves || []
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({ leaves: [] });
    } finally {
      setLoadingStats(false);
    }
  };

  const closeViewModal = () => {
    setViewingUser(null);
    setUserStats(null);
  };

  const startEditFromView = () => {
    if (viewingUser) {
      startEdit(viewingUser);
      closeViewModal();
    }
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <Label htmlFor="designation" className="text-xs text-muted-foreground mb-2 block">Designation</Label>
                      <Input 
                        id="designation"
                        value={editForm.designation || ''}
                        onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                        placeholder="e.g. Senior Developer"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="leave_limit" className="text-xs text-muted-foreground mb-2 block">Leave Limit (days/year)</Label>
                      <Input 
                        id="leave_limit"
                        type="number"
                        value={editForm.leave_limit}
                        onChange={(e) => setEditForm({...editForm, leave_limit: parseInt(e.target.value) || 10})}
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)} title="View Details">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => sendPasswordReset(user._id, user.name, user.email)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Send password reset email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="text-sm font-medium">{getDepartmentName(user.department)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Designation</p>
                      <p className="text-sm font-medium">{user.designation || '-'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Leave Limit</p>
                      <p className="text-sm font-medium">
                        <span className="text-2xl font-bold text-primary">{user.leave_limit || 10}</span>
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

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={closeViewModal}>
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b p-3 sm:p-4 md:p-6 z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl flex-shrink-0">
                    {viewingUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{viewingUser.name}</h2>
                      {getRoleBadge(viewingUser.role)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{viewingUser.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" onClick={startEditFromView} className="flex-1 sm:flex-none">
                    <Edit className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit Details</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={closeViewModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Basic Information
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</p>
                      <p className="text-sm font-medium">{viewingUser.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium">{viewingUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                      {getRoleBadge(viewingUser.role)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium">{getDepartmentName(viewingUser.department)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Designation</p>
                      <p className="text-sm font-medium">{viewingUser.designation || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</p>
                      <p className="text-2xl font-bold text-emerald-600">{viewingUser.leave_limit || 10} <span className="text-sm font-normal text-muted-foreground">days/year</span></p>
                    </div>
                    {viewingUser.createdAt && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Joined Date</p>
                        <p className="text-sm font-medium">{new Date(viewingUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}
                    {viewingUser.reportingManagers && viewingUser.reportingManagers.length > 0 && (
                      <div className="space-y-1 md:col-span-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporting Managers</p>
                        <div className="flex flex-wrap gap-1">
                          {viewingUser.reportingManagers.map((manager, idx) => (
                            <span key={idx} title={`${manager.name} - ${manager.email}`}>
                              <Badge variant="outline" className="text-xs cursor-help">
                                {manager.name}
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Leave Statistics */}
              {loadingStats ? (
                <div className="rounded-lg border bg-card shadow-sm">
                  <div className="p-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <span className="ml-3 text-muted-foreground">Loading statistics...</span>
                    </div>
                  </div>
                </div>
              ) : userStats && (
                <div className="rounded-lg border bg-card shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Leave History
                    </h3>
                  </div>
                  <div className="p-4">
                    {userStats.leaves && userStats.leaves.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Requests</p>
                            <p className="text-2xl font-bold text-blue-600">{userStats.leaves.length}</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Approved</p>
                            <p className="text-2xl font-bold text-green-600">
                              {userStats.leaves.filter(l => l.status === 'Approved').length}
                            </p>
                          </div>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {userStats.leaves.filter(l => l.status === 'Pending').length}
                            </p>
                          </div>
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">
                              {userStats.leaves.filter(l => l.status === 'Rejected').length}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">Recent Leave Requests</p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {userStats.leaves.slice(0, 10).map((leave, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                                <div>
                                  <p className="font-medium">{leave.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={
                                  leave.status === 'Approved' ? 'default' :
                                  leave.status === 'Pending' ? 'secondary' : 'destructive'
                                }>
                                  {leave.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No leave requests found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
