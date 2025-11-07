"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function UserManagementTable({ users, onUpdate, isAdmin = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  return (
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
          {users.map(user => (
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
  );
}
