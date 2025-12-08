"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Send, AlertCircle, Clock, UserPlus, Mail, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

  // Calculate earned leaves based on current month (dynamic based on leave_limit)
  const earnedLeaves = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (Jan-Dec)
    
    const leaveLimit = me?.leave_limit || 12; // Use leave_limit from user model
    const monthlyAccrual = leaveLimit / 12; // Leaves earned per month
    const maxPerHalf = leaveLimit / 2; // Maximum leaves per half-year
    
    // Determine which half of the year we're in
    // First half: Jan-Jun (months 0-5)
    // Second half: Jul-Dec (months 6-11)
    const isSecondHalf = currentMonth >= 6;
    
    if (isSecondHalf) {
      // Second half: July to December
      // Calculate months elapsed in second half (July=1, Aug=2, ..., Dec=6)
      const monthsInHalf = (currentMonth - 6) + 1;
      return Math.min(Math.floor(monthsInHalf * monthlyAccrual), maxPerHalf);
    } else {
      // First half: January to June
      // Calculate months elapsed in first half (Jan=1, Feb=2, ..., Jun=6)
      const monthsInHalf = currentMonth + 1;
      return Math.min(Math.floor(monthsInHalf * monthlyAccrual), maxPerHalf);
    }
  }, [me?.leave_limit]);

  // Calculate approved leave days for current half only
  const approvedLeaveDaysCurrentHalf = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const isSecondHalf = currentMonth >= 6;
    
    // Define date range for current half
    let halfStartDate, halfEndDate;
    if (isSecondHalf) {
      // July 1 to Dec 31
      halfStartDate = new Date(currentYear, 6, 1);
      halfEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
    } else {
      // Jan 1 to June 30
      halfStartDate = new Date(currentYear, 0, 1);
      halfEndDate = new Date(currentYear, 5, 30, 23, 59, 59);
    }
    
    return myLeaves
      .filter(l => {
        if (l.status !== 'Approved') return false;
        const leaveStart = new Date(l.startDate);
        // Only count leaves that started in current half
        return leaveStart >= halfStartDate && leaveStart <= halfEndDate;
      })
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

  // Calculate available leave balance (earned - used in current half)
  const remainingLeaves = useMemo(() => {
    return earnedLeaves - approvedLeaveDaysCurrentHalf;
  }, [earnedLeaves, approvedLeaveDaysCurrentHalf]);

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
    
    // Check if duration exceeds earned leaves for current half
    if (days > 0) {
      const maxPerHalf = Math.floor((me?.leave_limit || 12) / 2);
      
      // Check if duration exceeds max per half
      if (days > maxPerHalf) {
        errors.push(`⚠️ Duration (${days} days) exceeds maximum ${maxPerHalf} days per half-year`);
      }
      
      // Check if approved leaves + new request exceeds earned leaves
      if (approvedLeaveDaysCurrentHalf + days > earnedLeaves) {
        errors.push(`⚠️ ALERT: Total leave days (${approvedLeaveDaysCurrentHalf + days}) would exceed your earned leaves (${earnedLeaves}). You have only ${remainingLeaves} days available.`);
      }
    }
    
    return errors;
  }, [formData.startDate, formData.endDate, earnedLeaves, approvedLeaveDaysCurrentHalf, remainingLeaves, hasPendingLeaves]);

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
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Earned This Period</p>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {earnedLeaves} day{earnedLeaves !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{((me?.leave_limit || 12) / 12).toFixed(1)} per month</p>
              </div>
              
              <div className="p-3 rounded-lg bg-muted border">
                <p className="text-xs text-muted-foreground mb-1">Used This Period</p>
                <p className="text-sm font-medium">
                  {approvedLeaveDaysCurrentHalf} day{approvedLeaveDaysCurrentHalf !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().getMonth() >= 6 ? 'Jul-Dec' : 'Jan-Jun'}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg border ${
                remainingLeaves < 0 ? 'bg-destructive/10 border-destructive/50' : 
                remainingLeaves === 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900' : 
                'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className={`text-sm font-medium ${
                  remainingLeaves < 0 ? 'text-destructive' : 
                  remainingLeaves === 0 ? 'text-orange-600 dark:text-orange-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {remainingLeaves} day{remainingLeaves !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max {Math.floor((me?.leave_limit || 12) / 2)}/half</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Leave Policy:</strong> You earn {((me?.leave_limit || 12) / 12).toFixed(1)} leave{((me?.leave_limit || 12) / 12) !== 1 ? 's' : ''} per month. Maximum {Math.floor((me?.leave_limit || 12) / 2)} leaves per half-year (Jan-Jun & Jul-Dec). Unused leaves from previous period are not carried forward.
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
