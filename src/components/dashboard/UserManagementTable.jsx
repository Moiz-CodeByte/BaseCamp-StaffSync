"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Search, Trash2, UserPlus, UserMinus, Mail, Eye, Calendar, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function UserManagementTable({ users, departments = [], onUpdate, isAdmin = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewingUser, setViewingUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('Annual'); // 'Annual' or 'Sick'

  const startEdit = (user) => {
    console.log('UserManagementTable - startEdit called with user:', user);
    console.log('maternity_leave_limit:', user.maternity_leave_limit);
    console.log('paternity_leave_limit:', user.paternity_leave_limit);
    setEditingId(user._id);
    // Extract department ID if it's an object
    const deptId = typeof user.department === 'object' ? user.department?._id : user.department;
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      department: deptId || '',
      role: user.role || 'Employee',
      designation: user.designation || '',
      // basic_salary: user.basic_salary || 0,
      //allowance: user.allowance || 0,
      leave_limit: user.leave_limit ?? 10,
      sick_leave_limit: user.sick_leave_limit ?? 3,
      maternity_leave_limit: user.maternity_leave_limit ?? 0,
      paternity_leave_limit: user.paternity_leave_limit ?? 2
    });
    console.log('UserManagementTable - editForm set to:', {
      maternity_leave_limit: user.maternity_leave_limit ?? 0,
      paternity_leave_limit: user.paternity_leave_limit ?? 2
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      console.log('UserManagementTable - Saving user with payload:', editForm);
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

  const sendPasswordReset = async (id, userName, userEmail) => {
    if (!isAdmin) {
      toast.error('Only admins can send password reset emails');
      return;
    }

    const confirmed = window.confirm(
      `Send password reset email to "${userName}" (${userEmail})?\n\nA reset link will be sent that expires in 24 hours.`
    );

    if (!confirmed) return;

    try {
      await api.post(`/api/users/${id}/send-password-reset`);
      toast.success(`Password reset email sent to ${userEmail}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send password reset email');
    }
  };

  const viewUserDetails = async (user) => {
    setLoadingStats(true);
    
    try {
      // Fetch updated user data and leaves
      const [userRes, leavesRes] = await Promise.all([
        api.get(`/api/users/${user._id}`),
        api.get(`/api/leaves/my?userId=${user._id}`)
      ]);
      
      console.log('Fetched user data:', userRes.data.user);
      
      setViewingUser(userRes.data.user || user);
      setUserStats({
        leaves: leavesRes.data?.leaves || []
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setViewingUser(user);
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

  const deleteUser = async (id, userName) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will remove all associated data including:\n- Leave requests\n`
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
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
        <div className="w-full sm:w-64">
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
            <div key={user._id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-card">
              {editingId === user._id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input 
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="font-semibold"
                          placeholder="Name"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 sm:flex-none">
                        <X className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(user._id)} className="flex-1 sm:flex-none">
                        <Save className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Save</span>
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

                    {editForm.role === 'Employee' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={editForm.leave_limit}
                          onChange={(e) => setEditForm({...editForm, leave_limit: Math.max(0, parseInt(e.target.value) || 0)})}
                          className="w-full"
                        />
                      </div>
                    )}

                    {editForm.role === 'Employee' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sick Leave Limit</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={editForm.sick_leave_limit}
                          onChange={(e) => setEditForm({...editForm, sick_leave_limit: Math.max(0, parseInt(e.target.value) || 0)})}
                          className="w-full"
                        />
                      </div>
                    )}

                    {editForm.role === 'Employee' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maternity Leave Limit</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={editForm.maternity_leave_limit}
                          onChange={(e) => setEditForm({...editForm, maternity_leave_limit: Math.max(0, parseInt(e.target.value) || 0)})}
                          className="w-full"
                        />
                      </div>
                    )}

                    {editForm.role === 'Employee' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paternity Leave Limit</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={editForm.paternity_leave_limit}
                          onChange={(e) => setEditForm({...editForm, paternity_leave_limit: Math.max(0, parseInt(e.target.value) || 0)})}
                          className="w-full"
                        />
                      </div>
                    )}
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
                          <SelectItem value="Reporting Manager">Reporting Manager</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {editForm.role !== 'Admin' && (
                    <div className="md:col-span-3">
                      {/* Reporting managers section removed */}
                    </div>
                  )}
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold truncate">{user.name}</h4>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)} className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(user)} className="flex-1 sm:flex-none">
                        <Edit className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      {isAdmin && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => sendPasswordReset(user._id, user.name, user.email)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Send password reset email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteUser(user._id, user.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
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

                    {user.role !== 'Admin' && (
                      <>
                        {/* <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</p>
                          <p className="text-2xl font-bold text-primary">{user.leave_limit || 10} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                        </div> */}
                        {/* <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entitlement Date</p>
                          <p className="text-sm font-medium">
                            {user.leaveEntitlementDate 
                              ? new Date(user.leaveEntitlementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Jan 1'}
                          </p>
                        </div> */}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                    {viewingUser.role === 'Employee' && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Limit</p>
                        <p className="text-2xl font-bold text-emerald-600">{viewingUser.leave_limit || 12} <span className="text-sm font-normal text-muted-foreground">days/year</span></p>
                      </div>
                    )}
                    {viewingUser.role === 'Employee' && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sick Leave Limit</p>
                        <p className="text-2xl font-bold text-red-600">{viewingUser.sick_leave_limit || 3} <span className="text-sm font-normal text-muted-foreground">days/year</span></p>
                      </div>
                    )}
                    {viewingUser.role === 'Employee' && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maternity Leave Limit</p>
                        <p className="text-2xl font-bold text-pink-600">{viewingUser.maternity_leave_limit ?? 0} <span className="text-sm font-normal text-muted-foreground">days/year</span></p>
                      </div>
                    )}
                    {viewingUser.role === 'Employee' && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paternity Leave Limit</p>
                        <p className="text-2xl font-bold text-blue-600">{viewingUser.paternity_leave_limit ?? 2} <span className="text-sm font-normal text-muted-foreground">days/year</span></p>
                      </div>
                    )}
                   
                    {viewingUser.role === 'Employee' && viewingUser.department && typeof viewingUser.department === 'object' && viewingUser.department.hr && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned HR</p>
                        <span title={`${viewingUser.department.hr.name} - ${viewingUser.department.hr.email || 'No email'}`}>
                          <Badge variant="secondary" className="cursor-help">{viewingUser.department.hr.name}</Badge>
                        </span>
                      </div>
                    )}
                   
                    {viewingUser.createdAt && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Creation Date</p>
                        <p className="text-sm font-medium">{new Date(viewingUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              {loadingStats ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <span className="ml-3 text-muted-foreground">Loading statistics...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : userStats && viewingUser.role === 'Employee' && (
                <>
                  {/* Leave Balance Cards */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-600" />
                          Leave Balance (Current Year)
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setLeaveFilter('Annual')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Annual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Annual Leaves
                          </button>
                          <button
                            onClick={() => setLeaveFilter('Sick')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Sick'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Sick Leaves
                          </button>
                          <button
                            onClick={() => setLeaveFilter('Maternity')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Maternity'
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Maternity
                          </button>
                          <button
                            onClick={() => setLeaveFilter('Paternity')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Paternity'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Paternity
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        
                        // Fixed leave allocations (no formulas)
                        const leaveLimit = viewingUser.leave_limit || 10;
                        const sickLeaveLimit = viewingUser.sick_leave_limit || 3;
                        const earnedLeaves = leaveLimit; // Fixed allocation per year
                        const earnedSickLeaves = sickLeaveLimit; // Fixed allocation per year
                        
                        // Calculate business days function
                        const calculateBusinessDays = (startDate, endDate) => {
                          let start = new Date(startDate);
                          let end = new Date(endDate);
                          start.setHours(0, 0, 0, 0);
                          end.setHours(0, 0, 0, 0);
                          if (end < start) return 0;
                          let businessDays = 0;
                          const current = new Date(start);
                          while (current <= end) {
                            const dayOfWeek = current.getDay();
                            if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
                            current.setDate(current.getDate() + 1);
                          }
                          return businessDays;
                        };
                        
                        const yearStartDate = new Date(currentYear, 0, 1);
                        const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
                        
                        // Separate regular, sick and maternity leaves
                        const regularLeaves = (userStats.leaves || []).filter(l => l.type !== 'Sick Leave' && l.type !== 'Maternity' && l.type !== 'Paternity');
                        const sickLeaves = (userStats.leaves || []).filter(l => l.type === 'Sick Leave');
                        const maternityLeaves = (userStats.leaves || []).filter(l => l.type === 'Maternity');
                        const paternityLeaves = (userStats.leaves || []).filter(l => l.type === 'Paternity');
                        
                        const approvedLeaveDaysCurrentYear = regularLeaves
                          .filter(l => {
                            if (l.status !== 'Approved') return false;
                            const leaveStart = new Date(l.startDate);
                            return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
                          })
                          .reduce((total, leave) => {
                            const days = calculateBusinessDays(leave.startDate, leave.endDate);
                            return total + days;
                          }, 0);
                        
                        const approvedSickLeaveDaysCurrentYear = sickLeaves
                          .filter(l => {
                            if (l.status !== 'Approved') return false;
                            const leaveStart = new Date(l.startDate);
                            return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
                          })
                          .reduce((total, leave) => {
                            const days = calculateBusinessDays(leave.startDate, leave.endDate);
                            return total + days;
                          }, 0);
                        
                        const approvedMaternityLeaveDaysCurrentYear = maternityLeaves
                          .filter(l => {
                            if (l.status !== 'Approved') return false;
                            const leaveStart = new Date(l.startDate);
                            return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
                          })
                          .reduce((total, leave) => {
                            const days = calculateBusinessDays(leave.startDate, leave.endDate);
                            return total + days;
                          }, 0);
                        
                        const maternityLeaveLimit = viewingUser.maternity_leave_limit ?? 0;
                        const earnedMaternityLeaves = maternityLeaveLimit;
                        
                        const approvedPaternityLeaveDaysCurrentYear = paternityLeaves
                          .filter(l => {
                            if (l.status !== 'Approved') return false;
                            const leaveStart = new Date(l.startDate);
                            return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
                          })
                          .reduce((total, leave) => {
                            const days = calculateBusinessDays(leave.startDate, leave.endDate);
                            return total + days;
                          }, 0);
                        
                        const paternityLeaveLimit = viewingUser.paternity_leave_limit ?? 2;
                        const earnedPaternityLeaves = paternityLeaveLimit;
                        
                        const usedThisYear = approvedLeaveDaysCurrentYear;
                        const usedSickThisYear = approvedSickLeaveDaysCurrentYear;
                        const usedMaternityThisYear = approvedMaternityLeaveDaysCurrentYear;
                        const usedPaternityThisYear = approvedPaternityLeaveDaysCurrentYear;
                        const remainingLeaves = earnedLeaves - usedThisYear;
                        const remainingSickLeaves = earnedSickLeaves - usedSickThisYear;
                        const remainingMaternityLeaves = earnedMaternityLeaves - usedMaternityThisYear;
                        const remainingPaternityLeaves = earnedPaternityLeaves - usedPaternityThisYear;
                        
                        // Dynamic values based on filter
                        const displayedEarned = leaveFilter === 'Annual' ? earnedLeaves : leaveFilter === 'Sick' ? earnedSickLeaves : leaveFilter === 'Maternity' ? earnedMaternityLeaves : earnedPaternityLeaves;
                        const displayedUsed = leaveFilter === 'Annual' ? usedThisYear : leaveFilter === 'Sick' ? usedSickThisYear : leaveFilter === 'Maternity' ? usedMaternityThisYear : usedPaternityThisYear;
                        const displayedRemaining = leaveFilter === 'Annual' ? remainingLeaves : leaveFilter === 'Sick' ? remainingSickLeaves : leaveFilter === 'Maternity' ? remainingMaternityLeaves : remainingPaternityLeaves;
                        const displayedLimit = leaveFilter === 'Annual' ? (viewingUser.leave_limit ?? 10) : leaveFilter === 'Sick' ? (viewingUser.sick_leave_limit ?? 3) : leaveFilter === 'Maternity' ? (viewingUser.maternity_leave_limit ?? 0) : (viewingUser.paternity_leave_limit ?? 2);
                        
                        return (
                          <div className="space-y-3">
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className={`p-3 rounded-lg border ${
                                leaveFilter === 'Annual'
                                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
                                    : leaveFilter === 'Sick'
                                    ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900'
                                    : 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-900'
                              }`}>
                                <p className={`text-xs mb-1 ${
                                  leaveFilter === 'Annual'
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : leaveFilter === 'Sick'
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-pink-700 dark:text-pink-300'
                                }`}>
                                  {leaveFilter === 'Annual' ? 'Annual Leave Allocated' : leaveFilter === 'Sick' ? 'Sick Leave Allocated' : 'Maternity Leave Allocated'}                             </p>                             <p className={`text-sm font-medium ${
                                  leaveFilter === 'Annual'
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : leaveFilter === 'Sick'
                                    ? 'text-purple-900 dark:text-purple-100'
                                    : 'text-pink-900 dark:text-pink-100'
                                }`}>
                                  {displayedEarned} day{displayedEarned !== 1 ? 's' : ''}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  leaveFilter === 'Annual'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : leaveFilter === 'Sick'
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-pink-600 dark:text-pink-400'
                                }`}>
                                  {displayedLimit} days/year
                                </p>
                              </div>
                              
                              <div className="p-3 rounded-lg bg-muted border">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {leaveFilter === 'Annual' ? 'Used This Year' : leaveFilter === 'Sick' ? 'Sick Leave Used' : 'Maternity Leave Used'}
                                </p>
                                <p className="text-sm font-medium">
                                  {displayedUsed} day{displayedUsed !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Current year</p>
                              </div>
                              
                              <div className={`p-3 rounded-lg border ${
                                displayedRemaining < 0 ? 'bg-destructive/10 border-destructive/50' : 
                                displayedRemaining === 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900' : 
                                'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
                              }`}>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {leaveFilter === 'Annual' ? 'Available' : leaveFilter === 'Sick' ? 'Sick Leave Available' : 'Maternity Leave Available'}
                                </p>
                                <p className={`text-sm font-medium ${
                                  displayedRemaining < 0 ? 'text-destructive' : 
                                  displayedRemaining === 0 ? 'text-orange-600 dark:text-orange-400' : 
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {displayedRemaining} day{displayedRemaining !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Max {displayedLimit}/year</p>
                              </div>
                            </div>
                            
                            {/* <div className="p-3 rounded-lg bg-muted/50 border">
                              <p className="text-xs text-muted-foreground">
                                💡 <strong>{leaveFilter === 'Annual' ? 'Leave Policy' : 'Sick Leave Policy'}:</strong> Earns {((displayedLimit / 365)).toFixed(3)} {leaveFilter === 'Annual' ? 'leaves' : 'sick days'} per day. Maximum {displayedLimit} {leaveFilter === 'Annual' ? 'leaves' : 'sick days'} per year.
                              </p>
                            </div> */}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Leave Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Leave History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Requests</p>
                            <p className="text-2xl font-bold text-blue-600">{userStats.leaves?.length || 0}</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Approved</p>
                            <p className="text-2xl font-bold text-green-600">
                              {userStats.leaves?.filter(l => l.status === 'Approved').length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {userStats.leaves?.filter(l => l.status === 'Pending').length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">
                              {userStats.leaves?.filter(l => l.status === 'Rejected').length || 0}
                            </p>
                          </div>
                        </div>
                        {userStats.leaves && userStats.leaves.length > 0 && (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
