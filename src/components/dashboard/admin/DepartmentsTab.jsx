"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2, Users, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function DepartmentsTab({ departments, hrUsers, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    reportingManagerName: '',
    reportingManagerEmail: '',
    hr: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      reportingManagerName: '',
      reportingManagerEmail: '',
      hr: ''
    });
    setEditingDept(null);
    setShowForm(false);
  };

  const handleEdit = (dept) => {
    setFormData({
      name: dept.name,
      reportingManagerName: dept.reportingManagerName,
      reportingManagerEmail: dept.reportingManagerEmail,
      hr: dept.hr._id
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage departments and their reporting structure
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Department</>}
        </Button>
      </div>

      {showForm && (
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
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Reporting Manager Name *</Label>
                  <Input
                    id="managerName"
                    value={formData.reportingManagerName}
                    onChange={(e) => setFormData({ ...formData, reportingManagerName: e.target.value })}
                    placeholder="Manager's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">Reporting Manager Email *</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.reportingManagerEmail}
                    onChange={(e) => setFormData({ ...formData, reportingManagerEmail: e.target.value })}
                    placeholder="manager@example.com"
                    required
                  />
                </div>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(dept)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(dept._id, dept.name)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Reporting Manager</p>
                    <p className="text-muted-foreground">{dept.reportingManagerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground break-all">{dept.reportingManagerEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Assigned HR</p>
                <Badge variant="secondary">
                  {dept.hr?.name || 'Not assigned'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
