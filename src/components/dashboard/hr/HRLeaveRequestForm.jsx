"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Send, AlertCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function HRLeaveRequestForm({ me, onSuccess, myLeaves = [] }) {
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate approved leave days
  const approvedLeaveDays = useMemo(() => {
    return myLeaves
      .filter(l => l.status === 'Approved')
      .reduce((total, leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }, 0);
  }, [myLeaves]);

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  // Calculate remaining leave balance
  const remainingLeaves = useMemo(() => {
    return (me?.leave_limit || 0) - approvedLeaveDays;
  }, [me?.leave_limit, approvedLeaveDays]);

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = calculateDays();
    
    if (formData.startDate) {
      const start = new Date(formData.startDate);
      
      // Check if start date is before today
      if (start < today) {
        errors.push('Start date cannot be in the past');
      }
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      // Check if end date is less than start date
      if (end < start) {
        errors.push('End date cannot be earlier than start date');
      }
    }
    
    // Check if duration exceeds leave limit
    if (days > 0 && me?.leave_limit) {
      if (days > me.leave_limit) {
        errors.push(`Duration (${days} days) exceeds your leave limit (${me.leave_limit} days)`);
      }
      
      // Check if approved leaves + new request exceeds leave limit
      if (approvedLeaveDays + days > me.leave_limit) {
        errors.push(`Total leave days would exceed your limit. You have ${remainingLeaves} days remaining`);
      }
    }
    
    return errors;
  }, [formData.startDate, formData.endDate, me?.leave_limit, approvedLeaveDays, remainingLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    // Validate before submission
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/leaves/request', formData);
      toast.success(`Leave request submitted successfully (${days} day${days !== 1 ? 's' : ''})`);
      setFormData({
        type: 'Annual',
        startDate: '',
        endDate: '',
        reason: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = calculateDays();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Request Leave</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a leave request to Admin for approval
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            New Leave Request
          </CardTitle>
          <CardDescription>
            Your leave requests will be reviewed by Admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Casual">Casual Leave</SelectItem>
                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <div className={`flex items-center gap-2 p-2 rounded-md border ${
                  validationErrors.length > 0 && days > 0
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-muted/50'
                }`}>
                  <Clock className={`h-4 w-4 ${
                    validationErrors.length > 0 && days > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                  <span className={`font-medium ${
                    validationErrors.length > 0 && days > 0 ? 'text-destructive' : ''
                  }`}>
                    {days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : 'Select dates'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Provide a reason for your leave request (optional)"
                rows={3}
              />
            </div>

            {me && me.leave_limit && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-medium">Annual Leave Limit:</span> {me.leave_limit} days
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  remainingLeaves < 0 ? 'bg-destructive/10 border-destructive/50' : 
                  remainingLeaves === 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900' : 
                  'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
                }`}>
                  <p className={`text-sm font-medium ${
                    remainingLeaves < 0 ? 'text-destructive' : 
                    remainingLeaves === 0 ? 'text-orange-600 dark:text-orange-400' : 
                    'text-green-600 dark:text-green-400'
                  }`}>
                    Remaining: {remainingLeaves} day{remainingLeaves !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive mb-2">Cannot Submit Leave Request:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm text-destructive">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  type: 'Annual',
                  startDate: '',
                  endDate: '',
                  reason: ''
                })}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting || validationErrors.length > 0}>
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
