"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PayrollGenerateForm({ onSuccess, onCancel }) {
  const [generateForm, setGenerateForm] = useState({
    month: '',
    bonus: 0,
    deductions: 0,
    userId: 'all'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employees for the dropdown
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/api/users/list');
        setEmployees(data.users || []);
      } catch (e) {
        console.error('Failed to fetch employees:', e);
      }
    };
    fetchEmployees();
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!generateForm.month) {
      toast.error('Please enter a month');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        month: generateForm.month,
        bonus: generateForm.bonus,
        deductions: generateForm.deductions
      };
      
      // Only add userId if it's not 'all'
      if (generateForm.userId !== 'all') {
        payload.userId = generateForm.userId;
      }
      
      const res = await api.post('/api/payroll/generate', payload);
      const results = res.data.results || [];
      const success = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok).length;
      
      if (generateForm.userId !== 'all') {
        toast.success(`Generated payroll for ${results[0]?.name || 'employee'}${failed > 0 ? ' (failed)' : ''}`);
      } else {
        toast.success(`Generated payroll for ${success} employee(s)${failed > 0 ? `, ${failed} failed` : ''}`);
      }
      
      setGenerateForm({ month: '', bonus: 0, deductions: 0, userId: 'all' });
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Payroll</CardTitle>
        <CardDescription>
          Create payroll for {generateForm.userId === 'all' ? 'all employees' : 'a specific employee'} for a specific month. 
          Current month: {getCurrentMonth()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select 
                value={generateForm.userId} 
                onValueChange={(val) => setGenerateForm({...generateForm, userId: val})}
              >
                <SelectTrigger id="employee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Input 
                id="month"
                placeholder="e.g., November 2025" 
                value={generateForm.month}
                onChange={(e) => setGenerateForm({...generateForm, month: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus (Optional)</Label>
              <Input 
                id="bonus"
                type="number" 
                placeholder="0"
                value={generateForm.bonus}
                onChange={(e) => setGenerateForm({...generateForm, bonus: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions (Optional)</Label>
              <Input 
                id="deductions"
                type="number" 
                placeholder="0"
                value={generateForm.deductions}
                onChange={(e) => setGenerateForm({...generateForm, deductions: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button type="submit" disabled={isGenerating} className="flex-1">
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {generateForm.userId === 'all' 
              ? "This will use each employee's basic salary and allowance from their profile, calculate leave deductions based on attendance, and generate payroll records."
              : "This will use the selected employee's basic salary and allowance from their profile, calculate leave deductions based on attendance, and generate a payroll record."
            }
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
