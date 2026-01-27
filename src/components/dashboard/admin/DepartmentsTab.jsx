"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2, Users, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Reporting Manager</p>
                <Badge variant="outline">
                  {dept.reportingManager?.name || 'Not assigned'}
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
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        {employee.designation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {employee.designation}
                          </p>
                        )}
                      </div>
                      <Badge variant={employee.role === 'Admin' ? 'default' : employee.role === 'HR' ? 'secondary' : 'outline'}>
                        {employee.role}
                      </Badge>
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
    </div>
  );
}
