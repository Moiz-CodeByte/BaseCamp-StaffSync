"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PayrollGenerateForm({ onSuccess, onCancel }) {
  const [generateForm, setGenerateForm] = useState({
    month: '',
    bonus: 0,
    deductions: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);

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
      const res = await api.post('/api/payroll/generate', generateForm);
      const results = res.data.results || [];
      const success = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok).length;
      
      toast.success(`Generated payroll for ${success} employee(s)${failed > 0 ? `, ${failed} failed` : ''}`);
      setGenerateForm({ month: '', bonus: 0, deductions: 0 });
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
          Create payroll for all employees for a specific month. 
          Current month: {getCurrentMonth()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
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
            This will use each employee&apos;s basic salary and allowance from their profile, 
            calculate leave deductions based on attendance, and generate payroll records.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
