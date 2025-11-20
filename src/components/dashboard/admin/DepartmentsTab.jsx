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
    reportingManagers: [],
    hr: ''
  });
  const [newManager, setNewManager] = useState({ name: '', email: '' });

  const resetForm = () => {
    setFormData({
      name: '',
      reportingManagers: [],
      hr: ''
    });
    setNewManager({ name: '', email: '' });
    setEditingDept(null);
    setShowForm(false);
  };

  const handleEdit = (dept) => {
    setFormData({
      name: dept.name,
      reportingManagers: dept.reportingManagers || [],
      hr: dept.hr._id
    });
    setEditingDept(dept);
    setShowForm(true);
  };

  const addManager = () => {
    if (!newManager.name.trim() || !newManager.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newManager.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setFormData({
      ...formData,
      reportingManagers: [...formData.reportingManagers, { ...newManager }]
    });
    setNewManager({ name: '', email: '' });
  };

  const removeManager = (index) => {
    setFormData({
      ...formData,
      reportingManagers: formData.reportingManagers.filter((_, i) => i !== index)
    });
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

              <div className="space-y-3">
                <Label>Reporting Managers</Label>
                
                {/* List of added managers */}
                {formData.reportingManagers.length > 0 && (
                  <div className="space-y-2">
                    {formData.reportingManagers.map((manager, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{manager.name}</p>
                          <p className="text-xs text-muted-foreground">{manager.email}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeManager(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new manager form */}
                <div className="grid gap-2 md:grid-cols-2 p-3 border rounded-lg">
                  <Input
                    placeholder="Manager name"
                    value={newManager.name}
                    onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  />
                  <Input
                    type="email"
                    placeholder="Manager email"
                    value={newManager.email}
                    onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addManager}
                    className="md:col-span-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manager
                  </Button>
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
                <p className="text-xs text-muted-foreground font-medium">Reporting Managers</p>
                {dept.reportingManagers && dept.reportingManagers.length > 0 ? (
                  <div className="space-y-2">
                    {dept.reportingManagers.map((manager, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{manager.name}</p>
                          <p className="text-muted-foreground text-xs break-all">{manager.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No managers assigned</p>
                )}
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
