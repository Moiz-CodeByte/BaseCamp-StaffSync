"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Edit, Save, X, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PayrollManagement({ isAdmin = false }) {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Filters
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  
  // Generate Payroll Form
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    month: '',
    bonus: 0,
    deductions: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [payrollRes, usersRes] = await Promise.all([
        api.get('/api/payroll/list'),
        api.get('/api/users/list')
      ]);
      const allPayrolls = payrollRes.data.payrolls || [];
      const allUsers = usersRes.data.users || [];
      
      // Filter based on role
      if (isAdmin) {
        // Admin can see all users and payrolls
        setPayrolls(allPayrolls);
        setUsers(allUsers);
      } else {
        // HR can only see Employee payrolls and users
        const employeeUsers = allUsers.filter(u => u.role === 'Employee');
        const employeeIds = employeeUsers.map(u => u._id);
        const employeePayrolls = allPayrolls.filter(p => p.user && employeeIds.includes(p.user._id));
        setPayrolls(employeePayrolls);
        setUsers(employeeUsers);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = [...payrolls];
    
    if (filterMonth && filterMonth !== 'all') {
      filtered = filtered.filter(p => p.month === filterMonth);
    }
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterUser && filterUser !== 'all') {
      filtered = filtered.filter(p => p.user && String(p.user._id) === filterUser);
    }
    
    setFilteredPayrolls(filtered);
  }, [payrolls, filterMonth, filterStatus, filterUser]);

  const applyFilters = () => {
    let filtered = [...payrolls];
    
    if (filterMonth && filterMonth !== 'all') {
      filtered = filtered.filter(p => p.month === filterMonth);
    }
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterUser && filterUser !== 'all') {
      filtered = filtered.filter(p => p.user && String(p.user._id) === filterUser);
    }
    
    setFilteredPayrolls(filtered);
  };

  const generatePayroll = async (e) => {
    e.preventDefault();
    if (!generateForm.month) {
      toast.error('Please select a month');
      return;
    }
    
    try {
      const res = await api.post('/api/payroll/generate', generateForm);
      const results = res.data.results || [];
      const success = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok).length;
      
      toast.success(`Generated payroll for ${success} employee(s)${failed > 0 ? `, ${failed} failed` : ''}`);
      setShowGenerate(false);
      setGenerateForm({ month: '', bonus: 0, deductions: 0 });
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const startEdit = (payroll) => {
    setEditingId(payroll._id);
    setEditForm({
      basic_salary: payroll.basic_salary || 0,
      allowance: payroll.allowance || 0,
      bonus: payroll.bonus || 0,
      deductions: payroll.deductions || 0,
      leave_deduction: payroll.leave_deduction || 0,
      status: payroll.status || 'Pending',
      payslip_url: payroll.payslip_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      const response = await api.patch(`/api/payroll/${id}`, editForm);
      toast.success('Payroll updated successfully');
      setEditingId(null);
      setEditForm({});
      // Reload data to get fresh payroll list with updated values
      await loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update payroll');
    }
  };

  const deletePayroll = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
      await api.delete(`/api/payroll/${id}`);
      toast.success('Payroll deleted successfully');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete payroll');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'default',
      'Processing': 'outline',
      'Paid': 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getUniqueMonths = () => {
    const months = [...new Set(payrolls.map(p => p.month))];
    return months.sort().reverse();
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  if (loading) {
    return <div className="p-6">Loading payroll data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Payroll Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee salaries and payslips
          </p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          {showGenerate ? 'Cancel' : '+ Generate Payroll'}
        </Button>
      </div>

      {/* Generate Payroll Form */}
      {showGenerate && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Payroll</CardTitle>
            <CardDescription>Create payroll for all employees for a specific month</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={generatePayroll} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input 
                  placeholder="e.g., October 2025" 
                  value={generateForm.month}
                  onChange={(e) => setGenerateForm({...generateForm, month: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Bonus (Optional)</Label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={generateForm.bonus}
                  onChange={(e) => setGenerateForm({...generateForm, bonus: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Deductions (Optional)</Label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={generateForm.deductions}
                  onChange={(e) => setGenerateForm({...generateForm, deductions: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button type="submit" className="w-full">Generate</Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              This will use each employee&apos;s basic salary and allowance from their profile, 
              calculate leave deductions automatically, and apply the bonus/deductions specified.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {getUniqueMonths().map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setFilterMonth('all');
                setFilterStatus('all');
                setFilterUser('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records ({filteredPayrolls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayrolls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payroll records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Employee</th>
                    <th className="text-left p-2">Month</th>
                    <th className="text-right p-2">Basic</th>
                    <th className="text-right p-2">Allowance</th>
                    <th className="text-right p-2">Bonus</th>
                    <th className="text-right p-2">Deductions</th>
                    <th className="text-right p-2">Leave Ded.</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.map(payroll => {
                    if (!payroll.user) {
                      return null; // Skip payrolls without user data
                    }
                    return (
                    <tr key={payroll._id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">
                        <div>{payroll.user.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{payroll.user.email || 'N/A'}</div>
                      </td>
                      <td className="p-2">{payroll.month}</td>
                      
                      {editingId === payroll._id ? (
                        <>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              value={editForm.basic_salary}
                              onChange={(e) => setEditForm({...editForm, basic_salary: parseFloat(e.target.value) || 0})}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              value={editForm.allowance}
                              onChange={(e) => setEditForm({...editForm, allowance: parseFloat(e.target.value) || 0})}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              value={editForm.bonus}
                              onChange={(e) => setEditForm({...editForm, bonus: parseFloat(e.target.value) || 0})}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              value={editForm.deductions}
                              onChange={(e) => setEditForm({...editForm, deductions: parseFloat(e.target.value) || 0})}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              value={editForm.leave_deduction}
                              onChange={(e) => setEditForm({...editForm, leave_deduction: parseFloat(e.target.value) || 0})}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2 text-right font-bold">
                            Rs. {((editForm.basic_salary || 0) + (editForm.allowance || 0) + (editForm.bonus || 0) - (editForm.deductions || 0) - (editForm.leave_deduction || 0)).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <Select value={editForm.status} onValueChange={(val) => setEditForm({...editForm, status: val})}>
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Processing">Processing</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="w-4 h-4" />
                              </Button>
                              <Button size="sm" onClick={() => saveEdit(payroll._id)}>
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-right">Rs. {payroll.basic_salary?.toLocaleString() || 0}</td>
                          <td className="p-2 text-right text-green-600">+Rs. {payroll.allowance?.toLocaleString() || 0}</td>
                          <td className="p-2 text-right text-green-600">{payroll.bonus > 0 ? `+Rs. ${payroll.bonus.toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-right text-red-600">{payroll.deductions > 0 ? `-Rs. ${payroll.deductions.toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-right text-red-600">{payroll.leave_deduction > 0 ? `-Rs. ${payroll.leave_deduction.toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-right font-bold">Rs. {payroll.total_salary?.toLocaleString() || 0}</td>
                          <td className="p-2 text-center">{getStatusBadge(payroll.status)}</td>
                          <td className="p-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => startEdit(payroll)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button size="sm" variant="destructive" onClick={() => deletePayroll(payroll._id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
