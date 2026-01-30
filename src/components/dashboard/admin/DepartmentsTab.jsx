"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2, Users, Eye, X, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getUserLeaveLimits } from '@/lib/leave-calculations';

export default function DepartmentsTab({ departments, hrUsers, onUpdate, isAdmin = true, isManager = false }) {
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hr: '',
    reportingManager: ''
  });
  const [viewingDept, setViewingDept] = useState(null);
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [managers, setManagers] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('Annual');

  // Managers can only view, not edit
  const canEdit = isAdmin || (!isManager);
  const canDelete = isAdmin;

  // Fetch reporting managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const { api } = await import('@/lib/api');
        const { data } = await api.get('/api/users/list');
        const managerUsers = data.users.filter(u => u.role === 'Reporting Manager');
        setManagers(managerUsers);
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      }
    };
    fetchManagers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      hr: '',
      reportingManager: ''
    });
    setEditingDept(null);
    setShowForm(false);
  };

  const handleEdit = (dept) => {
    setFormData({
      name: dept.name,
      hr: dept.hr._id,
      reportingManager: dept.reportingManager?._id || ''
    });
    setEditingDept(dept);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDept) {
        await api.put(`/api/departments/${editingDept._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/api/departments', formData);
        toast.success('Department created successfully');
      }
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" department?`)) return;

    try {
      await api.delete(`/api/departments/${id}`);
      toast.success('Department deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleViewEmployees = async (dept) => {
    setViewingDept(dept);
    setLoadingEmployees(true);
    
    try {
      const response = await api.get('/api/users/list');
      const allUsers = response.data.users;
      
      // Filter employees by department and exclude Admin users
      const employees = allUsers.filter(user => {
        const userDeptId = typeof user.department === 'object' ? user.department?._id : user.department;
        return userDeptId === dept._id && user.role !== 'Admin';
      });
      
      setDeptEmployees(employees);
    } catch (error) {
      toast.error('Failed to load employees');
      setDeptEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const closeViewModal = () => {
    setViewingDept(null);
    setDeptEmployees([]);
  };

  const viewUserDetails = async (user) => {
    setLoadingStats(true);
    
    try {
      // Fetch updated user data and leaves
      const [userRes, leavesRes] = await Promise.all([
        api.get(`/api/users/${user._id}`),
        api.get(`/api/leaves/my?userId=${user._id}`)
      ]);
      
      const userData = userRes.data.user || user;
      
      // Attach the department's reportingManager from viewingDept if available
      if (viewingDept && viewingDept.reportingManager) {
        if (typeof userData.department === 'object') {
          userData.department.reportingManager = viewingDept.reportingManager;
        } else {
          // If department is just an ID, create object with reportingManager
          userData.department = {
            _id: userData.department,
            reportingManager: viewingDept.reportingManager
          };
        }
      }
      
      setViewingUser(userData);
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

  const closeUserViewModal = () => {
    setViewingUser(null);
    setUserStats(null);
  };

  const getRoleBadge = (role) => {
    const variants = {
      'Admin': 'destructive',
      'HR': 'default',
      'Employee': 'secondary',
      'Reporting Manager': 'default'
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  const getDepartmentName = (dept) => {
    if (!dept) return '-';
    if (typeof dept === 'object' && dept.name) return dept.name;
    const deptObj = departments.find(d => d._id === dept);
    return deptObj ? deptObj.name : (typeof dept === 'string' ? dept : '-');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            {isManager ? 'View your department information' : 'Manage departments and their HR assignments'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Department</>}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>{editingDept ? 'Edit Department' : 'Create New Department'}</CardTitle>
            <CardDescription>
              {editingDept ? 'Update department information' : 'Add a new department to your organization'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engineering, Sales, Marketing"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr">Assigned HR *</Label>
                  {isAdmin ? (
                    <Select
                      value={formData.hr}
                      onValueChange={(value) => setFormData({ ...formData, hr: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select HR" />
                      </SelectTrigger>
                      <SelectContent>
                        {hrUsers.map((hr) => (
                          <SelectItem key={hr._id} value={hr._id}>
                            {hr.name} ({hr.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={hrUsers.find(hr => hr._id === formData.hr)?.name || 'Not Assigned'}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Only Admin can change the assigned HR for departments
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportingManager">Reporting Manager (Optional)</Label>
                <Select
                  value={formData.reportingManager || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, reportingManager: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reporting Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign a reporting manager to this department
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDept ? 'Update Department' : 'Create Department'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" />
                      {dept.employeeCount || 0} employees
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(dept)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(dept._id, dept.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Assigned HR</p>
                <Badge variant="secondary">
                  {dept.hr?.name || 'Not assigned'}
                </Badge>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleViewEmployees(dept)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Employees
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Employees Modal */}
      {viewingDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employees in {viewingDept.name}</CardTitle>
                  <CardDescription>
                    {loadingEmployees ? 'Loading...' : `${deptEmployees.length} employee(s)`}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeViewModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              {loadingEmployees ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading employees...</p>
                </div>
              ) : deptEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employees</h3>
                  <p className="text-muted-foreground">
                    This department has no employees assigned yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptEmployees.map((employee) => (
                    <div
                      key={employee._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                        {employee.designation && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {employee.designation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Badge variant={employee.role === 'Admin' ? 'default' : employee.role === 'HR' ? 'secondary' : 'outline'}>
                          {employee.role}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewUserDetails(employee)}
                          className="flex-1 sm:flex-initial"
                        >
                          <Eye className="w-4 h-4 sm:mr-1" />
                          <span className="sm:inline">View Details</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {departments.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Departments Yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first department
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Department
          </Button>
        </Card>
      )}

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4" onClick={closeUserViewModal}>
          <div className="bg-background w-full h-full sm:h-auto sm:rounded-lg sm:shadow-xl sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b p-4 md:p-6 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-base md:text-xl flex-shrink-0">
                    {viewingUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-base md:text-2xl font-bold truncate">{viewingUser.name}</h2>
                      {getRoleBadge(viewingUser.role)}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">{viewingUser.email}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={closeUserViewModal} className="flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Basic Information */}
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-3 md:p-4 border-b">
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                    Basic Information
                  </h3>
                </div>
                <div className="p-3 md:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</p>
                      <p className="text-sm font-medium break-words">{viewingUser.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gender</p>
                      <Badge variant="outline">{viewingUser.gender || 'Not specified'}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium break-all">{viewingUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                      {getRoleBadge(viewingUser.role)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium break-words">{getDepartmentName(viewingUser.department)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Designation</p>
                      <p className="text-sm font-medium break-words">{viewingUser.designation || '-'}</p>
                    </div>
                    {viewingUser.role === 'Employee' && (() => {
                      const calculatedLimits = getUserLeaveLimits(viewingUser);
                      return (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annual Leave Limit</p>
                            <p className="text-xl md:text-2xl font-bold text-emerald-600">{calculatedLimits.annual_leave} <span className="text-xs md:text-sm font-normal text-muted-foreground">days/year</span></p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sick Leave Limit</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600">{calculatedLimits.sick_leave} <span className="text-xs md:text-sm font-normal text-muted-foreground">days/year</span></p>
                          </div>
                          {viewingUser.gender === 'Female' && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maternity Leave Limit</p>
                              <p className="text-xl md:text-2xl font-bold text-pink-600">{calculatedLimits.maternity_leave} <span className="text-xs md:text-sm font-normal text-muted-foreground">days/year</span></p>
                            </div>
                          )}
                          {viewingUser.gender === 'Male' && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paternity Leave Limit</p>
                              <p className="text-xl md:text-2xl font-bold text-blue-600">{calculatedLimits.paternity_leave} <span className="text-xs md:text-sm font-normal text-muted-foreground">days/year</span></p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Entitlement Date</p>
                            <p className="text-sm font-medium">{viewingUser.leave_entitlement_date ? new Date(viewingUser.leave_entitlement_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'January 1, 2026'}</p>
                            <p className="text-xs text-muted-foreground">Date when leave calculation started</p>
                          </div>
                        </>
                      );
                    })()}
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
                </div>
              </div>

              {/* Leave Statistics */}
              {viewingUser.role === 'Employee' && (
              loadingStats ? (
                <div className="rounded-lg border bg-card shadow-sm">
                  <div className="p-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <span className="ml-3 text-muted-foreground">Loading statistics...</span>
                    </div>
                  </div>
                </div>
              ) : userStats && (
                <>
                  {/* Leave Balance Cards */}
                  <div className="rounded-lg border bg-card shadow-sm">
                    <div className="p-3 md:p-4 border-b">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                          Leave Balance (Current Year)
                        </h3>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          <button
                            onClick={() => setLeaveFilter('Annual')}
                            className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Annual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Annual
                          </button>
                          <button
                            onClick={() => setLeaveFilter('Sick')}
                            className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              leaveFilter === 'Sick'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Sick
                          </button>
                          {viewingUser.gender === 'Female' && (
                            <button
                              onClick={() => setLeaveFilter('Maternity')}
                              className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                leaveFilter === 'Maternity'
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              Maternity
                            </button>
                          )}
                          {viewingUser.gender === 'Male' && (
                            <button
                              onClick={() => setLeaveFilter('Paternity')}
                              className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                leaveFilter === 'Paternity'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              Paternity
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      {(() => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        
                        const leaveLimit = viewingUser.leave_limit ?? 10;
                        const sickLeaveLimit = viewingUser.sick_leave_limit ?? 3;
                        const maternityLeaveLimit = viewingUser.maternity_leave_limit ?? 0;
                        const paternityLeaveLimit = viewingUser.paternity_leave_limit ?? 2;
                        const earnedLeaves = leaveLimit;
                        const earnedSickLeaves = sickLeaveLimit;
                        const earnedMaternityLeaves = maternityLeaveLimit;
                        const earnedPaternityLeaves = paternityLeaveLimit;
                        
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
                        
                        const usedThisYear = approvedLeaveDaysCurrentYear;
                        const usedSickThisYear = approvedSickLeaveDaysCurrentYear;
                        const usedMaternityThisYear = approvedMaternityLeaveDaysCurrentYear;
                        const usedPaternityThisYear = approvedPaternityLeaveDaysCurrentYear;
                        const remainingLeaves = earnedLeaves - usedThisYear;
                        const remainingSickLeaves = earnedSickLeaves - usedSickThisYear;
                        const remainingMaternityLeaves = earnedMaternityLeaves - usedMaternityThisYear;
                        const remainingPaternityLeaves = earnedPaternityLeaves - usedPaternityThisYear;
                        
                        const displayedEarned = leaveFilter === 'Annual' ? earnedLeaves : leaveFilter === 'Sick' ? earnedSickLeaves : leaveFilter === 'Maternity' ? earnedMaternityLeaves : earnedPaternityLeaves;
                        const displayedUsed = leaveFilter === 'Annual' ? usedThisYear : leaveFilter === 'Sick' ? usedSickThisYear : leaveFilter === 'Maternity' ? usedMaternityThisYear : usedPaternityThisYear;
                        const displayedRemaining = leaveFilter === 'Annual' ? remainingLeaves : leaveFilter === 'Sick' ? remainingSickLeaves : leaveFilter === 'Maternity' ? remainingMaternityLeaves : remainingPaternityLeaves;
                        const displayedLimit = leaveFilter === 'Annual' ? (viewingUser.leave_limit ?? 10) : leaveFilter === 'Sick' ? (viewingUser.sick_leave_limit ?? 3) : leaveFilter === 'Maternity' ? (viewingUser.maternity_leave_limit ?? 0) : (viewingUser.paternity_leave_limit ?? 2);
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className={`p-3 rounded-lg border ${
                                  leaveFilter === 'Annual'
                                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
                                    : leaveFilter === 'Sick'
                                    ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900'
                                    : leaveFilter === 'Maternity'
                                    ? 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-900'
                                    : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
                                }`}>
                                  <p className={`text-xs mb-1 ${
                                    leaveFilter === 'Annual'
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : leaveFilter === 'Sick'
                                      ? 'text-purple-700 dark:text-purple-300'
                                      : leaveFilter === 'Maternity'
                                      ? 'text-pink-700 dark:text-pink-300'
                                      : 'text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {leaveFilter === 'Annual' ? 'Annual Leave Allocated' : leaveFilter === 'Sick' ? 'Sick Leave Allocated' : leaveFilter === 'Maternity' ? 'Maternity Leave Allocated' : 'Paternity Leave Allocated'}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    leaveFilter === 'Annual'
                                      ? 'text-blue-900 dark:text-blue-100'
                                      : leaveFilter === 'Sick'
                                      ? 'text-purple-900 dark:text-purple-100'
                                      : leaveFilter === 'Maternity'
                                      ? 'text-pink-900 dark:text-pink-100'
                                      : 'text-blue-900 dark:text-blue-100'
                                  }`}>
                                    {displayedEarned} day{displayedEarned !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                
                                <div className="p-3 rounded-lg bg-muted border">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {leaveFilter === 'Annual' ? 'Used This Year' : leaveFilter === 'Sick' ? 'Sick Leave Used' : leaveFilter === 'Maternity' ? 'Maternity Leave Used' : 'Paternity Leave Used'}
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
                                    {leaveFilter === 'Annual' ? 'Available' : leaveFilter === 'Sick' ? 'Sick Leave Available' : leaveFilter === 'Maternity' ? 'Maternity Leave Available' : 'Paternity Leave Available'}
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
                            </div>
                            
                            <div className="p-3 rounded-lg bg-muted/50 border">
                              <p className="text-xs text-muted-foreground">
                                💡 <strong>{leaveFilter === 'Annual' ? 'Leave Policy' : leaveFilter === 'Sick' ? 'Sick Leave Policy' : leaveFilter === 'Maternity' ? 'Maternity Leave Policy' : 'Paternity Leave Policy'}:</strong> {displayedLimit} {leaveFilter === 'Annual' ? 'annual leaves' : leaveFilter === 'Sick' ? 'sick days' : leaveFilter === 'Maternity' ? 'maternity days' : 'paternity days'} are allocated per year.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Leave History */}
                  <div className="rounded-lg border bg-card shadow-sm">
                    <div className="p-3 md:p-4 border-b">
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        Leave History
                      </h3>
                    </div>
                    <div className="p-3 md:p-4">
                      <div className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-600">{userStats.leaves?.length || 0}</p>
                          </div>
                          <div className="p-3 md:p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Approved</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600">
                              {userStats.leaves?.filter(l => l.status === 'Approved').length || 0}
                            </p>
                          </div>
                          <div className="p-3 md:p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-xl md:text-2xl font-bold text-yellow-600">
                              {userStats.leaves?.filter(l => l.status === 'Pending').length || 0}
                            </p>
                          </div>
                          <div className="p-3 md:p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Rejected</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600">
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
                    </div>
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
