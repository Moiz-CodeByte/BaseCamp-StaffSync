"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Send, AlertCircle, Clock, UserPlus, Mail, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Calculate business days (excluding weekends)
const calculateBusinessDays = (startDate, endDate) => {
  let start, end;
  if (typeof startDate === 'string') {
    start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  } else {
    start = new Date(startDate);
  }
  if (typeof endDate === 'string') {
    end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');
  } else {
    end = new Date(endDate);
  }
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

export default function HRLeaveRequestForm({ me, onSuccess, myLeaves = [] }) {
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
    additionalRecipients: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });

  // Calculate earned leaves based on days from entitlement date to today (annual basis)
  const earnedLeaves = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Use leaveEntitlementDate if set, otherwise default to Jan 1 of current year
    let entitlementDate = me?.leaveEntitlementDate 
      ? new Date(me.leaveEntitlementDate)
      : new Date(currentYear, 0, 1);
    
    // If entitlement date is in previous year, use Jan 1 of current year
    if (entitlementDate.getFullYear() < currentYear) {
      entitlementDate = new Date(currentYear, 0, 1);
    }
    
    const daysFromEntitlementToToday = Math.floor((now - entitlementDate) / (1000 * 60 * 60 * 24)) + 1;
    const leaveLimit = me?.leave_limit || 10;
    const earned = Math.round((daysFromEntitlementToToday * leaveLimit) / 365);
    return earned;
  }, [me]);

  // Calculate earned sick leaves
  const earnedSickLeaves = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let entitlementDate = me?.leaveEntitlementDate 
      ? new Date(me.leaveEntitlementDate)
      : new Date(currentYear, 0, 1);
    
    // If entitlement date is in previous year, use Jan 1 of current year
    if (entitlementDate.getFullYear() < currentYear) {
      entitlementDate = new Date(currentYear, 0, 1);
    }
    
    const daysFromEntitlementToToday = Math.floor((now - entitlementDate) / (1000 * 60 * 60 * 24)) + 1;
    const sickLeaveLimit = me?.sick_leave_limit || 3;
    const earned = Math.round((daysFromEntitlementToToday * sickLeaveLimit) / 365);
    return earned;
  }, [me]);

  // Calculate approved leave days for current year only (excluding sick leaves)
  const approvedLeaveDaysCurrentYear = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Define date range for current year (Jan 1 to Dec 31)
    const yearStartDate = new Date(currentYear, 0, 1);
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const systemRecordedDays = myLeaves
      .filter(l => {
        if (l.status !== 'Approved') return false;
        if (l.type === 'Sick') return false; // Exclude sick leaves
        const leaveStart = new Date(l.startDate);
        // Only count leaves that started in current year
        return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
      })
      .reduce((total, leave) => {
        const days = calculateBusinessDays(leave.startDate, leave.endDate);
        return total + days;
      }, 0);
    
    return systemRecordedDays;
  }, [myLeaves]);

  // Calculate approved sick leave days for current year only
  const approvedSickLeaveDaysCurrentYear = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const yearStartDate = new Date(currentYear, 0, 1);
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const systemRecordedDays = myLeaves
      .filter(l => {
        if (l.status !== 'Approved') return false;
        if (l.type !== 'Sick') return false; // Only sick leaves
        const leaveStart = new Date(l.startDate);
        return leaveStart >= yearStartDate && leaveStart <= yearEndDate;
      })
      .reduce((total, leave) => {
        const days = calculateBusinessDays(leave.startDate, leave.endDate);
        return total + days;
      }, 0);
    
    return systemRecordedDays;
  }, [myLeaves]);

  const calculateDays = useCallback(() => {
    if (formData.startDate && formData.endDate) {
      return calculateBusinessDays(formData.startDate, formData.endDate);
    }
    return 0;
  }, [formData.startDate, formData.endDate]);

  // Calculate available leave balance (earned - used in current year)
  const remainingLeaves = useMemo(() => {
    return earnedLeaves - approvedLeaveDaysCurrentYear;
  }, [earnedLeaves, approvedLeaveDaysCurrentYear]);

  // Calculate available sick leave balance
  const remainingSickLeaves = useMemo(() => {
    return earnedSickLeaves - approvedSickLeaveDaysCurrentYear;
  }, [earnedSickLeaves, approvedSickLeaveDaysCurrentYear]);

  // Check for pending leaves
  const hasPendingLeaves = useMemo(() => {
    return myLeaves.some(leave => leave.status === 'Pending');
  }, [myLeaves]);

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = calculateDays();
    
    // Check for pending leaves
    if (hasPendingLeaves) {
      errors.push('You already have a pending leave request. Please wait for approval before submitting another.');
    }
    
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
    
    // Check if duration exceeds earned leaves for current year
    if (days > 0) {
      if (formData.type === 'Sick') {
        // Validation for sick leaves
        const maxSickPerYear = me?.sick_leave_limit || 3;
        
        if (days > maxSickPerYear) {
          errors.push(`⚠️ Duration (${days} days) exceeds maximum ${maxSickPerYear} sick days per year`);
        }
        
        if (approvedSickLeaveDaysCurrentYear + days > earnedSickLeaves) {
          errors.push(`⚠️ ALERT: Total sick leave days (${approvedSickLeaveDaysCurrentYear + days}) would exceed your earned sick leaves (${earnedSickLeaves}). You have only ${remainingSickLeaves} sick days available.`);
        }
      } else {
        // Validation for annual/casual leaves
        const maxPerYear = me?.leave_limit || 10;
        
        if (days > maxPerYear) {
          errors.push(`⚠️ Duration (${days} days) exceeds maximum ${maxPerYear} days per year`);
        }
        
        if (approvedLeaveDaysCurrentYear + days > earnedLeaves) {
          errors.push(`⚠️ ALERT: Total leave days (${approvedLeaveDaysCurrentYear + days}) would exceed your earned leaves (${earnedLeaves}). You have only ${remainingLeaves} days available.`);
        }
      }
    }
    
    return errors;
  }, [formData.startDate, formData.endDate, earnedLeaves, approvedLeaveDaysCurrentYear, remainingLeaves, hasPendingLeaves, calculateDays, me?.leave_limit]);

  const addRecipient = () => {
    if (!newRecipient.name.trim() || !newRecipient.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newRecipient.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (formData.additionalRecipients.some(r => r.email === newRecipient.email)) {
      toast.error('This email is already added');
      return;
    }
    
    setFormData({
      ...formData,
      additionalRecipients: [...formData.additionalRecipients, { ...newRecipient }]
    });
    setNewRecipient({ name: '', email: '' });
    toast.success('Recipient added');
  };

  const removeRecipient = (index) => {
    setFormData({
      ...formData,
      additionalRecipients: formData.additionalRecipients.filter((_, i) => i !== index)
    });
    toast.success('Recipient removed');
  };

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
        reason: '',
        additionalRecipients: []
      });
      setNewRecipient({ name: '', email: '' });
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
            <FileText className="h-5 w-5" />
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

            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Additional Email Recipients (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Add people who should receive email notifications about this leave request
              </p>
              
              {/* List of added recipients */}
              {formData.additionalRecipients && formData.additionalRecipients.length > 0 && (
                <div className="space-y-2">
                  {formData.additionalRecipients.map((recipient, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground">{recipient.email}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRecipient(index)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add recipient form */}
              <div className="grid gap-2 md:grid-cols-2 p-3 border rounded-lg bg-muted/30">
                <Input
                  placeholder="Recipient name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Recipient email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                />
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRecipient}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className={`p-3 rounded-lg border ${
                formData.type === 'Sick'
                  ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900'
                  : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
              }`}>
                <p className={`text-xs mb-1 ${
                  formData.type === 'Sick'
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {formData.type === 'Sick' ? 'Sick Leave Earned' : 'Earned This Year'}
                </p>
                <p className={`text-sm font-medium ${
                  formData.type === 'Sick'
                    ? 'text-purple-900 dark:text-purple-100'
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {formData.type === 'Sick' ? earnedSickLeaves : earnedLeaves} day{(formData.type === 'Sick' ? earnedSickLeaves : earnedLeaves) !== 1 ? 's' : ''}
                </p>
                <p className={`text-xs mt-1 ${
                  formData.type === 'Sick'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {formData.type === 'Sick' 
                    ? `${((me?.sick_leave_limit || 3) / 365).toFixed(3)} per day`
                    : `${((me?.leave_limit || 10) / 365).toFixed(2)} per day`
                  }
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-muted border">
                <p className="text-xs text-muted-foreground mb-1">
                  {formData.type === 'Sick' ? 'Sick Leave Used' : 'Used This Year'}
                </p>
                <p className="text-sm font-medium">
                  {formData.type === 'Sick' ? approvedSickLeaveDaysCurrentYear : approvedLeaveDaysCurrentYear} day{(formData.type === 'Sick' ? approvedSickLeaveDaysCurrentYear : approvedLeaveDaysCurrentYear) !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current year
                </p>
              </div>
              
              <div className={`p-3 rounded-lg border ${
                (formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves) < 0 ? 'bg-destructive/10 border-destructive/50' : 
                (formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves) === 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900' : 
                'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {formData.type === 'Sick' ? 'Sick Leave Available' : 'Available'}
                </p>
                <p className={`text-sm font-medium ${
                  (formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves) < 0 ? 'text-destructive' : 
                  (formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves) === 0 ? 'text-orange-600 dark:text-orange-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves} day{(formData.type === 'Sick' ? remainingSickLeaves : remainingLeaves) !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {formData.type === 'Sick' ? (me?.sick_leave_limit || 3) : (me?.leave_limit || 10)}/year
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>{formData.type === 'Sick' ? 'Sick Leave Policy' : 'Leave Policy'}:</strong> You earn{' '}
                {formData.type === 'Sick'
                  ? `${((me?.sick_leave_limit || 3) / 365).toFixed(3)} sick day${((me?.sick_leave_limit || 3) / 365) !== 1 ? 's' : ''} per day. Maximum ${me?.sick_leave_limit || 3} sick days per year.`
                  : `${((me?.leave_limit || 10) / 365).toFixed(2)} leave${((me?.leave_limit || 10) / 365) !== 1 ? 's' : ''} per day. Maximum ${me?.leave_limit || 10} leaves per year.`
                }
                {' '}Leaves are calculated from January 1st to today.
              </p>
            </div>

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
                onClick={() => {
                  setFormData({
                    type: 'Annual',
                    startDate: '',
                    endDate: '',
                    reason: '',
                    additionalRecipients: []
                  });
                  setNewRecipient({ name: '', email: '' });
                }}
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
